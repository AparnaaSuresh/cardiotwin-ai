# Dataset Folder

Place the official Track A dataset here.

Expected dataset:

```text
UCI Machine Learning Repository: Extension of Z-Alizadeh Sani Dataset
```

The Track A problem statement says this dataset contains:

- 303 patient records
- demographic features
- vital signs
- lab values
- ECG findings
- echocardiography findings
- target labels for CAD, LAD, LCX, and RCA

Do not commit private or restricted medical data unless the dataset license permits it.

Example training command:

```bash
cd ml
python train_models.py --data data/z_alizadeh_sani_extension.csv
```

If the column names differ, pass the target column names:

```bash
python train_models.py --data data/z_alizadeh_sani_extension.csv --cad-target Cath --lad-target LAD --lcx-target LCX --rca-target RCA
```

