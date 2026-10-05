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

The project has been started from scratch and pushed to GitHub.

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

Initial commit:

```text
6c52b61 Initial CardioTwin AI scaffold
```

## Completed Work

## 1. Repository Setup

Completed:

- Local project folder prepared.
- Git repository connected.
- GitHub remote added.
- Initial commit pushed.

Status:

```text
Completed
```

## 2. Backend Scaffold

Completed:

- FastAPI app created.
- Pydantic schemas added.
- `/health` endpoint added.
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
backend/requirements.txt
```

Status:

```text
Code created, runtime verification pending dependencies
```

## 3. ML Pipeline Scaffold

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

Files:

```text
ml/preprocess.py
ml/train_models.py
ml/requirements.txt
ml/data/README.md
```

Status:

```text
Pipeline created, real training pending dataset
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

Files:

```text
frontend/package.json
frontend/index.html
frontend/src/main.jsx
frontend/src/styles.css
```

Status:

```text
Source created, runtime verification pending dependency install
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

Files:

```text
README.md
docs/PROJECT_IMPLEMENTATION_PLAN.md
docs/PROJECT_TRACKING.md
docs/DOUBTS_AND_DECISIONS.md
docs/IMPLEMENTATION_LOG.md
docs/IMPLEMENTATION_PHASES_STEP_BY_STEP.md
docs/PROGRESS_REPORT_THEN_AND_NOW.md
```

Status:

```text
In progress and updated
```

## Current Limitations

## 1. Dataset Not Added Yet

The official dataset is not yet present in:

```text
ml/data/
```

Because of this:

- Real model training has not been run.
- Real metrics are not available.
- Real SHAP explanations are not available.

## 2. Dependency Installation Not Completed

Frontend and backend dependency installation had environment permission/network issues earlier.

Pending:

- Backend package install.
- Frontend package install.
- Local server run.

## 3. 3D Heart Is Temporary

Current visualization:

```text
SVG-based vessel map
```

Future target:

```text
Three.js / React Three Fiber GLB heart model
```

## 4. Demo Fallback Is Not A Trained Model

The backend currently includes a deterministic fallback predictor.

Purpose:

```text
frontend-backend integration testing only
```

It should not be reported as trained model performance.

## Project Status Table

| Component | Then | Now |
|---|---|---|
| GitHub repository | Not connected | Connected and pushed |
| Backend | Not present | FastAPI scaffold created |
| ML pipeline | Not present | Training scaffold created |
| Dataset | Mentioned in problem statement | Not yet added locally |
| SHAP | Concept discussed | Artifact support added |
| Frontend | Mockups only | React source created |
| 3D visualization | Concept only | SVG placeholder created |
| Documentation | Planning scattered | Structured docs created |
| Deployment | Not started | Not started |

## Immediate Next Work

The next implementation step is:

```text
Add the official dataset CSV and run real model training.
```

After that:

1. Verify actual dataset columns.
2. Run `ml/train_models.py`.
3. Generate model metrics.
4. Save trained artifacts.
5. Start backend.
6. Start frontend.
7. Test full prediction flow.
8. Replace SVG with true 3D heart model.

## Current Project Health

Overall status:

```text
Good start. Scaffold is ready. Real ML and runtime verification are pending.
```

Main blocker:

```text
Official dataset CSV is needed.
```

Secondary blocker:

```text
Dependency installation/runtime verification needs to be completed in the local environment.
```

