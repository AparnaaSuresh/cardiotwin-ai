# Project Implementation Plan

## Phase 1 - Scaffold

- [x] Backend FastAPI skeleton
- [x] Prediction request/response schemas
- [x] Demo fallback predictor
- [x] React dashboard skeleton
- [x] ML training script skeleton
- [x] Dataset placement instructions

## Phase 2 - Real Dataset Integration

- [ ] Add official Z-Alizadeh Sani extension CSV to `ml/data`
- [ ] Verify exact column names
- [ ] Confirm target columns: CAD/Cath, LAD, LCX, RCA
- [ ] Confirm categorical and numerical feature handling
- [ ] Run leakage check

## Phase 3 - ML Training

- [ ] Train Logistic Regression baseline
- [ ] Train Random Forest
- [ ] Train XGBoost
- [ ] Compare metrics
- [ ] Save best model per target
- [ ] Save preprocessing artifacts
- [ ] Generate model report

## Phase 4 - Explainability

- [ ] Generate SHAP explainers
- [ ] Validate feature names match transformed model input
- [ ] Show global importance
- [ ] Show local explanation per target

## Phase 5 - Visualization

- [ ] Replace SVG heart with Three.js / React Three Fiber component
- [ ] Add GLB/GLTF heart asset
- [ ] Add LAD/LCX/RCA overlays or approximate vessel paths
- [ ] Add rotation and zoom
- [ ] Add vessel tooltips

## Phase 6 - Final Demo

- [ ] Add sample patient cases
- [ ] Add model metrics page
- [ ] Add report export
- [ ] Add final README
- [ ] Record demo video

