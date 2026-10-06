# Implementation Log

## 2026-10-05

- Created backend FastAPI skeleton.
- Added Pydantic request and response schemas.
- Added model artifact loader.
- Added deterministic demo fallback predictor.
- Added ML preprocessing helpers.
- Added ML training script for CAD, LAD, LCX, RCA classifiers.
- Added React frontend dashboard.
- Added SVG vessel risk map.
- Added README and project planning docs.
- Copied project into `C:\Users\Hp\Documents\ChatGPT\Cardio`.
- Connected project to GitHub.
- Pushed initial scaffold to `https://github.com/AparnaaSuresh/cardiotwin-ai`.
- Added step-by-step implementation phases document.
- Added then-and-now progress report.
- Added dataset inspection script.
- Added dataset integration guide.
- Added backend sample patient endpoint.
- Added backend model metadata endpoint.
- Downloaded the official UCI Extension of Z-Alizadeh Sani dataset locally.
- Added standard-library XLSX to CSV converter.
- Converted official Excel dataset to `ml/data/z_alizadeh_sani_extension.csv`.
- Ran dataset inspection successfully: 303 records, 59 columns, targets `Cath`, `LAD`, `LCX`, `RCA` present.
- Patched target conversion to support `Stenotic` labels.

## 2026-10-06

- Installed the minimum ML runtime dependencies in the local ML virtual environment.
- Trained real models using the official converted UCI dataset.
- Saved local model artifacts for CAD, LAD, LCX, and RCA under `backend/models/`.
- CAD best model: Random Forest, holdout ROC-AUC `0.8798`, F1 `0.9231`.
- LAD best model: Random Forest, holdout ROC-AUC `0.8378`, F1 `0.8267`.
- LCX best model: Random Forest, holdout ROC-AUC `0.7095`, F1 `0.4762`.
- RCA best model: Logistic Regression, holdout ROC-AUC `0.7391`, F1 `0.6222`.
- Documented model results in `docs/MODEL_TRAINING_RESULTS.md`.
- Kept raw dataset files, local reports, and binary model artifacts out of Git.
