from __future__ import annotations

from .schemas import PatientInput


SAMPLE_PATIENTS = {
    "low_risk": PatientInput(
        age=34,
        sex="Female",
        systolic_bp=116,
        diastolic_bp=74,
        cholesterol=168,
        triglyceride=110,
        fasting_blood_sugar=88,
        pulse_rate=72,
        st_elevation=False,
        st_depression=False,
        t_inversion=False,
        lvh=False,
        rwma_region="None",
        ef_tte=62,
    ),
    "moderate_risk": PatientInput(
        age=51,
        sex="Male",
        systolic_bp=138,
        diastolic_bp=86,
        cholesterol=218,
        triglyceride=178,
        fasting_blood_sugar=112,
        pulse_rate=88,
        st_elevation=False,
        st_depression=True,
        t_inversion=False,
        lvh=False,
        rwma_region="Mild inferior hypokinesia",
        ef_tte=52,
    ),
    "high_lad_risk": PatientInput(
        age=62,
        sex="Male",
        systolic_bp=142,
        diastolic_bp=86,
        cholesterol=220,
        triglyceride=170,
        fasting_blood_sugar=110,
        pulse_rate=92,
        st_elevation=True,
        st_depression=False,
        t_inversion=True,
        lvh=False,
        rwma_region="Anterior hypokinesia",
        ef_tte=45,
    ),
}

