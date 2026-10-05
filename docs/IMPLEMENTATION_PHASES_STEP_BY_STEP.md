# CardioTwin AI - Step-by-Step Implementation Phases

## Project Goal

Build **CardioTwin AI**, an explainable cardiac risk visualization system for Track A.

The system should:

1. Accept structured clinical patient data.
2. Predict overall CAD risk.
3. Predict vessel-specific stenosis risk for LAD, LCX, and RCA.
4. Explain predictions using SHAP.
5. Visualize vessel-specific risk on an interactive 3D heart model.
6. Provide a reliable frontend -> backend -> ML -> SHAP -> visualization pipeline.

## Phase 0 - Repository Setup

### Goal

Create the base project structure and connect it to GitHub.

### Tasks

- [x] Create local project folder.
- [x] Add backend folder.
- [x] Add frontend folder.
- [x] Add ML folder.
- [x] Add documentation folder.
- [x] Initialize Git.
- [x] Connect GitHub remote.
- [x] Push initial scaffold.

### Output

```text
backend/
frontend/
ml/
docs/
README.md
```

### Status

Completed.

## Phase 1 - Requirement and Dataset Alignment

### Goal

Make sure the project follows the official Track A problem statement.

### Tasks

- [x] Identify official dataset mentioned in Track A.
- [x] Confirm dataset: Extension of Z-Alizadeh Sani Dataset.
- [x] Identify target outputs: CAD, LAD, LCX, RCA.
- [x] Add dataset placement instructions.
- [ ] Add actual dataset CSV to `ml/data/`.
- [ ] Verify actual dataset column names.
- [ ] Confirm exact target column names.
- [ ] Confirm feature columns.

### Important Rule

Do not use target/leakage columns as input features:

```text
LAD
LCX
RCA
Cath
CAD target column
```

### Output

```text
ml/data/z_alizadeh_sani_extension.csv
```

### Status

Partially completed. Waiting for the actual dataset CSV.

## Phase 2 - ML Pipeline

### Goal

Train reliable supervised ML models for CAD and vessel-specific stenosis prediction.

### Tasks

- [x] Create preprocessing helper.
- [x] Create training script.
- [x] Add leakage-safe feature filtering.
- [x] Add candidate models.
- [x] Add evaluation metrics.
- [ ] Load real dataset.
- [ ] Train CAD model.
- [ ] Train LAD model.
- [ ] Train LCX model.
- [ ] Train RCA model.
- [ ] Compare models.
- [ ] Save trained model artifacts.
- [ ] Generate model report.

### Candidate Models

- Logistic Regression
- Random Forest
- XGBoost

### Evaluation Metrics

- Accuracy
- Precision
- Recall / sensitivity
- F1-score
- ROC-AUC
- Confusion matrix

### Output

```text
backend/models/cad_model.joblib
backend/models/lad_model.joblib
backend/models/lcx_model.joblib
backend/models/rca_model.joblib
docs/model_reports/training_summary.json
```

### Status

Pipeline scaffold completed. Real training pending dataset.

## Phase 3 - SHAP Explainability

### Goal

Explain each prediction using SHAP.

### Tasks

- [x] Add SHAP dependency.
- [x] Add SHAP explainer artifact support.
- [x] Design response schema for feature impacts.
- [ ] Generate SHAP explainer for CAD model.
- [ ] Generate SHAP explainer for LAD model.
- [ ] Generate SHAP explainer for LCX model.
- [ ] Generate SHAP explainer for RCA model.
- [ ] Validate feature names match model inputs.
- [ ] Add global feature importance endpoint or report.

### Explanation Types

```text
Global explanation -> important features across dataset
Local explanation  -> why this patient got this prediction
```

### Important Communication Rule

```text
SHAP contribution != medical causation
```

### Status

Backend schema and artifact support completed. Real SHAP generation pending trained models.

## Phase 4 - Backend API

### Goal

Provide a clean API for frontend prediction requests.

### Tasks

- [x] Create FastAPI app.
- [x] Add `/health`.
- [x] Add `/predict`.
- [x] Add Pydantic input schema.
- [x] Add response schema.
- [x] Add model loading strategy.
- [x] Add demo fallback mode.
- [ ] Install backend dependencies locally.
- [ ] Run backend server.
- [ ] Test `/health`.
- [ ] Test `/predict`.
- [ ] Add batch prediction endpoint.
- [ ] Add model metrics endpoint.

### Current API

```text
GET  /health
POST /predict
```

### Status

Code completed. Runtime verification pending dependency installation.

## Phase 5 - Frontend Dashboard

### Goal

Build a clear dashboard for patient input, risk prediction, SHAP explanation, and visualization.

### Tasks

- [x] Create React/Vite frontend.
- [x] Add patient input form.
- [x] Add API call to backend.
- [x] Add prediction result panel.
- [x] Add risk bars.
- [x] Add SHAP-style feature impact panel.
- [x] Add SVG-based heart/vessel visualization.
- [ ] Install frontend dependencies.
- [ ] Run frontend dev server.
- [ ] Fix runtime UI bugs.
- [ ] Add loading and error polish.
- [ ] Add sample patient selector.
- [ ] Add CSV upload.

### Current Visualization

The first version uses a lightweight SVG vessel map.

### Future Upgrade

Replace SVG with:

```text
React Three Fiber + Three.js + GLB/GLTF heart model
```

### Status

Frontend source completed. Runtime verification pending dependency installation.

## Phase 6 - 3D Heart Visualization

### Goal

Create an interactive heart visualization where LAD, LCX, and RCA are visually mapped by risk level.

### Tasks

- [x] Add temporary SVG-based vessel visualization.
- [ ] Choose open-source heart model.
- [ ] Add React Three Fiber.
- [ ] Load GLB/GLTF model.
- [ ] Add OrbitControls.
- [ ] Add vessel overlays or markers.
- [ ] Map risks to vessel color.
- [ ] Add vessel tooltips.
- [ ] Add fallback if 3D model fails.

### Risk Mapping

```text
Low risk      -> green
Moderate risk -> yellow
High risk     -> red
```

### Status

Temporary visualization completed. Real 3D implementation pending.

## Phase 7 - Integration Testing

### Goal

Verify the full system path works end-to-end.

### Required Flow

```text
Patient form
  -> Frontend API call
  -> Backend validation
  -> Preprocessing
  -> ML prediction
  -> SHAP explanation
  -> JSON response
  -> Dashboard result
  -> Vessel risk visualization
```

### Tasks

- [ ] Backend dependency install.
- [ ] Frontend dependency install.
- [ ] Run backend.
- [ ] Run frontend.
- [ ] Test with demo fallback.
- [ ] Test with trained model artifacts.
- [ ] Validate error states.
- [ ] Validate response schema.

### Status

Not completed.

## Phase 8 - Documentation and Presentation

### Goal

Prepare the project for hackathon/conference presentation.

### Tasks

- [x] Create README.
- [x] Create implementation plan.
- [x] Create tracking document.
- [x] Create decisions document.
- [x] Create implementation log.
- [x] Create implementation phases document.
- [ ] Add architecture diagram.
- [ ] Add ML pipeline diagram.
- [ ] Add demo screenshots.
- [ ] Add final report.
- [ ] Add presentation script.

### Status

In progress.

## Phase 9 - Deployment

### Goal

Deploy or package the project for demonstration.

### Tasks

- [ ] Add `.env.example`.
- [ ] Add Dockerfile for backend.
- [ ] Add deployment instructions.
- [ ] Deploy frontend.
- [ ] Deploy backend.
- [ ] Configure CORS.
- [ ] Add health check.

### Status

Not started.

## Immediate Next Actions

1. Add the official dataset CSV to `ml/data/`.
2. Verify dataset column names.
3. Run ML training.
4. Install backend dependencies.
5. Install frontend dependencies.
6. Run backend and frontend locally.
7. Replace demo fallback with trained model artifacts.

