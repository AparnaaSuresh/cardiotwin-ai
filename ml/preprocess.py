from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable, List

import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


LEAKAGE_COLUMNS = {
    "lad",
    "lcx",
    "rca",
    "cath",
    "cad",
    "stenosis",
    "diagnosis",
}


@dataclass
class DatasetConfig:
    cad_target: str = "Cath"
    lad_target: str = "LAD"
    lcx_target: str = "LCX"
    rca_target: str = "RCA"

    @property
    def targets(self) -> dict[str, str]:
        return {
            "CAD": self.cad_target,
            "LAD": self.lad_target,
            "LCX": self.lcx_target,
            "RCA": self.rca_target,
        }


def normalize_column_name(name: str) -> str:
    return name.strip().replace(" ", "_").replace("-", "_")


def load_dataset(path: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df = df.rename(columns={column: normalize_column_name(column) for column in df.columns})
    return df


def infer_binary_target(series: pd.Series) -> pd.Series:
    if pd.api.types.is_numeric_dtype(series):
        return series.astype(int)

    normalized = series.astype(str).str.strip().str.lower()
    positive = {"yes", "y", "true", "1", "cad", "stenosis", "positive", "abnormal"}
    negative = {"no", "n", "false", "0", "normal", "negative"}

    mapped = normalized.map(lambda value: 1 if value in positive else 0 if value in negative else None)
    if mapped.isna().any():
        unknown = sorted(normalized[mapped.isna()].unique())
        raise ValueError(f"Unknown binary target values in {series.name}: {unknown}")
    return mapped.astype(int)


def feature_columns(df: pd.DataFrame, target_columns: Iterable[str]) -> List[str]:
    target_set = {column.lower() for column in target_columns}
    columns = []
    for column in df.columns:
        lower = column.lower()
        if lower in target_set:
            continue
        if lower in LEAKAGE_COLUMNS:
            continue
        columns.append(column)
    return columns


def build_preprocessor(df: pd.DataFrame, columns: List[str]) -> ColumnTransformer:
    categorical = [column for column in columns if df[column].dtype == "object"]
    numeric = [column for column in columns if column not in categorical]

    numeric_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )
    categorical_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("encoder", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    return ColumnTransformer(
        transformers=[
            ("num", numeric_pipeline, numeric),
            ("cat", categorical_pipeline, categorical),
        ]
    )

