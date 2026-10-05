from __future__ import annotations

import argparse
import json
from pathlib import Path

import pandas as pd

from preprocess import DatasetConfig, feature_columns, load_dataset

ROOT = Path(__file__).resolve().parents[1]


def summarize_dataset(path: str, config: DatasetConfig) -> dict:
    df = load_dataset(path)
    targets = config.targets
    missing_targets = [column for column in targets.values() if column not in df.columns]
    usable_features = [] if missing_targets else feature_columns(df, targets.values())

    summary = {
        "path": str(path),
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "column_names": list(df.columns),
        "targets": targets,
        "missing_targets": missing_targets,
        "feature_count_after_leakage_filter": len(usable_features),
        "feature_columns_after_leakage_filter": usable_features,
        "missing_values_by_column": df.isna().sum().astype(int).to_dict(),
        "dtypes": {column: str(dtype) for column, dtype in df.dtypes.items()},
    }

    if not missing_targets:
        summary["target_value_counts"] = {
            target_name: df[target_column].astype(str).value_counts(dropna=False).to_dict()
            for target_name, target_column in targets.items()
        }

    return summary


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", required=True, help="Path to official Track A dataset CSV.")
    parser.add_argument("--cad-target", default="Cath")
    parser.add_argument("--lad-target", default="LAD")
    parser.add_argument("--lcx-target", default="LCX")
    parser.add_argument("--rca-target", default="RCA")
    parser.add_argument("--output", default="docs/model_reports/dataset_inspection.json")
    args = parser.parse_args()

    config = DatasetConfig(
        cad_target=args.cad_target,
        lad_target=args.lad_target,
        lcx_target=args.lcx_target,
        rca_target=args.rca_target,
    )
    summary = summarize_dataset(args.data, config)
    output = Path(args.output)
    if not output.is_absolute():
        output = ROOT / output
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
