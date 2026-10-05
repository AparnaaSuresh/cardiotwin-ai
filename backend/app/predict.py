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
    return pd.DataFrame([patient.model_dump()])


def _feature_impacts_from_scores(scores: Dict[str, float], top_n: int = 5) -> List[FeatureImpact]:
    ordered = sorted(scores.items(), key=lambda item: abs(item[1]), reverse=True)[:top_n]
    return [
        FeatureImpact(
            feature=name,
            impact=round(float(value), 4),
            direction="increases risk" if value >= 0 else "decreases risk",
        )
        for name, value in ordered
    ]


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
