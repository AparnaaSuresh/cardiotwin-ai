# CardioTwin AI - Progress Report: Then and Now

## Summary

This report tracks the project state from the beginning of implementation to the current state.

## Then: Starting State

At the start, there was no complete implementation in the local project folder.

The project existed mainly as:

- Track A problem statement understanding
- Research discussion
- Novelty definition
- Architecture idea
- Mockup images
- Planning notes

No actual working repository existed in the target local folder.

## Now: Current State

The project has been started from scratch, pushed to GitHub, and trained locally using the official dataset.

Repository:

```text
https://github.com/AparnaaSuresh/cardiotwin-ai
```

Local folder:

```text
C:\Users\Hp\Documents\ChatGPT\Cardio
```

Current Git branch:

```text
master
```

## Completed Work

## 1. Repository Setup

Completed:

- Local project folder prepared.
- Git repository connected.
- GitHub remote added.
- Initial scaffold pushed.
- Follow-up implementation commits pushed.

Status:

```text
Completed
```

## 2. Backend Scaffold

Completed:

- FastAPI app created.
- Pydantic schemas added.
- `/health` endpoint added.
- `/sample-patients` endpoint added.
- `/model-metadata` endpoint added.
- `/predict` endpoint added.
- Model artifact loader added.
- Demo fallback predictor added.
- Risk level helper added.

Files:

```text
backend/app/main.py
backend/app/schemas.py
backend/app/predict.py
backend/app/model_loader.py
backend/app/risk.py
backend/app/sample_patients.py
backend/requirements.txt
```

Status:

```text
Code created, final runtime verification pending API dependency setup.
```

## 3. ML Pipeline

Completed:

- Dataset loading helper.
- Column normalization helper.
- Leakage-safe feature selection.
- Binary target conversion.
- Preprocessing pipeline.
- Training script.
- Model comparison setup.
- Evaluation metrics setup.
- SHAP explainer artifact support.
- Official dataset downloaded locally.
- Official Excel dataset converted to CSV.
- Dataset inspection completed.
- Real model training completed for CAD, LAD, LCX, and RCA.
- Local trained artifacts generated.
- Training metrics documented.

Files:

```text
ml/preprocess.py
ml/train_models.py
ml/inspect_dataset.py
ml/convert_official_xlsx.py
ml/requirements.txt
ml/data/README.md
docs/MODEL_TRAINING_RESULTS.md
```

Status:

```text
Real training completed locally. SHAP artifact generation pending shap installation.
```

## 4. Frontend Scaffold

Completed:

- React/Vite project files.
- Patient input form.
- Backend API call.
- Prediction result panel.
- Risk bars.
- SHAP-style local explanation panel.
- SVG-based vessel risk map.
- Responsive CSS.
- Sample patient selector support.

Files:

```text
frontend/package.json
frontend/index.html
frontend/src/main.jsx
frontend/src/styles.css
```

Status:

```text
Source created, runtime verification pending dependency install.
```

## 5. Documentation

Completed:

- README.
- Project implementation plan.
- Project tracking document.
- Doubts and decisions document.
- Implementation log.
- Step-by-step implementation phases document.
- Then-and-now progress report.
- Dataset integration guide.
- Model training results document.

Status:

```text
Updated with current real training status.
```

## Current Limitations

## 1. Dataset And Model Artifacts Are Local

The official dataset is present locally in:

```text
ml/data/z_alizadeh_sani_extension.csv
```

The trained model artifacts are present locally in:

```text
backend/models/
```

They are intentionally ignored by Git because raw datasets and binary artifacts should not be pushed unless required.

## 2. SHAP Artifacts Are Pending

SHAP support exists in the project design and training code, but actual explainer files were not generated yet because the `shap` package is not installed in the current environment.

## 3. 3D Heart Is Temporary

Current visualization:

```text
SVG-based vessel map
```

Future target:

```text
Three.js / React Three Fiber GLB heart model
```

## 4. Runtime Verification Is Pending

Pending:

- Backend server run.
- Frontend package install.
- Frontend server run.
- Full frontend-to-backend prediction test.

## Project Status Table

| Component | Then | Now |
|---|---|---|
| GitHub repository | Not connected | Connected and pushed |
| Backend | Not present | FastAPI scaffold created |
| ML pipeline | Not present | Real local training completed |
| Dataset | Mentioned in problem statement | Downloaded, converted, inspected locally |
| SHAP | Concept discussed | Artifact support added, actual artifacts pending |
| Frontend | Mockups only | React source created |
| 3D visualization | Concept only | SVG placeholder created |
| Documentation | Planning scattered | Structured docs and metrics created |
| Deployment | Not started | Not started |

## Immediate Next Work

The next implementation step is:

```text
Generate SHAP artifacts and verify the backend/frontend runtime flow.
```

After that:

1. Install SHAP in the ML/backend runtime.
2. Re-run `ml/train_models.py`.
3. Confirm SHAP local explanations appear in API output.
4. Start backend.
5. Start frontend.
6. Test full prediction flow.
7. Replace SVG with true Three.js heart model.

## Current Project Health

Overall status:

```text
Good progress. Scaffold is ready and real ML training has been completed locally.
```

Main blocker:

```text
SHAP artifact generation and runtime verification are pending.
```
