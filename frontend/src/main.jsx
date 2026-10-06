import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  HeartPulse,
  RotateCcw,
} from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const samplePatient = {
  age: 62,
  sex: "Male",
  systolic_bp: 142,
  diastolic_bp: 86,
  cholesterol: 220,
  triglyceride: 170,
  fasting_blood_sugar: 110,
  pulse_rate: 92,
  st_elevation: true,
  st_depression: false,
  t_inversion: true,
  lvh: false,
  rwma_region: "Anterior hypokinesia",
  ef_tte: 45,
};

function riskColor(level) {
  if (level === "High") return "var(--red)";
  if (level === "Moderate") return "var(--yellow)";
  return "var(--green)";
}

function asPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function App() {
  const [patient, setPatient] = useState(samplePatient);
  const [result, setResult] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState("LAD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [samples, setSamples] = useState({});
  const [sampleStatus, setSampleStatus] = useState("Using built-in sample");

  const selectedPrediction = result?.predictions?.[selectedTarget];

  useEffect(() => {
    async function loadSamples() {
      try {
        const response = await fetch(`${API_URL}/sample-patients`);
        if (!response.ok) throw new Error("Sample API unavailable");
        const data = await response.json();
        setSamples(data);
        setSampleStatus("Loaded from backend");
      } catch {
        setSamples({ high_lad_risk: samplePatient });
        setSampleStatus("Using built-in sample");
      }
    }
    loadSamples();
  }, []);

  async function runPrediction() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patient),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `API returned ${response.status}`);
      }
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(`${err.message}. Check that the backend is running at ${API_URL}.`);
    } finally {
      setLoading(false);
    }
  }

  const predictions = result?.predictions || {};

  return (
    <main className="shell">
      <header className="header">
        <div className="brand">
          <div className="brandIcon"><HeartPulse size={26} /></div>
          <div>
            <h1>CardioTwin AI</h1>
            <p>Explainable 3D cardiac risk visualization for CAD, LAD, LCX, and RCA.</p>
          </div>
        </div>
        <div className="modeBadge">
          {result?.model_mode ? `Mode: ${result.model_mode}` : "Dataset-ready prototype"}
        </div>
      </header>

      <section className="layout">
        <PatientForm
          patient={patient}
          setPatient={setPatient}
          onRun={runPrediction}
          loading={loading}
          samples={samples}
          sampleStatus={sampleStatus}
        />

        <section className="heartPanel card">
          <div className="sectionTitle">
            <Database size={20} />
            <div>
              <h2>3D-inspired Vessel Risk Map</h2>
              <p>Replaceable SVG layer now; Three.js GLB heart can plug in later.</p>
            </div>
          </div>
          <HeartMap predictions={predictions} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />
          <div className="vesselGrid">
            {["LAD", "LCX", "RCA"].map((target) => (
              <button
                type="button"
                className={`vesselButton ${selectedTarget === target ? "active" : ""}`}
                key={target}
                onClick={() => setSelectedTarget(target)}
              >
                <span>{target}</span>
                <strong>{predictions[target] ? asPercent(predictions[target].probability) : "--"}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="sectionTitle">
            <BarChart3 size={20} />
            <div>
              <h2>Prediction Results</h2>
              <p>Risk probabilities and local SHAP-style feature impact.</p>
            </div>
          </div>

          {error && <div className="error">{error}</div>}
          {!result && !error && <EmptyState />}
          {result && (
            <>
              <RiskSummary predictions={predictions} />
              <Explanation prediction={selectedPrediction} selectedTarget={selectedTarget} />
              <div className="disclaimer">
                <AlertTriangle size={16} />
                <span>{result.disclaimer}</span>
              </div>
            </>
          )}
        </section>
      </section>

      <section className="workflow card">
        {[
          ["Clinical input", "Structured patient features"],
          ["Preprocess", "Validation and leakage-safe features"],
          ["Predict", "CAD + LAD + LCX + RCA models"],
          ["Explain", "SHAP global/local impact"],
          ["Visualize", "Vessel-specific risk map"],
        ].map(([title, text], index) => (
          <div className="flowStep" key={title}>
            <span>{index + 1}</span>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}

function PatientForm({ patient, setPatient, onRun, loading, samples, sampleStatus }) {
  function update(field, value) {
    setPatient((current) => ({ ...current, [field]: value }));
  }

  const numericFields = [
    ["age", "Age"],
    ["systolic_bp", "Systolic BP"],
    ["diastolic_bp", "Diastolic BP"],
    ["cholesterol", "Cholesterol"],
    ["triglyceride", "Triglyceride"],
    ["fasting_blood_sugar", "Fasting blood sugar"],
    ["pulse_rate", "Pulse rate"],
    ["ef_tte", "EF-TTE"],
  ];

  return (
    <section className="card">
      <div className="sectionTitle">
        <Activity size={20} />
        <div>
          <h2>Patient Clinical Input</h2>
          <p>{sampleStatus}; CSV batch upload can be added next.</p>
        </div>
      </div>

      <label>
        Sample patient
        <select
          defaultValue=""
          onChange={(event) => {
            const selected = samples[event.target.value];
            if (selected) setPatient(selected);
          }}
        >
          <option value="" disabled>Select sample case</option>
          {Object.keys(samples).map((name) => (
            <option key={name} value={name}>
              {name.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>

      <label>
        Sex
        <select value={patient.sex} onChange={(event) => update("sex", event.target.value)}>
          <option>Male</option>
          <option>Female</option>
        </select>
      </label>

      <div className="fieldGrid">
        {numericFields.map(([field, label]) => (
          <label key={field}>
            {label}
            <input
              type="number"
              value={patient[field] ?? ""}
              onChange={(event) => update(field, event.target.value === "" ? null : Number(event.target.value))}
            />
          </label>
        ))}
      </div>

      <label>
        RWMA region
        <input value={patient.rwma_region || ""} onChange={(event) => update("rwma_region", event.target.value)} />
      </label>

      <div className="checks">
        {[
          ["st_elevation", "ST elevation"],
          ["st_depression", "ST depression"],
          ["t_inversion", "T inversion"],
          ["lvh", "LVH"],
        ].map(([field, label]) => (
          <label className="check" key={field}>
            <input type="checkbox" checked={patient[field]} onChange={(event) => update(field, event.target.checked)} />
            {label}
          </label>
        ))}
      </div>

      <button className="primary" type="button" onClick={onRun} disabled={loading}>
        {loading ? "Running..." : "Run AI Analysis"}
      </button>
    </section>
  );
}

function HeartMap({ predictions, selectedTarget, setSelectedTarget }) {
  const vessel = (target, fallback) => riskColor(predictions[target]?.risk_level || fallback);
  return (
    <svg className="heartSvg" viewBox="0 0 520 360" role="img" aria-label="Heart map showing LAD, LCX, and RCA risk colors">
      <path className="heartShape" d="M260 310 C130 224 82 160 98 90 C112 28 184 22 229 67 C247 85 255 101 260 118 C265 101 273 85 291 67 C336 22 408 28 422 90 C438 160 390 224 260 310 Z" />
      <path className="heartDivider" d="M260 310 C252 225 253 166 260 118" />
      <g onClick={() => setSelectedTarget("LAD")}>
        <path className={selectedTarget === "LAD" ? "vessel selected" : "vessel"} d="M253 118 C205 126 177 154 154 210 C139 235 126 253 104 270" stroke={vessel("LAD", "High")} />
      </g>
      <g onClick={() => setSelectedTarget("LCX")}>
        <path className={selectedTarget === "LCX" ? "vessel selected" : "vessel"} d="M270 122 C321 128 354 160 373 210 C394 238 413 255 438 270" stroke={vessel("LCX", "Moderate")} />
      </g>
      <g onClick={() => setSelectedTarget("RCA")}>
        <path className={selectedTarget === "RCA" ? "vessel selected" : "vessel"} d="M276 135 C255 181 255 222 276 273" stroke={vessel("RCA", "Low")} />
      </g>
      <VesselLabel x="92" y="198" target="LAD" prediction={predictions.LAD} />
      <VesselLabel x="355" y="198" target="LCX" prediction={predictions.LCX} />
      <VesselLabel x="224" y="282" target="RCA" prediction={predictions.RCA} />
    </svg>
  );
}

function VesselLabel({ x, y, target, prediction }) {
  return (
    <g>
      <rect x={x} y={y} width="92" height="34" rx="17" className="labelBg" />
      <text x={x + 46} y={y + 22} textAnchor="middle" className="labelText">
        {target} {prediction ? asPercent(prediction.probability) : "--"}
      </text>
    </g>
  );
}

function RiskSummary({ predictions }) {
  return (
    <div className="riskList">
      {["CAD", "LAD", "LCX", "RCA"].map((target) => {
        const item = predictions[target];
        return (
          <div className="riskRow" key={target}>
            <span>{target}</span>
            <div className="track">
              <div
                className="fill"
                style={{ width: item ? asPercent(item.probability) : "0%", background: item ? riskColor(item.risk_level) : "var(--muted)" }}
              />
            </div>
            <strong>{item ? asPercent(item.probability) : "--"}</strong>
          </div>
        );
      })}
    </div>
  );
}

function Explanation({ prediction, selectedTarget }) {
  if (!prediction) return null;
  return (
    <div className="explain">
      <h3>{selectedTarget} local explanation</h3>
      {prediction.top_features.map((feature) => (
        <div className="impactRow" key={feature.feature}>
          <span>{feature.feature}</span>
          <div className="impactTrack">
            <div
              style={{
                width: `${Math.min(100, Math.abs(feature.impact) * 400)}%`,
                background: feature.impact >= 0 ? "var(--red)" : "var(--green)",
              }}
            />
          </div>
          <strong>{feature.impact > 0 ? "+" : ""}{feature.impact}</strong>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="empty">
      <RotateCcw size={28} />
      <strong>Run a prediction to view risk and explanations.</strong>
      <p>The API will use trained models once artifacts are available; otherwise it reports demo-fallback mode.</p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
