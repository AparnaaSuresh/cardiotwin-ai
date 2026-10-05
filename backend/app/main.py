from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .model_loader import TARGETS
from .model_loader import load_artifacts
from .predict import DISCLAIMER, predict_patient
from .sample_patients import SAMPLE_PATIENTS
from .schemas import HealthResponse, ModelMetadataResponse, PatientInput, PredictionResponse


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


@app.get("/sample-patients")
def sample_patients() -> dict:
    return {name: patient.model_dump() for name, patient in SAMPLE_PATIENTS.items()}


@app.get("/model-metadata", response_model=ModelMetadataResponse)
def model_metadata() -> ModelMetadataResponse:
    artifacts = load_artifacts()
    required = []
    for target in TARGETS:
        lower = target.lower()
        required.extend(
            [
                f"{lower}_model.joblib",
                f"{lower}_preprocessor.joblib",
                f"{lower}_feature_names.joblib",
                f"{lower}_explainer.joblib",
            ]
        )
    return ModelMetadataResponse(
        targets=list(TARGETS),
        required_model_artifacts=required,
        leakage_columns=["LAD", "LCX", "RCA", "Cath", "CAD target column"],
        model_mode="trained-model" if artifacts["ready"] else "demo-fallback",
        notes=[
            "Demo fallback is only for integration testing.",
            "Real performance requires the official Z-Alizadeh Sani extension dataset.",
            "SHAP values explain model contribution, not medical causation.",
        ],
    )


@app.post("/predict", response_model=PredictionResponse)
def predict(patient: PatientInput) -> PredictionResponse:
    mode, predictions = predict_patient(patient)
    return PredictionResponse(
        model_mode=mode,
        disclaimer=DISCLAIMER,
        predictions=predictions,
    )
