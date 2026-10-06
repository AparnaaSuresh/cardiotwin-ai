# Project Tracking

## Current Status

The project has been started from scratch, connected to GitHub, and upgraded from a demo scaffold to a locally trained ML prototype.

Implemented:

- FastAPI backend skeleton
- Prediction schema
- Demo fallback predictor
- ML training script for the official dataset CSV
- React frontend dashboard
- SVG-based vessel risk visualization
- Project README
- GitHub repository connected and pushed
- Step-by-step implementation phases document
- Then-and-now progress report
- Dataset inspection script
- Sample patient API endpoint
- Model metadata API endpoint
- Dataset integration guide
- Official UCI dataset downloaded locally
- Official Excel dataset converted to CSV locally
- Dataset inspection completed
- Real model training completed locally
- Local trained artifacts generated for CAD, LAD, LCX, and RCA
- Model training results documented

Not yet implemented:

- Real SHAP artifacts from trained models
- True Three.js GLB heart integration
- Deployment
- Backend runtime verification after dependency installation
- Frontend runtime verification after dependency installation

## Local Dataset

The official dataset CSV is available locally at:

```text
ml/data/z_alizadeh_sani_extension.csv
```

Dataset inspection:

| Item | Value |
|---|---:|
| Records | 303 |
| Columns | 59 |
| Leakage-safe features | 55 |
| Targets | Cath, LAD, LCX, RCA |

## Current Model Summary

Model training has been completed locally:

```bash
cd ml
.\.venv\Scripts\python.exe train_models.py --data data\z_alizadeh_sani_extension.csv
```

| Output | Best Model | ROC-AUC | F1 |
|---|---|---:|---:|
| CAD | Random Forest | 0.8798 | 0.9231 |
| LAD | Random Forest | 0.8378 | 0.8267 |
| LCX | Random Forest | 0.7095 | 0.4762 |
| RCA | Logistic Regression | 0.7391 | 0.6222 |

Detailed metrics:

```text
docs/MODEL_TRAINING_RESULTS.md
```

## Current Blockers

- SHAP artifacts are pending because the `shap` package is not installed yet.
- Frontend runtime verification is pending because `npm install` had a Windows permission issue.
- Backend runtime verification still needs the final API environment setup.

## Current GitHub Repository

```text
https://github.com/AparnaaSuresh/cardiotwin-ai
```
