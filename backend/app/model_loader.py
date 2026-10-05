from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

import joblib


MODEL_DIR = Path(__file__).resolve().parents[1] / "models"
TARGETS = ("CAD", "LAD", "LCX", "RCA")


def load_artifacts() -> Dict[str, Any]:
    artifacts: Dict[str, Any] = {}
    models = {}
    preprocessors = {}
    feature_names = {}
    explainers = {}
    for target in TARGETS:
        model_path = MODEL_DIR / f"{target.lower()}_model.joblib"
        preprocessor_path = MODEL_DIR / f"{target.lower()}_preprocessor.joblib"
        feature_names_path = MODEL_DIR / f"{target.lower()}_feature_names.joblib"
        explainer_path = MODEL_DIR / f"{target.lower()}_explainer.joblib"
        if model_path.exists():
            models[target] = joblib.load(model_path)
        if preprocessor_path.exists():
            preprocessors[target] = joblib.load(preprocessor_path)
        if feature_names_path.exists():
            feature_names[target] = joblib.load(feature_names_path)
        if explainer_path.exists():
            explainers[target] = joblib.load(explainer_path)

    artifacts["models"] = models
    artifacts["preprocessors"] = preprocessors
    artifacts["feature_names"] = feature_names
    artifacts["explainers"] = explainers
    artifacts["ready"] = len(models) == len(TARGETS)
    return artifacts
