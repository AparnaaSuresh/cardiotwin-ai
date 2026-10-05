from enum import Enum
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    low = "Low"
    moderate = "Moderate"
    high = "High"


class PatientInput(BaseModel):
    age: float = Field(..., ge=1, le=120)
    sex: str = Field(..., examples=["Male", "Female"])
    systolic_bp: float = Field(..., ge=60, le=260)
    diastolic_bp: float = Field(..., ge=30, le=160)
    cholesterol: float = Field(..., ge=50, le=600)
    triglyceride: Optional[float] = Field(default=None, ge=20, le=1000)
    fasting_blood_sugar: Optional[float] = Field(default=None, ge=40, le=500)
    pulse_rate: Optional[float] = Field(default=None, ge=30, le=220)
    st_elevation: bool = False
    st_depression: bool = False
    t_inversion: bool = False
    lvh: bool = False
    rwma_region: Optional[str] = Field(default=None, examples=["Anterior", "Inferior", "None"])
    ef_tte: Optional[float] = Field(default=None, ge=5, le=90)


class FeatureImpact(BaseModel):
    feature: str
    impact: float
    direction: str


class TargetPrediction(BaseModel):
    probability: float
    risk_level: RiskLevel
    top_features: List[FeatureImpact]


class PredictionResponse(BaseModel):
    model_mode: str
    disclaimer: str
    predictions: Dict[str, TargetPrediction]


class HealthResponse(BaseModel):
    status: str
    model_mode: str


class ModelMetadataResponse(BaseModel):
    targets: List[str]
    required_model_artifacts: List[str]
    leakage_columns: List[str]
    model_mode: str
    notes: List[str]
