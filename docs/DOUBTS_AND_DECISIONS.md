# Doubts And Decisions

## Decisions

### Use official Track A dataset

We will use the UCI Extension of Z-Alizadeh Sani Dataset mentioned in Track A.

### Prevent target leakage

The pipeline removes LAD, LCX, RCA, Cath, CAD-like target columns from model input features.

### Use demo fallback only for integration

The backend includes a deterministic demo fallback predictor so frontend/backend integration can be tested before model artifacts exist. This must not be reported as trained model performance.

### Start with SVG heart visualization

The first frontend version uses a lightweight SVG heart/vessel map. This keeps integration simple. It can later be replaced by Three.js/React Three Fiber.

## Open Doubts

- Exact official dataset column names
- Exact encoding of CAD/Cath target
- Exact encoding of LAD/LCX/RCA stenosis target labels
- Which 3D heart model asset will be used

