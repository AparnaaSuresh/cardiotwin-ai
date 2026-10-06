# CardioTwin AI - Model Training Results

## Training Status

Real model training has been completed locally using the official UCI Extension of Z-Alizadeh Sani dataset.

Dataset:

```text
ml/data/z_alizadeh_sani_extension.csv
```

Dataset summary:

| Item | Value |
|---|---:|
| Records | 303 |
| Columns | 59 |
| Leakage-safe input features | 55 |
| Target columns | Cath, LAD, LCX, RCA |

The raw dataset and trained binary model artifacts are intentionally kept local and ignored by Git. This keeps the GitHub repository lightweight and avoids redistributing dataset/model files unnecessarily.

## Target Meaning

| Project Output | Dataset Target | Meaning |
|---|---|---|
| CAD | Cath | Overall coronary artery disease status |
| LAD | LAD | Left Anterior Descending artery stenosis |
| LCX | LCX | Left Circumflex artery stenosis |
| RCA | RCA | Right Coronary Artery stenosis |

## Model Selection Result

The training script compared Logistic Regression and Random Forest for each target using cross-validation, then selected the best model per output.

| Output | Best Model | Holdout Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---:|---:|---:|---:|---:|
| CAD | Random Forest | 0.8852 | 0.8750 | 0.9767 | 0.9231 | 0.8798 |
| LAD | Random Forest | 0.7869 | 0.7949 | 0.8611 | 0.8267 | 0.8378 |
| LCX | Random Forest | 0.6393 | 0.5556 | 0.4167 | 0.4762 | 0.7095 |
| RCA | Logistic Regression | 0.7213 | 0.6364 | 0.6087 | 0.6222 | 0.7391 |

## Interpretation

CAD and LAD are currently the strongest outputs. They show good recall, meaning they are better at catching positive/high-risk cases.

LCX and RCA are weaker than CAD and LAD. This is expected in a small 303-row medical dataset because vessel-specific labels have fewer positive examples and more complex patterns.

For hackathon presentation, the honest positioning is:

```text
Our strongest proof-of-concept is overall CAD and LAD risk prediction.
LCX and RCA are included as vessel-specific extensions, but need more data and tuning for clinical-grade reliability.
```

## Current Artifacts

The following model files exist locally:

```text
backend/models/cad_model.joblib
backend/models/lad_model.joblib
backend/models/lcx_model.joblib
backend/models/rca_model.joblib
```

Each output also has a saved preprocessor and feature-name artifact.

## SHAP Status

SHAP is integrated at the architecture level, but SHAP explainer artifacts were not generated in this training run because the `shap` package is not installed in the current environment.

| Item | Status |
|---|---|
| SHAP concept | Defined |
| SHAP backend support | Added |
| SHAP explainer artifact saving | Supported by training script |
| Actual SHAP artifacts | Pending |

Next command after installing SHAP:

```bash
cd ml
.\.venv\Scripts\python.exe -m pip install shap
.\.venv\Scripts\python.exe train_models.py --data data\z_alizadeh_sani_extension.csv
```

## What This Means For The Project

This project has moved from a demo-only scaffold to a real trained ML prototype.

The current model layer is good enough for:

- Hackathon prototype demonstration
- Conference-style proof-of-concept explanation
- Showing why vessel-specific risk mapping is useful
- Comparing classical ML against generic LLM-only prediction

It is not yet enough for:

- Clinical deployment
- Diagnosis
- Claims of medical-grade accuracy
- Replacing doctors or angiography

## Best Next Improvements

1. Generate SHAP explainer artifacts.
2. Add calibration curves and calibrated probabilities.
3. Improve LCX and RCA performance with tuning or ensemble methods.
4. Connect backend runtime to frontend dashboard.
5. Replace SVG placeholder with true Three.js heart visualization.
