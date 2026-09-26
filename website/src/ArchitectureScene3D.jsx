import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";

const layerData = [
  {
    y: 0.45,
    title: "RECORDS & ANALYTICS",
    sub: "Store each kind of information for its purpose",
    color: 0x416a88,
    cards: [
      ["Business records", "sessions · tariffs · invoices"],
      ["Events & replay", "source history · corrections"],
      ["Telemetry", "metering · energy · performance"],
      ["Evidence", "decisions · documents · audit"],
    ],
  },
  {
    y: 1.65,
    title: "SHARED MEANING",
    sub: "Concepts · relationships · rules · time",
    color: 0x3b9679,
    semantic: true,
  },
  {
    y: 2.85,
    title: "PARTNERS & DEVICES",
    sub: "Bring outside events into a consistent business context",
    color: 0x3e7885,
    cards: [
      ["Chargers & meters", "assets · sessions · readings"],
      ["Mobility partners", "access · roaming · records"],
      ["Payments", "authorisation · capture · refund"],
      ["Energy & grid", "prices · limits · schedules"],
    ],
  },
  {
    y: 4.05,
    title: "BUSINESS SERVICES",
    sub: "Separate services, shared definitions",
    color: 0x448b78,
    cards: [
      ["Identity & access", "who may do what"],
      ["Sessions & metering", "what happened at the charger"],
      ["Pricing & billing", "why this amount is due"],
      ["Roaming & settlement", "who owes whom"],
    ],
  },
  {
    y: 5.25,
    title: "CHANNELS & INSIGHT",
    sub: "One connected picture for every participant",
    color: 0x6eaa87,
    cards: [
      ["Drivers & fleets", "charge · access · reimburse"],
      ["CPO operations", "assets · service · recovery"],
      ["Finance & partners", "rating · invoice · settlement"],
      ["Energy teams", "capacity · flexibility · outcomes"],
    ],
  },
];

const sceneNodes = [
  ["Party", -4.3, -0.15],
  ["Site", -2.6, 0.9],
  ["Session", -1.0, -0.25],
  ["Tariff", 0.8, 0.85],
  ["Evidence", 2.6, -0.25],
  ["Settlement", 4.3, 0.9],
];
const nodeLinks = [
  [0, 1], [1, 2], [2, 3], [2, 4], [3, 4], [4, 5], [0, 2], [2, 5],
];

function makeBusinessLabel(title, detail, accent, compact = false) {
  const element = document.createElement("div");
  element.className = compact ? "cw3-label cw3-label--compact" : "cw3-label";
  element.style.setProperty("--label-accent", `#${accent.toString(16).padStart(6, "0")}`);
  const strong = document.createElement("strong");
  strong.textContent = title;
  element.append(strong);
  if (detail) {
    const small = document.createElement("span");
    small.textContent = detail;
    element.append(small);
  }
  return element;
}

function addEdges(scene, geometry, color, opacity = 0.78) {
  const line = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  );
  scene.add(line);
  return line;
}

function addLine(scene, points, color, opacity = 0.72, dashed = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = dashed
    ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.16, gapSize: 0.12 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  const line = new THREE.Line(geometry, material);
  if (dashed) line.computeLineDistances();
  scene.add(line);
  return line;
}

function addLabel(scene, title, detail, accent, position, compact = false) {
  const object = new CSS2DObject(makeBusinessLabel(title, detail, accent, compact));
  object.position.set(...position);
  scene.add(object);
  return object;
}

export default function ArchitectureScene3D() {
  const hostRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-9, 9, 6.1, -6.1, 0.1, 80);
    camera.position.set(13, 14.2, 16);
    camera.lookAt(0, 2.95, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.domElement.className = "cw3-webgl";
    host.appendChild(renderer.domElement);

    const labels = new CSS2DRenderer();
    labels.domElement.className = "cw3-label-layer";
    labels.domElement.style.pointerEvents = "none";
    host.appendChild(labels.domElement);

    scene.add(new THREE.HemisphereLight(0xc8fbeb, 0x09131b, 2.2));
    const key = new THREE.DirectionalLight(0xc4f7e7, 2.4);
    key.position.set(-8, 14, 11);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x5b9bd5, 1.15);
    rim.position.set(9, 9, -8);
    scene.add(rim);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 32),
      new THREE.MeshBasicMaterial({ color: 0x0a141c, transparent: true, opacity: 0.54 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0.05;
    scene.add(floor);

    const grid = new THREE.GridHelper(30, 30, 0x29434b, 0x1b2d36);
    grid.position.y = 0.07;
    grid.material.transparent = true;
    grid.material.opacity = 0.3;
    scene.add(grid);

    const width = 12.2;
    const depth = 7.15;
    const plateHeight = 0.2;
    const tileXs = [-4.25, -1.42, 1.42, 4.25];
    const tileWidth = 2.46;
    const tileDepth = 1.36;
    const allGeometry = [];
    const allMaterials = [];
    const layerTitleObjects = [];

    layerData.forEach((layer) => {
      const baseGeometry = new THREE.BoxGeometry(width, plateHeight, depth);
      const baseMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(layer.color).multiplyScalar(0.42),
        roughness: 0.36,
        metalness: 0.28,
      });
      const plate = new THREE.Mesh(baseGeometry, baseMaterial);
      plate.position.set(0, layer.y, 0);
      plate.castShadow = true;
      plate.receiveShadow = true;
      scene.add(plate);
      addEdges(scene, baseGeometry, layer.color, 0.82).position.copy(plate.position);
      allGeometry.push(baseGeometry);
      allMaterials.push(baseMaterial);

      const titleEl = document.createElement("div");
      titleEl.className = "cw3-level-title";
      titleEl.style.setProperty("--label-accent", `#${layer.color.toString(16).padStart(6, "0")}`);
      titleEl.textContent = layer.title;
      const titleObject = new CSS2DObject(titleEl);
      titleObject.position.set(-6.1, layer.y + 0.8, 1.8);
      layerTitleObjects.push(titleObject);
      scene.add(titleObject);

      if (layer.semantic) {
        const points = sceneNodes.map(([, x, z]) => new THREE.Vector3(x, layer.y + 0.34, z));
        nodeLinks.forEach(([from, to]) => addLine(scene, [points[from], points[to]], layer.color, 0.72));
        points.forEach((point, nodeIndex) => {
          const nodeGeometry = new THREE.IcosahedronGeometry(nodeIndex === 2 ? 0.23 : 0.17, 1);
          const nodeMaterial = new THREE.MeshStandardMaterial({
            color: nodeIndex === 2 ? 0xb3f6d4 : 0x6fcbb0,
            emissive: nodeIndex === 2 ? 0x2f8e6d : 0x164b42,
            emissiveIntensity: 0.75,
            metalness: 0.18,
            roughness: 0.26,
          });
          const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
          node.position.copy(point);
          scene.add(node);
          allGeometry.push(nodeGeometry);
          allMaterials.push(nodeMaterial);
        });
        const coreGlow = new THREE.Mesh(
          new THREE.TorusGeometry(0.48, 0.018, 8, 72),
          new THREE.MeshBasicMaterial({ color: 0x9aefc7, transparent: true, opacity: 0.56 }),
        );
        coreGlow.rotation.x = Math.PI / 2;
        coreGlow.position.set(points[2].x, layer.y + 0.26, points[2].z);
        scene.add(coreGlow);
        allGeometry.push(coreGlow.geometry);
        allMaterials.push(coreGlow.material);
      } else {
        const cards = layer.cards || [];
        const cardCenters = cards.length === 5 ? [-5, -2.5, 0, 2.5, 5] : tileXs;
        const cardWidth = cards.length === 5 ? 2.08 : tileWidth;
        cards.forEach(([name, detail], cardIndex) => {
          const geometry = new THREE.BoxGeometry(cardWidth, 0.13, tileDepth);
          const material = new THREE.MeshStandardMaterial({
            color: new THREE.Color(layer.color).multiplyScalar(0.65),
            roughness: 0.3,
            metalness: 0.22,
            emissive: new THREE.Color(layer.color).multiplyScalar(0.09),
          });
          const tile = new THREE.Mesh(geometry, material);
          tile.position.set(cardCenters[cardIndex], layer.y + 0.2, -0.2);
          tile.castShadow = true;
          scene.add(tile);
          addEdges(scene, geometry, layer.color, 0.92).position.copy(tile.position);
          allGeometry.push(geometry);
          allMaterials.push(material);
          const label = addLabel(
            scene,
            name,
            "",
            layer.color,
            [cardCenters[cardIndex], layer.y + 0.58, -0.35],
            true,
          );
          label.element.classList.add("cw3-label--tile");
        });
      }

      // Small light points along the front edge make the layers read as one stack.
      for (const x of [-5.65, 5.65]) {
        const marker = new THREE.Mesh(
          new THREE.SphereGeometry(0.045, 12, 12),
          new THREE.MeshBasicMaterial({ color: layer.color }),
        );
        marker.position.set(x, layer.y + 0.12, depth / 2 + 0.12);
        scene.add(marker);
        allGeometry.push(marker.geometry);
        allMaterials.push(marker.material);
      }
    });

    // Vertical alignment rails emphasize shared identity, time and evidence across layers.
    for (const x of [-5.9, 5.9]) {
      const railGeometry = new THREE.CylinderGeometry(0.035, 0.035, 5.4, 10);
      const railMaterial = new THREE.MeshBasicMaterial({ color: 0x74d4b3, transparent: true, opacity: 0.58 });
      const rail = new THREE.Mesh(railGeometry, railMaterial);
      rail.position.set(x, 3.0, 2.42);
      scene.add(rail);
      allGeometry.push(railGeometry);
      allMaterials.push(railMaterial);
    }

    // One highlighted route follows a charging fact into the shared model and back out as insight.
    const route = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-6.7, 2.88, 0.35),
      new THREE.Vector3(-4.4, 2.95, 0.22),
      new THREE.Vector3(-2.65, 4.25, -0.18),
      new THREE.Vector3(-1.55, 1.92, 0.14),
      new THREE.Vector3(0.2, 0.52, -0.25),
      new THREE.Vector3(2.05, 0.52, -0.12),
      new THREE.Vector3(3.75, 5.45, -0.15),
    ]);
    const routeGeometry = new THREE.BufferGeometry().setFromPoints(route.getPoints(120));
    const routeMaterial = new THREE.LineDashedMaterial({
      color: 0xffca78,
      dashSize: 0.2,
      gapSize: 0.16,
      transparent: true,
      opacity: 0.68,
    });
    const routeLine = new THREE.Line(routeGeometry, routeMaterial);
    routeLine.computeLineDistances();
    scene.add(routeLine);
    allGeometry.push(routeGeometry);
    allMaterials.push(routeMaterial);

    const pulseGeometry = new THREE.SphereGeometry(0.085, 18, 18);
    const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0xffd28a });
    const pulse = new THREE.Mesh(pulseGeometry, pulseMaterial);
    scene.add(pulse);
    allGeometry.push(pulseGeometry);
    allMaterials.push(pulseMaterial);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minZoom = 0.8;
    controls.maxZoom = 1.28;
    controls.minPolarAngle = Math.PI * 0.22;
    controls.maxPolarAngle = Math.PI * 0.43;
    controls.target.set(0, 2.92, 0);
    controls.update();

    let frame = 0;
    const resize = () => {
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
      const aspect = w / h;
      const viewHeight = Math.max(12.2, 15.4 / aspect);
      camera.top = viewHeight / 2;
      camera.bottom = -viewHeight / 2;
      camera.left = (-viewHeight * aspect) / 2;
      camera.right = (viewHeight * aspect) / 2;
      const narrow = w < 560;
      layerTitleObjects.forEach((title, index) => {
        title.position.set(narrow ? -3.4 : -6.1, layerData[index].y + 0.8, narrow ? -0.1 : 1.8);
      });
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      labels.setSize(w, h);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const clock = new THREE.Clock();
    const render = () => {
      frame = requestAnimationFrame(render);
      const elapsed = clock.getElapsedTime();
      pulse.position.copy(route.getPoint((elapsed * 0.055) % 1));
      pulse.scale.setScalar(0.88 + Math.sin(elapsed * 3.2) * 0.12);
      controls.update();
      renderer.render(scene, camera);
      labels.render(scene, camera);
    };
    render();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      allGeometry.forEach((geometry) => geometry.dispose());
      allMaterials.forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
      labels.domElement.remove();
    };
  }, []);

  return <div className="cw3-scene" ref={hostRef} role="img" aria-label="Isometric proposed ChargeWeave architecture, showing business channels and insights, business services, partner connections, shared semantic model, and records and analytics, with identity and audit controls across all layers." />;
}
