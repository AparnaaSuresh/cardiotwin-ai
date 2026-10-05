from __future__ import annotations

from .schemas import RiskLevel


def probability_to_level(probability: float) -> RiskLevel:
    if probability < 0.31:
        return RiskLevel.low
    if probability < 0.61:
        return RiskLevel.moderate
    return RiskLevel.high

