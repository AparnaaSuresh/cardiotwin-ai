import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Activity, BarChart3, BrainCircuit, HeartPulse, Maximize2, MessageCircle, RotateCcw, Send, Sparkles, Target } from "lucide-react";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const predictions = result?.predictions || {};
  const selectedPrediction = predictions[selectedTarget];

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
    } catch (err) {
      setError(`Prediction failed. Make sure the backend is running at ${API_URL}.`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runPrediction();
  }, []);

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand">
          <div className="brandIcon"><HeartPulse size={25} /></div>
          <div>
            <h1>CardioTwin AI</h1>
            <p>3D coronary risk mapping with ML prediction and SHAP explanation</p>
          </div>
        </div>
        <span className="modeBadge">{result?.model_mode || "trained-model"}</span>
      </header>

      <section className="dashboard">
        <PatientForm patient={patient} setPatient={setPatient} onRun={runPrediction} loading={loading} />

        <section className="card heartCard">
          <div className="panelHead">
            <HeartPulse size={21} />
            <div>
              <h2>3D Heart Risk Map</h2>
              <p>Tripo3D-ready view with vessel risk overlays.</p>
            </div>
          </div>
          <div className="tripoBanner">
            <Sparkles size={16} />
            <span>Drop Tripo3D export at <strong>public/models/tripo-heart.glb</strong></span>
          </div>
          <Heart3D predictions={predictions} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />
          <ArteryDetail selectedTarget={selectedTarget} prediction={predictions[selectedTarget]} />
          <VesselSelector predictions={predictions} selectedTarget={selectedTarget} setSelectedTarget={setSelectedTarget} />
        </section>

        <section className="card resultCard">
          <div className="panelHead">
            <BarChart3 size={21} />
            <div>
              <h2>Risk Levels</h2>
              <p>Model probabilities for overall CAD and each vessel.</p>
            </div>
          </div>
          {error && <div className="error">{error}</div>}
          <RiskSummary predictions={predictions} />
          <ShapExplanation prediction={selectedPrediction} selectedTarget={selectedTarget} />
          <ExplanationChat result={result} selectedTarget={selectedTarget} />
        </section>
      </section>
    </main>
  );
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

function Heart3D({ predictions, selectedTarget, setSelectedTarget }) {
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
    scene.background = new THREE.Color(0xf7fbff);

    const camera = new THREE.PerspectiveCamera(38, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 1.1, 7.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 2.35;
    controls.maxDistance = 9.5;
    controls.target.set(0, 0.05, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xcbd5e1, 2.3));
    const keyLight = new THREE.DirectionalLight(0xffffff, 3.3);
    keyLight.position.set(4, 5, 5);
    scene.add(keyLight);

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
        model.scale.setScalar(2.2);
        model.position.set(0, -0.5, 0);
        model.traverse((child) => {
          if (child.isMesh) child.material = child.material || heartMaterial;
        });
        heartGroup.clear();
        heartGroup.add(model);
      },
      undefined,
      () => {
        heartGroup.add(createImageBasedHeart());
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
    Object.values(riskMarkers).forEach((marker) => riskGlow.add(marker));

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    function onPointerDown(event) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(Object.values(vessels), false)[0];
      if (hit?.object?.userData?.target) setSelectedTarget(hit.object.userData.target);
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
      desiredCamera: new THREE.Vector3(0, 1.1, 7.2),
      desiredTarget: new THREE.Vector3(0, 0.05, 0),
      focused: false,
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
      <div className="sceneHint"><Maximize2 size={14} /> Drag to rotate • Scroll to zoom • Click artery risk labels</div>
    </div>
  );
}

function ArteryDetail({ selectedTarget, prediction }) {
  const details = vesselDetails[selectedTarget];
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
  const texture = new THREE.TextureLoader().load("/assets/heart-reference.png");
  texture.colorSpace = THREE.SRGBColorSpace;

  const imageMaterial = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.05,
    side: THREE.DoubleSide,
  });
  const heartPlane = new THREE.Mesh(new THREE.PlaneGeometry(3.45, 4.35, 32, 32), imageMaterial);
  heartPlane.position.set(0, -0.12, 0.2);
  group.add(heartPlane);

  const depthMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x9f1f2d,
    transparent: true,
    opacity: 0.22,
    roughness: 0.48,
    metalness: 0.02,
  });
  const backVolume = createProceduralHeart(depthMaterial);
  backVolume.position.set(0, -0.22, -0.34);
  backVolume.scale.set(0.82, 0.86, 0.52);
  group.add(backVolume);

  group.rotation.x = -0.06;
  return group;
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

function ShapExplanation({ prediction, selectedTarget }) {
  return (
    <div className="shapBox">
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

function ExplanationChat({ result, selectedTarget }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask me why the model predicted this risk, which vessel is highest, or what the SHAP factors mean.",
    },
  ]);

  function askChat() {
    const trimmed = question.trim();
    if (!trimmed) return;
    const answer = explainFromResult(trimmed, result, selectedTarget);
    setMessages((current) => [...current, { role: "user", text: trimmed }, { role: "assistant", text: answer }]);
    setQuestion("");
  }

  return (
    <div className="chatBox">
      <div className="panelHead compact">
        <MessageCircle size={19} />
        <div>
          <h2>Explainability Chat</h2>
          <p>Answers are grounded only in the current model output and SHAP values.</p>
        </div>
      </div>
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

function explainFromResult(question, result, selectedTarget) {
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
