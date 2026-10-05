from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .model_loader import load_artifacts
from .predict import DISCLAIMER, predict_patient
from .schemas import HealthResponse, PatientInput, PredictionResponse


app = FastAPI(
    title="CardioTwin AI API",
    description="CAD and vessel-specific risk prediction API for CardioTwin AI.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    artifacts = load_artifacts()
    return HealthResponse(
        status="ok",
        model_mode="trained-model" if artifacts["ready"] else "demo-fallback",
    )


@app.post("/predict", response_model=PredictionResponse)
def predict(patient: PatientInput) -> PredictionResponse:
    mode, predictions = predict_patient(patient)
    return PredictionResponse(
        model_mode=mode,
        disclaimer=DISCLAIMER,
        predictions=predictions,
    )

