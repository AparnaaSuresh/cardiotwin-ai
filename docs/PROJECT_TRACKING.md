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
- SHAP explainer artifacts generated locally
- Backend runtime verified in trained-model mode
- Frontend dependencies installed
- Frontend production build verified
- Frontend dev server verified locally

Not yet implemented:

- True Three.js GLB heart integration
- Deployment

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
| CAD | Random Forest | 0.8786 | 0.9130 |
| LAD | Random Forest | 0.8400 | 0.8421 |
| LCX | Random Forest | 0.7061 | 0.4878 |
| RCA | Logistic Regression | 0.7391 | 0.6222 |

Detailed metrics:

```text
docs/MODEL_TRAINING_RESULTS.md
```

## Current Blockers

- True Three.js/React Three Fiber anatomical heart integration is still pending.
- Deployment is not started.
- The frontend currently collects a simplified clinical form, so several original dataset features use neutral defaults during inference.

## Current GitHub Repository

```text
https://github.com/AparnaaSuresh/cardiotwin-ai
```
