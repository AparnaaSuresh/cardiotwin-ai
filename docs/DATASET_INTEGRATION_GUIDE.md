# Dataset Integration Guide

## Official Dataset

Track A mentions:

```text
UCI Machine Learning Repository: Extension of Z-Alizadeh Sani Dataset
```

Expected characteristics:

- 303 patient records
- Demographics
- Vital signs
- Laboratory values
- ECG findings
- Echocardiography findings
- Ground-truth labels for CAD, LAD, LCX, and RCA

## Step 1 - Add Dataset

Place the CSV file here:

```text
ml/data/z_alizadeh_sani_extension.csv
```

Do not commit the dataset unless its license permits redistribution.

## Step 2 - Inspect Dataset

Run:

```bash
cd ml
python inspect_dataset.py --data data/z_alizadeh_sani_extension.csv
```

If target column names are different:

```bash
python inspect_dataset.py --data data/z_alizadeh_sani_extension.csv --cad-target Cath --lad-target LAD --lcx-target LCX --rca-target RCA
```

The inspection report will be saved to:

```text
docs/model_reports/dataset_inspection.json
```

## Optional - Convert Official UCI Excel File

If the official UCI download is extracted as `.xlsx`, convert it using:

```bash
python ml/convert_official_xlsx.py --input "ml/data/uci_z_alizadeh_sani_extension/extention of Z-Alizadeh sani dataset.xlsx" --output "ml/data/z_alizadeh_sani_extension.csv"
```

## Step 3 - Confirm Target Columns

Required targets:

```text
CAD / Cath
LAD
LCX
RCA
```

Important:

These targets must not be used as input features.

## Step 4 - Train Models

Run:

```bash
python train_models.py --data data/z_alizadeh_sani_extension.csv
```

If target columns are named differently:

```bash
python train_models.py --data data/z_alizadeh_sani_extension.csv --cad-target Cath --lad-target LAD --lcx-target LCX --rca-target RCA
```

## Step 5 - Check Outputs

Expected model artifacts:

```text
backend/models/cad_model.joblib
backend/models/lad_model.joblib
backend/models/lcx_model.joblib
backend/models/rca_model.joblib
```

Expected report:

```text
docs/model_reports/training_summary.json
```

## Safety Note

This model is for educational decision-support only. It is not a diagnostic medical system.
