from __future__ import annotations

from typing import Dict, Iterable, List

import numpy as np
import pandas as pd

from .model_loader import TARGETS, load_artifacts
from .risk import probability_to_level
from .schemas import FeatureImpact, PatientInput, TargetPrediction


DISCLAIMER = (
    "Educational decision-support prototype only. This is not a medical diagnosis "
    "and must not replace evaluation by qualified clinicians."
)


def patient_to_frame(patient: PatientInput) -> pd.DataFrame:
    sex = "Male" if patient.sex.lower().startswith("m") else "Fmale"
    has_rwma = bool(patient.rwma_region and patient.rwma_region.lower() not in {"none", "normal", "nil", "0"})
    rwma_region = _rwma_to_dataset_code(patient.rwma_region)
    height_cm = 165.0
    weight_kg = 74.0
    bmi = weight_kg / ((height_cm / 100) ** 2)

    features = {
        "Age": patient.age,
        "Weight": weight_kg,
        "Length": height_cm,
        "Sex": sex,
        "BMI": round(bmi, 2),
        "DM": 1 if (patient.fasting_blood_sugar or 0) >= 126 else 0,
        "HTN": 1 if patient.systolic_bp >= 140 or patient.diastolic_bp >= 90 else 0,
        "Current_Smoker": 0,
        "EX_Smoker": 0,
        "FH": 0,
        "Obesity": "Y" if bmi >= 30 else "N",
        "CRF": "N",
        "CVA": "N",
        "Airway_disease": "N",
        "Thyroid_Disease": "N",
        "CHF": "N",
        "DLP": "Y" if patient.cholesterol >= 130 or (patient.triglyceride or 0) >= 150 else "N",
        "BP": patient.systolic_bp,
        "PR": patient.pulse_rate or 70.0,
        "Edema": 0,
        "Weak_Peripheral_Pulse": "N",
        "Lung_rales": "N",
        "Systolic_Murmur": "N",
        "Diastolic_Murmur": "N",
        "Typical_Chest_Pain": 0,
        "Dyspnea": "N",
        "Function_Class": 1 if has_rwma else 0,
        "Atypical": "N",
        "Nonanginal": "N",
        "Exertional_CP": "N",
        "LowTH_Ang": "N",
        "Q_Wave": 0,
        "St_Elevation": 1 if patient.st_elevation else 0,
        "St_Depression": 1 if patient.st_depression else 0,
        "Tinversion": 1 if patient.t_inversion else 0,
        "LVH": "Y" if patient.lvh else "N",
        "Poor_R_Progression": "N",
        "BBB": "N",
        "FBS": patient.fasting_blood_sugar or 98.0,
        "CR": 1.0,
        "TG": patient.triglyceride or 122.0,
        "LDL": patient.cholesterol,
        "HDL": 39.0,
        "BUN": 16.0,
        "ESR": 15.0,
        "HB": 13.2,
        "K": 4.2,
        "Na": 141.0,
        "WBC": 7100.0,
        "Lymph": 32.0,
        "Neut": 60.0,
        "PLT": 210.0,
        "EF_TTE": patient.ef_tte or 50.0,
        "Region_RWMA": rwma_region,
        "VHD": "N",
    }
    return pd.DataFrame([features])


def _rwma_to_dataset_code(region: str | None) -> int:
    if not region:
        return 0
    text = region.lower()
    if any(token in text for token in ("none", "normal", "nil")):
        return 0
    if "anterior" in text:
        return 1
    if "inferior" in text:
        return 2
    if "lateral" in text:
        return 3
    return 4


def _feature_impacts_from_scores(scores: Dict[str, float], top_n: int = 5) -> List[FeatureImpact]:
    ordered = sorted(scores.items(), key=lambda item: abs(item[1]), reverse=True)[:top_n]
    return [
        FeatureImpact(
            feature=_display_feature_name(name),
            impact=round(float(value), 4),
            direction="increases risk" if value >= 0 else "decreases risk",
        )
        for name, value in ordered
    ]


def _display_feature_name(name: str) -> str:
    cleaned = name
    for prefix in ("num__", "cat__"):
        if cleaned.startswith(prefix):
            cleaned = cleaned[len(prefix) :]
    return cleaned.replace("_", " ")


def _demo_probability(patient: PatientInput, target: str) -> tuple[float, Dict[str, float]]:
    scores: Dict[str, float] = {
        "Age": (patient.age - 45) * 0.008,
        "Systolic BP": (patient.systolic_bp - 120) * 0.004,
        "Total cholesterol": (patient.cholesterol - 180) * 0.0022,
        "ST elevation": 0.16 if patient.st_elevation else 0.0,
        "ST depression": 0.12 if patient.st_depression else 0.0,
        "T inversion": 0.08 if patient.t_inversion else 0.0,
        "LVH": 0.05 if patient.lvh else 0.0,
    }
    if patient.ef_tte is not None:
        scores["EF-TTE"] = (55 - patient.ef_tte) * 0.004
    if patient.rwma_region and patient.rwma_region.lower() not in {"none", "normal", "nil"}:
        scores["RWMA"] = 0.11

    target_bias = {
        "CAD": 0.05,
        "LAD": 0.11 if patient.rwma_region and "anterior" in patient.rwma_region.lower() else 0.02,
        "LCX": 0.04,
        "RCA": -0.03,
    }[target]
    logit = -0.85 + target_bias + sum(scores.values())
    probability = 1 / (1 + np.exp(-logit))
    return float(np.clip(probability, 0.03, 0.97)), scores


def _trained_predictions(patient: PatientInput, artifacts: Dict) -> Dict[str, TargetPrediction]:
    frame = patient_to_frame(patient)
    predictions: Dict[str, TargetPrediction] = {}

    for target in TARGETS:
        model = artifacts["models"][target]
        probability = float(model.predict_proba(frame)[0, 1])
        impacts = _trained_shap_impacts(target, frame, artifacts)
        predictions[target] = TargetPrediction(
            probability=round(probability, 4),
            risk_level=probability_to_level(probability),
            top_features=impacts,
        )
    return predictions


def _trained_shap_impacts(target: str, frame, artifacts: Dict) -> List[FeatureImpact]:
    explainer = artifacts.get("explainers", {}).get(target)
    preprocessor = artifacts.get("preprocessors", {}).get(target)
    feature_names: Iterable[str] = artifacts.get("feature_names", {}).get(target) or []
    if explainer is None or preprocessor is None or not feature_names:
        return []

    transformed = preprocessor.transform(frame)
    if hasattr(transformed, "toarray"):
        transformed = transformed.toarray()
    values = explainer(transformed)
    raw = values.values[0]
    if raw.ndim > 1:
        raw = raw[:, -1]
    scores = {name: float(value) for name, value in zip(feature_names, raw)}
    return _feature_impacts_from_scores(scores)


def predict_patient(patient: PatientInput) -> tuple[str, Dict[str, TargetPrediction]]:
    artifacts = load_artifacts()
    if artifacts["ready"]:
        return "trained-model", _trained_predictions(patient, artifacts)

    predictions = {}
    for target in TARGETS:
        probability, scores = _demo_probability(patient, target)
        predictions[target] = TargetPrediction(
            probability=round(probability, 4),
            risk_level=probability_to_level(probability),
            top_features=_feature_impacts_from_scores(scores),
        )
    return "demo-fallback", predictions
