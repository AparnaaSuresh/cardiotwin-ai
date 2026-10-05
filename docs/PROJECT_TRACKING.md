# Project Tracking

## Current Status

The project has been started from scratch.

Implemented:

- FastAPI backend skeleton
- Prediction schema
- Demo fallback predictor
- ML training script expecting official dataset CSV
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

Not yet implemented:

- Real dataset training
- Real SHAP artifacts from trained models
- True Three.js GLB heart integration
- Deployment
- Runtime verification after dependency installation
- Actual dataset inspection and training

## Next Step

Add the official dataset CSV to:

```text
ml/data/z_alizadeh_sani_extension.csv
```

Then run:

```bash
cd ml
python train_models.py --data data/z_alizadeh_sani_extension.csv
```

## Current GitHub Repository

```text
https://github.com/AparnaaSuresh/cardiotwin-ai
```
