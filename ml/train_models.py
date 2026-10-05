from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline

try:
    from xgboost import XGBClassifier
except ImportError:  # pragma: no cover
    XGBClassifier = None

try:
    import shap
except ImportError:  # pragma: no cover
    shap = None

from preprocess import DatasetConfig, build_preprocessor, feature_columns, infer_binary_target, load_dataset


ROOT = Path(__file__).resolve().parents[1]
BACKEND_MODEL_DIR = ROOT / "backend" / "models"
REPORT_DIR = ROOT / "docs" / "model_reports"


def candidate_models():
    models = {
        "logistic_regression": LogisticRegression(max_iter=1000, class_weight="balanced"),
        "random_forest": RandomForestClassifier(
            n_estimators=300,
            random_state=42,
            class_weight="balanced",
            min_samples_leaf=2,
        ),
    }
    if XGBClassifier is not None:
        models["xgboost"] = XGBClassifier(
            n_estimators=160,
            max_depth=3,
            learning_rate=0.04,
            subsample=0.9,
            colsample_bytree=0.9,
            eval_metric="logloss",
            random_state=42,
        )
    return models


def evaluate(y_true, probabilities):
    predictions = (probabilities >= 0.5).astype(int)
    metrics = {
        "accuracy": accuracy_score(y_true, predictions),
        "precision": precision_score(y_true, predictions, zero_division=0),
        "recall": recall_score(y_true, predictions, zero_division=0),
        "f1": f1_score(y_true, predictions, zero_division=0),
        "confusion_matrix": confusion_matrix(y_true, predictions).tolist(),
    }
    if len(set(y_true)) > 1:
        metrics["roc_auc"] = roc_auc_score(y_true, probabilities)
    else:
        metrics["roc_auc"] = None
    return {key: round(value, 4) if isinstance(value, float) else value for key, value in metrics.items()}


def transformed_feature_names(preprocessor):
    return list(preprocessor.get_feature_names_out())


def train_for_target(df, target_name, target_column, features):
    y = infer_binary_target(df[target_column])
    X = df[features]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y if y.nunique() == 2 else None,
    )

    best_name = None
    best_pipeline = None
    best_score = -np.inf
    results = {}

    for model_name, model in candidate_models().items():
        pipeline = Pipeline(
            steps=[
                ("preprocessor", build_preprocessor(df, features)),
                ("model", model),
            ]
        )
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        scoring = {"f1": "f1", "roc_auc": "roc_auc", "recall": "recall"}
        scores = cross_validate(pipeline, X_train, y_train, cv=cv, scoring=scoring, error_score="raise")
        mean_auc = float(np.mean(scores["test_roc_auc"]))
        results[model_name] = {
            "cv_f1": float(np.mean(scores["test_f1"])),
            "cv_recall": float(np.mean(scores["test_recall"])),
            "cv_roc_auc": mean_auc,
        }
        if mean_auc > best_score:
            best_name = model_name
            best_score = mean_auc
            best_pipeline = pipeline

    assert best_pipeline is not None and best_name is not None
    best_pipeline.fit(X_train, y_train)
    probabilities = best_pipeline.predict_proba(X_test)[:, 1]
    holdout_metrics = evaluate(y_test, probabilities)

    preprocessor = best_pipeline.named_steps["preprocessor"]
    transformed_train = preprocessor.transform(X_train)
    if hasattr(transformed_train, "toarray"):
        transformed_train = transformed_train.toarray()
    model = best_pipeline.named_steps["model"]
    feature_names = transformed_feature_names(preprocessor)

    try:
        explainer = shap.Explainer(model, transformed_train, feature_names=feature_names) if shap is not None else None
    except Exception:
        explainer = None

    return {
        "target": target_name,
        "target_column": target_column,
        "best_model_name": best_name,
        "pipeline": best_pipeline,
        "model": model,
        "preprocessor": preprocessor,
        "feature_names": feature_names,
        "explainer": explainer,
        "model_comparison": results,
        "holdout_metrics": holdout_metrics,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path to Z-Alizadeh Sani extension CSV file.")
    parser.add_argument("--cad-target", default="Cath")
    parser.add_argument("--lad-target", default="LAD")
    parser.add_argument("--lcx-target", default="LCX")
    parser.add_argument("--rca-target", default="RCA")
    args = parser.parse_args()

    config = DatasetConfig(
        cad_target=args.cad_target,
        lad_target=args.lad_target,
        lcx_target=args.lcx_target,
        rca_target=args.rca_target,
    )
    df = load_dataset(args.data)
    targets = config.targets
    missing = [column for column in targets.values() if column not in df.columns]
    if missing:
        raise ValueError(f"Missing target columns after normalization: {missing}. Available: {list(df.columns)}")

    features = feature_columns(df, targets.values())
    BACKEND_MODEL_DIR.mkdir(parents=True, exist_ok=True)
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    summary = {"features": features, "targets": targets, "results": {}}
    shared_preprocessor_saved = False

    for target_name, target_column in targets.items():
        result = train_for_target(df, target_name, target_column, features)
        joblib.dump(result["pipeline"], BACKEND_MODEL_DIR / f"{target_name.lower()}_model.joblib")
        joblib.dump(result["preprocessor"], BACKEND_MODEL_DIR / f"{target_name.lower()}_preprocessor.joblib")
        joblib.dump(result["feature_names"], BACKEND_MODEL_DIR / f"{target_name.lower()}_feature_names.joblib")
        if result["explainer"] is not None:
            joblib.dump(result["explainer"], BACKEND_MODEL_DIR / f"{target_name.lower()}_explainer.joblib")
        summary["results"][target_name] = {
            "target_column": target_column,
            "best_model_name": result["best_model_name"],
            "model_comparison": result["model_comparison"],
            "holdout_metrics": result["holdout_metrics"],
        }

    (REPORT_DIR / "training_summary.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
