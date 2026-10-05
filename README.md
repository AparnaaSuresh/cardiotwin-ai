# CardioTwin AI

Explainable 3D cardiac risk visualization for Track A: Cardiovascular Risk Visualization & Prediction.

## Core Idea

CardioTwin AI accepts structured clinical patient data, predicts overall CAD risk and vessel-specific stenosis risk for LAD, LCX, and RCA, explains predictions using SHAP, and visualizes vessel-specific risk on an interactive heart view.

## Official Dataset

Track A mentions:

```text
UCI Machine Learning Repository: Extension of Z-Alizadeh Sani Dataset
```

The dataset contains 303 patient records with clinical, ECG, lab, and echo features, plus target labels for CAD, LAD, LCX, and RCA.

Place the dataset CSV here:

```text
ml/data/z_alizadeh_sani_extension.csv
```

## Architecture

```text
Clinical input
  -> React frontend
  -> FastAPI backend
  -> validation and preprocessing
  -> CAD / LAD / LCX / RCA models
  -> SHAP explanations
  -> dashboard and vessel-risk visualization
```

## Novelty

Most CAD prediction systems stop at risk scores and feature charts. CardioTwin AI combines:

1. Overall CAD prediction
2. LAD, LCX, and RCA vessel-specific prediction
3. SHAP global/local explanation
4. Leakage-safe clinical ML pipeline
5. Anatomical risk visualization
6. Doctor-support disclaimer, not diagnostic overclaiming

## Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend API:

```text
GET  /health
GET  /sample-patients
GET  /model-metadata
POST /predict
```

Before trained model artifacts exist, the API returns `model_mode: demo-fallback`. This mode is only for frontend integration and demo plumbing.

## ML Training

```bash
cd ml
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python train_models.py --data data/z_alizadeh_sani_extension.csv
```

If target names differ:

```bash
python train_models.py --data data/z_alizadeh_sani_extension.csv --cad-target Cath --lad-target LAD --lcx-target LCX --rca-target RCA
```

Before training, inspect the dataset:

```bash
python inspect_dataset.py --data data/z_alizadeh_sani_extension.csv
```

If the official UCI file is downloaded as Excel, convert it first:

```bash
python ml/convert_official_xlsx.py --input "ml/data/uci_z_alizadeh_sani_extension/extention of Z-Alizadeh sani dataset.xlsx" --output "ml/data/z_alizadeh_sani_extension.csv"
```

The trainer saves artifacts to:

```text
backend/models/
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Optional API URL:

```bash
set VITE_API_URL=http://localhost:8000
```

## Safety

This project is an educational decision-support prototype only. It is not a clinical diagnostic device and must not replace qualified medical evaluation.
