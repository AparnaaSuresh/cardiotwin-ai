import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  Activity,
  BarChart3,
  BrainCircuit,
  Clock3,
  Download,
  HeartPulse,
  History,
  Maximize2,
  MessageCircle,
  RotateCcw,
  Search,
  Send,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const HISTORY_KEY = "cardiopredict-history";

const initialPatient = {
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

const vesselNames = {
  LAD: "Left Anterior Descending",
  LCX: "Left Circumflex",
  RCA: "Right Coronary Artery",
};

const vesselDetails = {
  LAD: {
    title: "LAD - Left Anterior Descending",
    area: "Front wall and septum",
    note: "Often clinically important because it supplies a large front portion of the heart.",
  },
  LCX: {
    title: "LCX - Left Circumflex",
    area: "Lateral and posterior region",
    note: "Risk here can relate to side/back wall blood supply patterns.",
  },
  RCA: {
    title: "RCA - Right Coronary Artery",
    area: "Right heart and inferior region",
    note: "Risk here is often reviewed with inferior wall ECG/echo findings.",
  },
};

const requiredFields = [
  ["age", "Age"],
  ["systolic_bp", "Systolic BP"],
  ["diastolic_bp", "Diastolic BP"],
  ["cholesterol", "LDL / cholesterol"],
];

function riskColor(level) {
  if (level === "High") return "#ef4444";
  if (level === "Moderate") return "#eab308";
  return "#16a34a";
}

function asPercent(value) {
  return `${Math.round(value * 100)}%`;
}

function App() {
  const [patient, setPatient] = useState(initialPatient);
  const [result, setResult] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState("LAD");
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [assessmentId, setAssessmentId] = useState(0);
  const [activeView, setActiveView] = useState("assessment");

  const predictions = result?.predictions || {};
  const selectedPrediction = predictions[selectedTarget];

  function selectTarget(target) {
    setSelectedTarget(target);
    setSelectedFinding(buildFinding(target, predictions[target]));
  }

  async function runPrediction() {
    setLoading(true);
    setError("");
    try {
      const validationError = validatePatient(patient);
      if (validationError) {
        setError(validationError);
        return;
      }
      const payload = sanitizePatient(patient);
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `API returned ${response.status}`);
      }
      const data = await response.json();
      setResult(data);
      setSelectedFinding(buildFinding(selectedTarget, data.predictions?.[selectedTarget]));
      setAssessmentId((current) => current + 1);
      saveHistory(data, payload);
    } catch (err) {
      setError(`Prediction failed. Make sure the backend is running at ${API_URL}.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
      if (Array.isArray(saved)) setHistory(saved.slice(0, 5));
    } catch {
      setHistory([]);
    }
    runPrediction();
  }, []);

  function saveHistory(data, payload) {
    const entry = {
      id: crypto.randomUUID?.() || `${Date.now()}`,
      at: new Date().toISOString(),
      patient: payload,
      predictions: data.predictions || {},
      modelMode: data.model_mode || "trained-model",
    };
    setHistory((current) => {
      const next = [entry, ...current].slice(0, 5);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }

  function downloadReport() {
    if (!result) return;
    const report = {
      project: "CardioPredict AI",
      generated_at: new Date().toISOString(),
      note: "Educational decision-support prototype. This is not a medical diagnosis.",
      patient: sanitizePatient(patient),
      predictions: result.predictions,
      selected_coronary_focus: selectedFinding || buildFinding(selectedTarget, predictions[selectedTarget]),
      model_mode: result.model_mode || "trained-model",
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cardiopredict-ai-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brandIcon"><HeartPulse size={25} /></div>
          <div>
            <h1>CardioPredict <span>AI</span></h1>
            <p>Explainable coronary risk engine</p>
          </div>
        </div>
        <nav className="navLinks" aria-label="Primary navigation">
          <button type="button" className={activeView === "assessment" ? "active" : ""} onClick={() => setActiveView("assessment")}>
            Assessment
          </button>
          <button type="button" className={activeView === "simulator" ? "active" : ""} onClick={() => setActiveView("simulator")}>
            What-If Simulator
          </button>
          <a href="#coronary-map" onClick={() => setActiveView("assessment")}>3D Analysis</a>
        </nav>
        <span className="modeBadge">{result?.model_mode || "trained-model"}</span>
      </header>

      <HeroSection />

      {activeView === "assessment" ? (
        <section className="dashboard" id="assessment">
          <PatientForm patient={patient} setPatient={setPatient} onRun={runPrediction} loading={loading} />

          <section className="card heartCard" id="coronary-map">
            <div className="panelHead">
              <HeartPulse size={21} />
              <div>
                <h2>3D Coronary Analysis</h2>
                <p>Rotate, zoom, and inspect artery-level risk markers linked to model output.</p>
              </div>
            </div>
            <div className="scanStrip">
              <span><Search size={14} /> Multi-view heart</span>
              <span>Defect markers</span>
              <span>SHAP linked</span>
            </div>
            <Heart3D predictions={predictions} selectedTarget={selectedTarget} setSelectedTarget={selectTarget} setSelectedFinding={setSelectedFinding} />
            <ArteryDetail selectedTarget={selectedTarget} prediction={predictions[selectedTarget]} selectedFinding={selectedFinding} />
            <VesselSelector predictions={predictions} selectedTarget={selectedTarget} setSelectedTarget={selectTarget} />
          </section>

          <section className="card resultCard">
            <div className="panelHead">
              <BarChart3 size={21} />
              <div>
                <h2>AI Prediction Dashboard</h2>
                <p>Model probabilities for overall CAD and each vessel.</p>
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            <RiskSummary predictions={predictions} />
            <ShapExplanation prediction={selectedPrediction} selectedTarget={selectedTarget} />
            <ExplanationChat
              result={result}
              selectedTarget={selectedTarget}
              selectedFinding={selectedFinding}
              assessmentId={assessmentId}
            />
            <ReportPanel history={history} onDownload={downloadReport} hasResult={Boolean(result)} />
          </section>
        </section>
      ) : (
        <section className="simulatorPage">
          <div className="card simulatorHero">
            <div>
              <span className="heroBadge"><SlidersHorizontal size={16} /> Model-guided scenario lab</span>
              <h2>What-If Risk Simulator</h2>
              <p>Change controllable clinical inputs and compare current vs projected model probabilities.</p>
            </div>
            <button type="button" className="heroButton" onClick={() => setActiveView("assessment")}>
              Back to assessment
            </button>
          </div>
          <WhatIfSimulator patient={patient} currentResult={result} />
        </section>
      )}
    </main>
  );
}

function HeroSection() {
  return (
    <section className="hero">
      <div className="heroCopy">
        <h2>CardioPredict AI</h2>
      </div>
      <div className="heroVisual">
        <div className="heroCore"><HeartPulse size={48} /></div>
        <div className="orbit orbitOne" />
        <div className="orbit orbitTwo" />
        <div className="heroStat statOne"><strong>4</strong><span>risk outputs</span></div>
        <div className="heroStat statTwo"><strong>SHAP</strong><span>feature impact</span></div>
        <div className="heroStat statThree"><strong>3D</strong><span>coronary focus</span></div>
      </div>
    </section>
  );
}

function buildFinding(target, prediction) {
  const details = vesselDetails[target];
  const probability = prediction?.probability ?? 0;
  const estimatedNarrowing = Math.round(Math.max(12, Math.min(92, probability * 100)));
  const severity = probability >= 0.61 ? "critical inspection zone" : probability >= 0.31 ? "watch zone" : "currently low-risk zone";
  return {
    target,
    title: `${target} suspected stenosis focus`,
    estimatedNarrowing,
    severity,
    area: details.area,
    summary: `${target} is mapped over the ${details.area.toLowerCase()}. Current model risk is ${prediction ? `${asPercent(probability)} ${prediction.risk_level}` : "not available yet"}.`,
  };
}

function validatePatient(patient) {
  const missing = requiredFields.filter(([field]) => patient[field] === null || patient[field] === "" || Number.isNaN(patient[field]));
  if (!missing.length) return "";
  return `Please fill: ${missing.map(([, label]) => label).join(", ")}.`;
}

function sanitizePatient(patient) {
  return {
    ...patient,
    triglyceride: patient.triglyceride ?? 122,
    fasting_blood_sugar: patient.fasting_blood_sugar ?? 98,
    pulse_rate: patient.pulse_rate ?? 70,
    ef_tte: patient.ef_tte ?? 50,
    rwma_region: patient.rwma_region || "None",
  };
}

function PatientForm({ patient, setPatient, onRun, loading }) {
  function update(field, value) {
    setPatient((current) => ({ ...current, [field]: value }));
  }

  const numericFields = [
    ["age", "Age"],
    ["systolic_bp", "Systolic BP"],
    ["diastolic_bp", "Diastolic BP"],
    ["cholesterol", "LDL / cholesterol"],
    ["triglyceride", "Triglyceride"],
    ["fasting_blood_sugar", "Fasting sugar"],
    ["pulse_rate", "Pulse rate"],
    ["ef_tte", "EF-TTE"],
  ];

  return (
    <section className="card inputCard">
      <div className="panelHead">
        <Activity size={21} />
        <div>
          <h2>Patient Input</h2>
          <p>Enter clinical values and run prediction.</p>
        </div>
      </div>

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
        {loading ? "Running..." : "Run Prediction"}
      </button>
    </section>
  );
}

function ReportPanel({ history, onDownload, hasResult }) {
  return (
    <div className="reportBox">
      <div className="panelHead compact">
        <History size={19} />
        <div>
          <h2>Assessment History</h2>
          <p>Recent browser-local runs and a downloadable model report.</p>
        </div>
      </div>
      <button className="downloadReport" type="button" onClick={onDownload} disabled={!hasResult}>
        <Download size={16} /> Download report
      </button>
      <div className="historyList">
        {history.length === 0 && <div className="emptySmall">Run an assessment to create local history.</div>}
        {history.map((item) => (
          <article className="historyItem" key={item.id}>
            <Clock3 size={15} />
            <div>
              <strong>{new Date(item.at).toLocaleString()}</strong>
              <span>
                CAD {item.predictions.CAD ? asPercent(item.predictions.CAD.probability) : "--"} · LAD{" "}
                {item.predictions.LAD ? asPercent(item.predictions.LAD.probability) : "--"} · LCX{" "}
                {item.predictions.LCX ? asPercent(item.predictions.LCX.probability) : "--"} · RCA{" "}
                {item.predictions.RCA ? asPercent(item.predictions.RCA.probability) : "--"}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Heart3D({ predictions, selectedTarget, setSelectedTarget, setSelectedFinding }) {
  const mountRef = useRef(null);
  const stateRef = useRef(null);
  const labelRefs = useRef({});

  function focusSelected() {
    const state = stateRef.current;
    if (!state) return;
    const anchor = state.anchors[selectedTarget];
    const target = new THREE.Vector3();
    anchor.getWorldPosition(target);
    state.desiredTarget.copy(target);
    state.desiredCamera.set(target.x * 0.45, target.y + 0.3, 3.25);
    state.focused = true;
  }

  function resetView() {
    const state = stateRef.current;
    if (!state) return;
    state.desiredTarget.set(0, 0.05, 0);
    state.desiredCamera.set(0, 1.1, 7.2);
    state.focused = true;
  }

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080408);
    scene.fog = new THREE.Fog(0x080408, 6, 14);

    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 1.1, 7.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2.1;
    controls.maxDistance = 7.2;
    controls.target.set(0, 0, 0);

    scene.add(new THREE.HemisphereLight(0xffefe8, 0x25040a, 2.6));
    const keyLight = new THREE.DirectionalLight(0xffb0a7, 3.8);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);
    const cyanLight = new THREE.PointLight(0x22d3ee, 1.5, 8);
    cyanLight.position.set(-3, 0.8, 2.5);
    scene.add(cyanLight);
    const redLight = new THREE.PointLight(0xff3045, 2.1, 8);
    redLight.position.set(2.8, -0.4, 2.2);
    scene.add(redLight);

    const heartGroup = new THREE.Group();
    scene.add(heartGroup);

    const vesselGroup = new THREE.Group();
    scene.add(vesselGroup);

    const riskGlow = new THREE.Group();
    scene.add(riskGlow);

    const heartMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xd94b4b,
      roughness: 0.48,
      metalness: 0.02,
      clearcoat: 0.3,
    });

    const loader = new GLTFLoader();
    loader.load(
      "/models/tripo-heart.glb",
      (gltf) => {
        const model = gltf.scene;
        model.scale.setScalar(2.65);
        model.position.set(0, -0.35, 0);
        model.rotation.set(0.04, -0.12, 0);
        model.traverse((child) => {
          if (child.isMesh) {
            child.material = child.material || heartMaterial;
            child.material.side = THREE.DoubleSide;
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        heartGroup.clear();
        heartGroup.add(model);
      },
      undefined,
      () => {
        heartGroup.add(createCleanHeartFallback());
      }
    );

    const vessels = {
      LAD: createVessel([
        [-0.05, 1.15, 0.75],
        [-0.35, 0.4, 1.05],
        [-0.62, -0.45, 1.0],
        [-0.4, -1.45, 0.6],
      ]),
      LCX: createVessel([
        [0.1, 1.05, 0.78],
        [0.9, 0.85, 0.72],
        [1.55, 0.25, 0.4],
        [1.8, -0.45, 0.02],
      ]),
      RCA: createVessel([
        [0.38, 0.9, 0.7],
        [0.15, 0.0, 1.08],
        [0.2, -0.8, 0.95],
        [0.58, -1.4, 0.35],
      ]),
    };

    const anchors = {
      LAD: new THREE.Object3D(),
      LCX: new THREE.Object3D(),
      RCA: new THREE.Object3D(),
    };
    anchors.LAD.position.set(-0.72, -0.35, 1.15);
    anchors.LCX.position.set(1.58, 0.24, 0.48);
    anchors.RCA.position.set(0.58, -1.28, 0.56);

    Object.entries(vessels).forEach(([target, mesh]) => {
      mesh.userData.target = target;
      vesselGroup.add(mesh);
      vesselGroup.add(anchors[target]);
    });

    const riskMarkers = createRiskMarkers();
    Object.entries(riskMarkers).forEach(([target, marker]) => {
      marker.userData.target = target;
      marker.userData.kind = "defect";
      riskGlow.add(marker);
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onPointerDown(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects([...Object.values(riskMarkers), ...Object.values(vessels)], false)[0];
      if (hit?.object?.userData?.target) {
        const target = hit.object.userData.target;
        setSelectedTarget(target);
        setSelectedFinding(buildFinding(target, stateRef.current?.latestPredictions?.[target]));
      }
    }

    function onResize() {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    }

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);

    stateRef.current = {
      anchors,
      camera,
      controls,
      desiredCamera: new THREE.Vector3(0, 1.1, 6.4),
      desiredTarget: new THREE.Vector3(0, 0, 0),
      focused: false,
      latestPredictions: {},
      riskMarkers,
      vessels,
    };

    let frameId = 0;
    function animate() {
      frameId = requestAnimationFrame(animate);
      vesselGroup.rotation.y = heartGroup.rotation.y;
      riskGlow.rotation.y = heartGroup.rotation.y;
      if (stateRef.current?.focused) {
        camera.position.lerp(stateRef.current.desiredCamera, 0.09);
        controls.target.lerp(stateRef.current.desiredTarget, 0.09);
        if (camera.position.distanceTo(stateRef.current.desiredCamera) < 0.03) {
          stateRef.current.focused = false;
        }
      }
      updateRiskLabels(anchors, labelRefs.current, camera, renderer.domElement);
      controls.update();
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, [setSelectedTarget]);

  useEffect(() => {
    if (stateRef.current) {
      stateRef.current.latestPredictions = predictions;
    }
    const vessels = stateRef.current?.vessels || {};
    const riskMarkers = stateRef.current?.riskMarkers || {};
    Object.entries(vessels).forEach(([target, mesh]) => {
      const level = predictions[target]?.risk_level || "Low";
      mesh.material.color.set(riskColor(level));
      mesh.material.emissive.set(target === selectedTarget ? riskColor(level) : "#000000");
      mesh.material.emissiveIntensity = target === selectedTarget ? 0.75 : 0.18;
      mesh.scale.setScalar(target === selectedTarget ? 1.12 : 1);
      if (riskMarkers[target]) {
        riskMarkers[target].material.color.set(riskColor(level));
        riskMarkers[target].material.opacity = target === selectedTarget ? 0.32 : 0.14;
        riskMarkers[target].scale.setScalar(target === selectedTarget ? 1.4 : 1);
      }
    });
  }, [predictions, selectedTarget]);

  return (
    <div className="heartStage">
      <div ref={mountRef} className="threeMount" />
      <div className="heartLabels">
        {["LAD", "LCX", "RCA"].map((target) => (
          <button
            type="button"
            key={target}
            ref={(node) => { labelRefs.current[target] = node; }}
            className={`floatingLabel ${selectedTarget === target ? "active" : ""}`}
            onClick={() => setSelectedTarget(target)}
          >
            <span>{target}</span>
            <strong>{predictions[target] ? `${asPercent(predictions[target].probability)} ${predictions[target].risk_level}` : "--"}</strong>
          </button>
        ))}
      </div>
      <div className="sceneTools">
        <button type="button" onClick={focusSelected}><Target size={14} /> Focus {selectedTarget}</button>
        <button type="button" onClick={resetView}><RotateCcw size={14} /> Reset</button>
      </div>
      <div className="sceneHint"><Maximize2 size={14} /> Drag to rotate • Scroll to zoom • Click glowing defect zones</div>
    </div>
  );
}

function ArteryDetail({ selectedTarget, prediction, selectedFinding }) {
  const details = vesselDetails[selectedTarget];
  const finding = selectedFinding || buildFinding(selectedTarget, prediction);
  return (
    <div className="arteryDetail">
      <div>
        <span>Selected artery</span>
        <strong>{details.title}</strong>
      </div>
      <div>
        <span>Risk</span>
        <strong style={{ color: prediction ? riskColor(prediction.risk_level) : undefined }}>
          {prediction ? `${asPercent(prediction.probability)} ${prediction.risk_level}` : "--"}
        </strong>
      </div>
      <div>
        <span>Supplies</span>
        <strong>{details.area}</strong>
      </div>
      <p>{details.note}</p>
      <div className="defectPanel">
        <span>Defect inspector</span>
        <strong>{finding.title}</strong>
        <div className="stenosisMeter">
          <div style={{ width: `${finding.estimatedNarrowing}%` }} />
        </div>
        <p>
          Estimated narrowing focus: <b>{finding.estimatedNarrowing}%</b>. This is a {finding.severity}. {finding.summary}
        </p>
      </div>
    </div>
  );
}

function updateRiskLabels(anchors, labels, camera, canvas) {
  Object.entries(anchors).forEach(([target, anchor]) => {
    const label = labels[target];
    if (!label) return;
    const position = new THREE.Vector3();
    anchor.getWorldPosition(position);
    position.project(camera);
    const x = (position.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (-position.y * 0.5 + 0.5) * canvas.clientHeight;
    label.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
    label.style.opacity = position.z < 1 ? "1" : "0.22";
  });
}

function createImageBasedHeart() {
  const group = new THREE.Group();
  const imageLayer = createReferenceHeartLayer();
  imageLayer.position.set(0, -0.1, 0.82);
  imageLayer.scale.set(2.9, 3.18, 1);
  group.add(imageLayer);

  const myocardium = new THREE.MeshPhysicalMaterial({
    color: 0x9f111d,
    transparent: true,
    opacity: 0.42,
    roughness: 0.42,
    metalness: 0.03,
    clearcoat: 0.36,
    clearcoatRoughness: 0.22,
  });
  const darkMyocardium = new THREE.MeshPhysicalMaterial({
    color: 0x5d0b13,
    roughness: 0.5,
    metalness: 0.02,
    clearcoat: 0.2,
  });
  const vesselMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb91c1c,
    roughness: 0.35,
    metalness: 0.04,
    clearcoat: 0.4,
  });
  const veinMaterial = new THREE.MeshBasicMaterial({ color: 0xfca5a5, transparent: true, opacity: 0.72 });

  const leftVentricle = new THREE.Mesh(new THREE.SphereGeometry(1.05, 64, 40), myocardium);
  leftVentricle.position.set(-0.48, -0.48, 0);
  leftVentricle.scale.set(0.95, 1.42, 0.82);
  group.add(leftVentricle);

  const rightVentricle = new THREE.Mesh(new THREE.SphereGeometry(0.92, 64, 40), myocardium);
  rightVentricle.position.set(0.52, -0.36, -0.08);
  rightVentricle.scale.set(0.85, 1.25, 0.72);
  group.add(rightVentricle);

  const apex = new THREE.Mesh(new THREE.ConeGeometry(1.05, 1.75, 64), darkMyocardium);
  apex.rotation.z = Math.PI;
  apex.position.set(-0.04, -1.38, -0.02);
  apex.scale.set(1.08, 1, 0.72);
  group.add(apex);

  const leftAtrium = new THREE.Mesh(new THREE.SphereGeometry(0.62, 48, 30), myocardium);
  leftAtrium.position.set(-0.72, 0.88, -0.1);
  leftAtrium.scale.set(0.9, 0.76, 0.68);
  group.add(leftAtrium);

  const rightAtrium = new THREE.Mesh(new THREE.SphereGeometry(0.66, 48, 30), myocardium);
  rightAtrium.position.set(0.72, 0.78, -0.05);
  rightAtrium.scale.set(0.86, 0.78, 0.7);
  group.add(rightAtrium);

  group.add(createTube([[-0.2, 1.22, -0.08], [-0.2, 1.92, 0.02], [0.45, 2.15, 0], [0.82, 1.65, -0.1]], 0.15, vesselMaterial));
  group.add(createTube([[0.28, 1.16, -0.02], [1.1, 1.42, -0.05], [1.54, 1.0, -0.12]], 0.12, vesselMaterial));
  group.add(createTube([[-0.56, 1.05, -0.04], [-1.18, 1.32, -0.12], [-1.5, 0.96, -0.18]], 0.1, vesselMaterial));

  [
    [[-0.18, 0.92, 0.72], [-0.5, 0.28, 0.82], [-0.72, -0.56, 0.72], [-0.46, -1.34, 0.42]],
    [[0.15, 0.82, 0.68], [0.52, 0.24, 0.7], [0.68, -0.68, 0.56], [0.32, -1.38, 0.32]],
    [[-0.9, 0.12, 0.45], [-0.32, -0.05, 0.74], [0.72, 0.2, 0.48]],
    [[-0.25, -0.72, 0.74], [0.22, -0.92, 0.6], [0.72, -0.72, 0.38]],
  ].forEach((line) => group.add(createTube(line, 0.012, veinMaterial)));

  const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.14 }));
  highlight.position.set(-0.55, 0.16, 0.8);
  highlight.scale.set(1.8, 2.8, 0.45);
  group.add(highlight);

  group.rotation.set(-0.08, -0.08, -0.04);
  return group;
}

function createCleanHeartFallback() {
  const group = new THREE.Group();
  const imageLayer = createReferenceHeartLayer();
  imageLayer.position.set(0, -0.05, 0.05);
  imageLayer.scale.set(3.05, 3.25, 1);
  group.add(imageLayer);
  group.add(createTube([[-0.35, 1.15, 0.1], [-0.2, 1.8, 0.12], [0.45, 2.0, 0.05], [0.78, 1.48, 0.02]], 0.09, new THREE.MeshStandardMaterial({ color: 0xc91828, roughness: 0.35 })));
  group.add(createTube([[0.12, 1.02, 0.1], [0.78, 1.18, 0.05], [1.1, 0.74, 0.0]], 0.08, new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.35 })));
  return group;
}

function createReferenceHeartLayer() {
  const group = new THREE.Group();
  const views = [
    {
      src: "/assets/heart-front.png",
      fallback: "/assets/heart-reference.png",
      position: [0, 0, 0.62],
      rotation: [0, 0, 0],
      scale: [1, 1.12, 1],
    },
    {
      src: "/assets/heart-back.png",
      fallback: "/assets/heart-reference.png",
      position: [0, 0, -0.62],
      rotation: [0, Math.PI, 0],
      scale: [1, 1.12, 1],
    },
    {
      src: "/assets/heart-left.png",
      fallback: "/assets/heart-reference.png",
      position: [-0.58, 0, 0],
      rotation: [0, -Math.PI / 2, 0],
      scale: [0.9, 1.12, 1],
    },
    {
      src: "/assets/heart-right.png",
      fallback: "/assets/heart-reference.png",
      position: [0.58, 0, 0],
      rotation: [0, Math.PI / 2, 0],
      scale: [0.9, 1.12, 1],
    },
    {
      src: "/assets/heart-top.png",
      fallback: "/assets/heart-reference.png",
      position: [0, 0.58, 0],
      rotation: [-Math.PI / 2, 0, 0],
      scale: [0.95, 0.95, 1],
    },
    {
      src: "/assets/heart-bottom.png",
      fallback: "/assets/heart-reference.png",
      position: [0, -0.58, 0],
      rotation: [Math.PI / 2, 0, 0],
      scale: [0.95, 0.95, 1],
    },
  ];

  views.forEach((view) => {
    const plane = createHeartViewPlane(view.src, view.fallback);
    plane.position.set(...view.position);
    plane.rotation.set(...view.rotation);
    plane.scale.set(...view.scale);
    group.add(plane);
  });

  return group;
}

function createHeartViewPlane(src, fallbackSrc) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 768;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1.12, 48, 48),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      alphaTest: 0.04,
      depthWrite: false,
    })
  );
  plane.renderOrder = 5;

  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = () => {
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    const size = Math.min(canvas.width, canvas.height);
    context.drawImage(image, 0, 0, size, size);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const r = pixels.data[i];
      const g = pixels.data[i + 1];
      const b = pixels.data[i + 2];
      if (r > 238 && g > 238 && b > 238) {
        pixels.data[i + 3] = 0;
      }
    }
    context.putImageData(pixels, 0, 0);
    texture.needsUpdate = true;
  };
  image.onerror = () => {
    if (image.src.endsWith(fallbackSrc)) return;
    image.src = fallbackSrc;
  };
  image.src = src;

  return plane;
}

function createProceduralHeart(material) {
  const group = new THREE.Group();
  const left = new THREE.Mesh(new THREE.SphereGeometry(1.05, 48, 32), material);
  left.position.set(-0.72, 0.62, 0);
  left.scale.set(0.92, 1.0, 0.8);
  group.add(left);

  const right = left.clone();
  right.position.x = 0.72;
  group.add(right);

  const body = new THREE.Mesh(new THREE.ConeGeometry(1.55, 2.6, 64), material);
  body.rotation.z = Math.PI;
  body.position.set(0, -0.48, 0);
  body.scale.set(1.05, 1.0, 0.78);
  group.add(body);

  const aortaMaterial = new THREE.MeshPhysicalMaterial({ color: 0xb83a3a, roughness: 0.38 });
  const aorta = createTube([
    [-0.2, 1.45, -0.05],
    [-0.15, 2.1, 0.05],
    [0.5, 2.3, 0.0],
    [0.72, 1.65, -0.12],
  ], 0.13, aortaMaterial);
  group.add(aorta);

  group.rotation.z = -0.08;
  return group;
}

function createVessel(points) {
  return createTube(
    points,
    0.045,
    new THREE.MeshStandardMaterial({
      color: 0x16a34a,
      roughness: 0.35,
      emissive: 0x000000,
      emissiveIntensity: 0.2,
    })
  );
}

function createRiskMarkers() {
  const material = new THREE.MeshBasicMaterial({ color: 0x16a34a, transparent: true, opacity: 0.18 });
  const marker = (x, y, z) => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 16), material.clone());
    mesh.position.set(x, y, z);
    return mesh;
  };
  return {
    LAD: marker(-0.62, -0.45, 1.02),
    LCX: marker(1.55, 0.25, 0.43),
    RCA: marker(0.48, -1.15, 0.55),
  };
}

function createTube(points, radius, material) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const geometry = new THREE.TubeGeometry(curve, 80, radius, 16, false);
  return new THREE.Mesh(geometry, material);
}

function VesselSelector({ predictions, selectedTarget, setSelectedTarget }) {
  return (
    <div className="vesselGrid">
      {["LAD", "LCX", "RCA"].map((target) => {
        const item = predictions[target];
        return (
          <button
            type="button"
            className={`vesselButton ${selectedTarget === target ? "active" : ""}`}
            key={target}
            onClick={() => setSelectedTarget(target)}
          >
            <span>{target}</span>
            <small>{vesselNames[target]}</small>
            <strong style={{ color: item ? riskColor(item.risk_level) : undefined }}>
              {item ? `${asPercent(item.probability)} ${item.risk_level}` : "--"}
            </strong>
          </button>
        );
      })}
    </div>
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
                style={{
                  width: item ? asPercent(item.probability) : "0%",
                  background: item ? riskColor(item.risk_level) : "#d7e0ec",
                }}
              />
            </div>
            <strong>{item ? asPercent(item.probability) : "--"}</strong>
            <em style={{ color: item ? riskColor(item.risk_level) : undefined }}>{item?.risk_level || "--"}</em>
          </div>
        );
      })}
    </div>
  );
}

function WhatIfSimulator({ patient, currentResult }) {
  const [scenario, setScenario] = useState(() => buildWhatIfDefaults(patient));
  const [projected, setProjected] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setScenario(buildWhatIfDefaults(patient));
    setProjected(null);
    setError("");
  }, [patient]);

  function update(field, value) {
    setScenario((current) => ({ ...current, [field]: value }));
  }

  function applyHeartHealthyPreset() {
    setScenario((current) => ({
      ...current,
      systolic_bp: Math.min(Number(current.systolic_bp || 120), 120),
      diastolic_bp: Math.min(Number(current.diastolic_bp || 80), 80),
      cholesterol: Math.min(Number(current.cholesterol || 160), 160),
      triglyceride: Math.min(Number(current.triglyceride || 120), 120),
      fasting_blood_sugar: Math.min(Number(current.fasting_blood_sugar || 95), 95),
      pulse_rate: Math.min(Number(current.pulse_rate || 72), 72),
    }));
  }

  async function runWhatIf() {
    setRunning(true);
    setError("");
    try {
      const payload = sanitizePatient({ ...patient, ...scenario });
      const validationError = validatePatient(payload);
      if (validationError) {
        setError(validationError);
        return;
      }
      const response = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.text();
        throw new Error(body || `API returned ${response.status}`);
      }
      setProjected(await response.json());
    } catch (err) {
      setError(`What-if simulation failed. ${err.message}`);
    } finally {
      setRunning(false);
    }
  }

  const currentPredictions = currentResult?.predictions || {};
  const projectedPredictions = projected?.predictions || {};

  return (
    <div className="whatIfBox">
      <div className="panelHead compact">
        <SlidersHorizontal size={19} />
        <div>
          <h2>What-If Risk Simulator</h2>
          <p>Model-guided scenario only. It is not treatment advice.</p>
        </div>
      </div>

      <div className="whatIfGrid">
        {[
          ["systolic_bp", "Systolic BP", 80, 220],
          ["diastolic_bp", "Diastolic BP", 45, 130],
          ["cholesterol", "Cholesterol", 80, 360],
          ["triglyceride", "Triglyceride", 40, 700],
          ["fasting_blood_sugar", "Fasting sugar", 60, 300],
          ["pulse_rate", "Pulse rate", 40, 160],
          ["ef_tte", "EF-TTE", 15, 85],
        ].map(([field, label, min, max]) => (
          <label key={field}>
            <span>{label}</span>
            <input
              type="range"
              min={min}
              max={max}
              value={scenario[field] ?? patient[field] ?? min}
              onChange={(event) => update(field, Number(event.target.value))}
            />
            <strong>{scenario[field] ?? "--"}</strong>
          </label>
        ))}
      </div>

      <div className="whatIfToggles">
        {[
          ["st_elevation", "ST elevation"],
          ["st_depression", "ST depression"],
          ["t_inversion", "T inversion"],
          ["lvh", "LVH"],
        ].map(([field, label]) => (
          <button
            key={field}
            type="button"
            className={scenario[field] ? "active" : ""}
            onClick={() => update(field, !scenario[field])}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="whatIfActions">
        <button type="button" onClick={applyHeartHealthyPreset}>Apply safer-value preset</button>
        <button type="button" onClick={runWhatIf} disabled={running || !currentResult}>
          {running ? "Simulating..." : "Run what-if"}
        </button>
      </div>

      {error && <div className="emptySmall">{error}</div>}

      <div className="whatIfCompare">
        {["CAD", "LAD", "LCX", "RCA"].map((target) => (
          <WhatIfDelta
            key={target}
            target={target}
            before={currentPredictions[target]}
            after={projectedPredictions[target]}
          />
        ))}
      </div>
    </div>
  );
}

function buildWhatIfDefaults(patient) {
  return {
    systolic_bp: patient.systolic_bp,
    diastolic_bp: patient.diastolic_bp,
    cholesterol: patient.cholesterol,
    triglyceride: patient.triglyceride,
    fasting_blood_sugar: patient.fasting_blood_sugar,
    pulse_rate: patient.pulse_rate,
    ef_tte: patient.ef_tte,
    st_elevation: patient.st_elevation,
    st_depression: patient.st_depression,
    t_inversion: patient.t_inversion,
    lvh: patient.lvh,
  };
}

function WhatIfDelta({ target, before, after }) {
  const beforeValue = before?.probability;
  const afterValue = after?.probability;
  const delta = afterValue !== undefined && beforeValue !== undefined ? afterValue - beforeValue : null;
  const improved = delta !== null && delta < 0;

  return (
    <article className="whatIfDelta">
      <span>{target}</span>
      <strong>
        {before ? asPercent(beforeValue) : "--"} → {after ? asPercent(afterValue) : "--"}
      </strong>
      <em className={delta === null ? "" : improved ? "improved" : "worse"}>
        {delta === null ? "not simulated" : `${improved ? "" : "+"}${Math.round(delta * 100)} pts`}
      </em>
    </article>
  );
}

function ShapExplanation({ prediction, selectedTarget }) {
  return (
    <div className="shapBox" id="explainability">
      <div className="panelHead compact">
        <BrainCircuit size={19} />
        <div>
          <h2>SHAP Explanation</h2>
          <p>{selectedTarget}: top factors pushing the prediction up or down.</p>
        </div>
      </div>
      {!prediction && <div className="emptySmall">Run prediction to view SHAP values.</div>}
      {prediction?.top_features?.map((feature) => (
        <div className="impactRow" key={feature.feature}>
          <span>{feature.feature}</span>
          <div className="impactTrack">
            <div
              style={{
                width: `${Math.max(7, Math.min(100, Math.abs(feature.impact) * 380))}%`,
                background: feature.impact >= 0 ? "#ef4444" : "#16a34a",
              }}
            />
          </div>
          <strong>{feature.impact > 0 ? "+" : ""}{feature.impact}</strong>
        </div>
      ))}
    </div>
  );
}

function ExplanationChat({ result, selectedTarget, selectedFinding, assessmentId }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState(() => buildStarterMessages(result, selectedTarget));

  useEffect(() => {
    setQuestion("");
    setMessages(buildStarterMessages(result, selectedTarget));
  }, [assessmentId]);

  function askChat(customQuestion) {
    const trimmed = (customQuestion ?? question).trim();
    if (!trimmed) return;
    const answer = explainFromResult(trimmed, result, selectedTarget, selectedFinding);
    setMessages((current) => [...current, { role: "user", text: trimmed }, { role: "assistant", text: answer }]);
    setQuestion("");
  }

  return (
    <div className="chatBox">
      <div className="panelHead compact">
        <MessageCircle size={19} />
        <div>
          <h2>Mini Heart Explainability Assistant</h2>
          <p>Resets for every patient and answers only from the current prediction.</p>
        </div>
      </div>
      <MiniHeartAssistant result={result} selectedTarget={selectedTarget} onAsk={askChat} />
      <div className="chatMessages">
        {messages.map((message, index) => (
          <div className={`chatBubble ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>
        ))}
      </div>
      <div className="chatInput">
        <input
          value={question}
          placeholder="Ask: why is LAD high?"
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") askChat();
          }}
        />
        <button type="button" onClick={askChat} aria-label="Ask explainability question"><Send size={16} /></button>
      </div>
    </div>
  );
}

function MiniHeartAssistant({ result, selectedTarget, onAsk }) {
  const selected = result?.predictions?.[selectedTarget];
  const level = selected?.risk_level || "Waiting";
  const prompts = [
    "Why is this risk high?",
    "What does SHAP mean here?",
    "What should I not claim?",
    "Which vessel needs attention first?",
  ];

  return (
    <div className="miniHeartAssistant">
      <div className="miniHeartAvatar" aria-hidden="true">
        <HeartPulse size={24} />
      </div>
      <div className="miniHeartText">
        <strong>{selectedTarget} assistant · {level}</strong>
        <span>
          I can explain this patient&apos;s model result, SHAP factors, and limitations. I will not give a diagnosis or
          invent clinical findings.
        </span>
        <div className="suggestionChips">
          {prompts.map((prompt) => (
            <button key={prompt} type="button" onClick={() => onAsk(prompt)}>
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function buildStarterMessages(result, selectedTarget) {
  if (!result?.predictions?.[selectedTarget]) {
    return [
      {
        role: "assistant",
        text: "Run an assessment first. Then I will explain this patient only, not old patient results.",
      },
    ];
  }
  const selected = result.predictions[selectedTarget];
  return [
    {
      role: "assistant",
      text: `New patient loaded. ${selectedTarget} is ${asPercent(selected.probability)} ${selected.risk_level}. Ask about SHAP, highest vessel risk, or what not to claim from this output.`,
    },
  ];
}

function explainFromResult(question, result, selectedTarget, selectedFinding) {
  if (!result?.predictions) {
    return "Run a prediction first. Then I can explain the model probabilities and SHAP feature contributions.";
  }
  const q = question.toLowerCase();
  const entries = Object.entries(result.predictions);
  const highest = entries.reduce((best, current) => current[1].probability > best[1].probability ? current : best);
  const selected = result.predictions[selectedTarget];
  const top = selected?.top_features || [];
  const topIncreasing = top.filter((item) => item.impact > 0).slice(0, 3);
  const topDecreasing = top.filter((item) => item.impact < 0).slice(0, 2);

  if (q.includes("highest") || q.includes("most") || q.includes("which")) {
    return `${highest[0]} is the highest risk output at ${asPercent(highest[1].probability)} (${highest[1].risk_level}). This is the main vessel/target to discuss first.`;
  }
  if (q.includes("shap") || q.includes("explain")) {
    return `SHAP shows which features pushed the ${selectedTarget} prediction up or down. Positive values increase predicted risk; negative values reduce it for this patient.`;
  }
  if (q.includes("not") || q.includes("avoid") || q.includes("wrong") || q.includes("claim")) {
    return "Do not claim this is a medical diagnosis, do not say the 3D marker is an exact angiography stenosis measurement, do not enter guessed patient values as real values, and do not present SHAP as causation. Say it is a model-based explanation for this structured-data prediction.";
  }
  if (q.includes("suggest") || q.includes("advice") || q.includes("next")) {
    return "Useful next step for presentation: highlight the highest probability vessel, show the top SHAP factors, then state the limitation clearly: the model supports clinical decision review, but a clinician must confirm with proper tests.";
  }
  if (q.includes("defect") || q.includes("stenosis") || q.includes("narrow")) {
    const finding = selectedFinding || buildFinding(selectedTarget, selected);
    return `${finding.title}: the current inspection marker estimates about ${finding.estimatedNarrowing}% narrowing focus. This is a model-guided visual explanation, not an angiography measurement.`;
  }
  if (q.includes("why") || q.includes(selectedTarget.toLowerCase())) {
    const up = topIncreasing.map((item) => `${item.feature} (${item.impact > 0 ? "+" : ""}${item.impact})`).join(", ") || "no strong positive SHAP factors";
    const down = topDecreasing.map((item) => `${item.feature} (${item.impact})`).join(", ") || "no strong negative SHAP factors";
    return `${selectedTarget} is ${asPercent(selected.probability)} ${selected.risk_level}. The main factors increasing risk are ${up}. Factors reducing risk are ${down}.`;
  }
  if (q.includes("doctor") || q.includes("clinical")) {
    return "This is a decision-support prototype, not a diagnosis. A doctor can use the probability, vessel map, and SHAP factors to decide what needs closer clinical review.";
  }
  return `Current summary: CAD ${asPercent(result.predictions.CAD.probability)} ${result.predictions.CAD.risk_level}, LAD ${asPercent(result.predictions.LAD.probability)} ${result.predictions.LAD.risk_level}, LCX ${asPercent(result.predictions.LCX.probability)} ${result.predictions.LCX.risk_level}, RCA ${asPercent(result.predictions.RCA.probability)} ${result.predictions.RCA.risk_level}.`;
}

createRoot(document.getElementById("root")).render(<App />);
