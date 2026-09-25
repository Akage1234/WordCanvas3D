"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const LABEL_STYLE = {
  position: "absolute", left: "0", top: "0", whiteSpace: "nowrap", pointerEvents: "none", willChange: "transform",
  color: "#fff", font: "650 14px/1.25 system-ui, sans-serif", letterSpacing: "0.01em",
  WebkitTextStroke: "2px #05070d", paintOrder: "stroke fill", textShadow: "0 2px 5px #000",
};
const PILL_STYLE = { background: "", padding: "2px 8px", borderRadius: "7px", font: "750 15px/1.25 system-ui, sans-serif", WebkitTextStroke: "0.6px #000", boxShadow: "0 2px 10px rgba(0,0,0,.5)", color: "#fff" };
const DIM_STYLE = { background: "none", padding: "0", borderRadius: "0", font: "600 11px/1.2 ui-monospace, monospace", color: "#9aa7ba", WebkitTextStroke: "0", boxShadow: "none" };
const WORD_STYLE = { background: "none", padding: "0", borderRadius: "0", font: LABEL_STYLE.font, color: "#fff", WebkitTextStroke: LABEL_STYLE.WebkitTextStroke, boxShadow: "none" };

const MOVE_MS = 650;
const GROW_MS = 700;
const LINK_MS = 600;
const clamp01 = (t) => Math.min(1, Math.max(0, t));
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const easeIn = (t) => t * t * t;

// Draws what the page hands it: arrows from the origin (`items`) and helper arrows/lines (`links`), all in 3D scene units.
// Arrows are kept alive between updates: existing words glide to their new place, new words grow in, removed words shrink out.
export default function VectorPlaygroundCanvas({ showGridlines = true, items = [], links = [], originLabel = "" }) {
  const ref = useRef(null);
  const stateRef = useRef(null);

  useEffect(() => {
    const container = ref.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090a12);
    // Orthographic, so vectors that are parallel in the projection also look parallel on screen.
    const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
    camera.position.set(4, 3, 4);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    Object.assign(renderer.domElement.style, { position: "absolute", inset: "0", width: "100%", height: "100%", outline: "none" });
    container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;

    const labelLayer = document.createElement("div");
    Object.assign(labelLayer.style, { position: "absolute", inset: "0", pointerEvents: "none", overflow: "hidden" });
    container.appendChild(labelLayer);

    const axes = new THREE.Group();
    ["PC1", "PC2", "PC3"].forEach((name, i) => {
      const dir = new THREE.Vector3(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0);
      axes.add(new THREE.ArrowHelper(dir, new THREE.Vector3(), 2.2, 0x3a4252, 0.12, 0.06));
      axes.userData[name] = dir.clone().multiplyScalar(2.4);
    });
    scene.add(axes);
    const origin = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    scene.add(origin);
    const grid = new THREE.GridHelper(5, 10, 0x2a2f3a, 0x171a22);
    grid.position.y = -0.001;
    scene.add(grid);
    const content = new THREE.Group();
    const linkGroup = new THREE.Group();
    scene.add(content, linkGroup);

    const fixedLabels = ["PC1", "PC2", "PC3"].map((name) => {
      const el = document.createElement("div");
      Object.assign(el.style, LABEL_STYLE, { font: "500 11px/1 ui-monospace, monospace", color: "#6b7688", WebkitTextStroke: "0", textShadow: "none" });
      el.textContent = name;
      labelLayer.appendChild(el);
      return { el, pos: axes.userData[name] };
    });
    const originEl = document.createElement("div");
    Object.assign(originEl.style, LABEL_STYLE, { font: "500 11px/1 ui-monospace, monospace", color: "#9aa7ba", WebkitTextStroke: "0", textShadow: "0 1px 3px #000" });
    labelLayer.appendChild(originEl);
    fixedLabels.push({ el: originEl, pos: new THREE.Vector3(0, -0.12, 0) });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = { content, linkGroup, grid, labelLayer, originEl, nodes: new Map(), linkAnims: [], seenLinks: new Set(), hovered: null, reduced };
    stateRef.current = state;

    const projected = new THREE.Vector3();
    const place = (el, pos, dx) => {
      projected.copy(pos).project(camera);
      const visible = projected.z < 1;
      el.style.display = visible ? "block" : "none";
      if (visible) {
        const x = (projected.x * 0.5 + 0.5) * container.clientWidth + dx;
        const y = (-projected.y * 0.5 + 0.5) * container.clientHeight;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(0, -50%)`;
      }
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onPointerMove = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(mouse, camera);
      const tubes = [...state.nodes.values()].filter((n) => n.tube && !n.removing).map((n) => n.tube);
      const hit = raycaster.intersectObjects(tubes, false)[0]?.object.userData.node ?? null;
      if (hit === state.hovered) return;
      if (state.hovered) state.hovered.arrow.setColor(state.hovered.color);
      if (hit) hit.arrow.setColor(0xffffff);
      state.hovered = hit;
      renderer.domElement.style.cursor = hit ? "pointer" : "default";
    };
    renderer.domElement.addEventListener("pointermove", onPointerMove);

    const tip = new THREE.Vector3();
    let raf = 0;
    const animate = () => {
      const now = performance.now();
      // Move the camera first so labels are projected with this frame's view, not the previous one.
      controls.update();
      camera.updateMatrixWorld();
      for (const [id, node] of state.nodes) {
        const move = reduced ? 1 : easeInOut(clamp01((now - node.moveT0) / MOVE_MS));
        node.current.lerpVectors(node.start, node.target, move);
        const g = reduced ? 1 : clamp01((now - node.growT0 - node.growDelay) / GROW_MS);
        node.grow = node.growFrom + (node.growTo - node.growFrom) * (node.growTo > node.growFrom ? easeOutBack(g) : easeIn(g));
        applyNode(node, tip);
        place(node.el, tip, 10);
        if (node.removing && g >= 1) {
          disposeNode(state, node);
          state.nodes.delete(id);
        }
      }
      for (const anim of state.linkAnims) {
        const t = reduced ? 1 : clamp01((now - anim.t0 - anim.delay) / LINK_MS);
        anim.step(1 - Math.pow(1 - t, 3), reduced || now - anim.t0 >= anim.delay);
      }
      renderer.render(scene, camera);
      for (const { el, pos } of fixedLabels) place(el, pos, 4);
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const resize = () => {
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      const halfW = Math.max(3.1, 3.1 * (w / h));
      const halfH = halfW / (w / h);
      Object.assign(camera, { left: -halfW, right: halfW, top: halfH, bottom: -halfH });
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      controls.dispose();
      scene.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
      renderer.dispose();
      container.replaceChildren();
      stateRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (stateRef.current) stateRef.current.grid.visible = showGridlines;
  }, [showGridlines]);

  useEffect(() => {
    if (stateRef.current) stateRef.current.originEl.textContent = originLabel;
  }, [originLabel]);

  useEffect(() => {
    if (!stateRef.current) return;
    syncNodes(stateRef.current, items);
    syncLinks(stateRef.current, links);
  }, [items, links]);

  return <div ref={ref} className="relative w-full h-full overflow-hidden" />;
}

function applyNode(node, tip) {
  tip.copy(node.current).multiplyScalar(node.grow);
  if (node.mesh) {
    node.mesh.position.copy(node.current);
    node.mesh.scale.setScalar(Math.max(node.grow, 1e-3));
    tip.copy(node.current);
  } else {
    const length = tip.length();
    node.arrow.visible = length > 1e-3;
    if (node.arrow.visible) {
      node.arrow.setDirection(tip.clone().normalize());
      node.arrow.setLength(length, Math.min(0.22, length * 0.2), Math.min(0.1, length * 0.1));
    }
    if (node.tube) {
      node.tube.scale.set(1, Math.max(length, 1e-3), 1);
      node.tube.position.copy(tip).multiplyScalar(0.5);
      if (length > 1e-3) node.tube.quaternion.setFromUnitVectors(UP, tip.clone().normalize());
    }
  }
  node.el.style.opacity = String(clamp01((node.grow - 0.55) / 0.45));
}

const UP = new THREE.Vector3(0, 1, 0);

function disposeNode(state, node) {
  for (const obj of [node.arrow, node.mesh, node.tube]) {
    if (!obj) continue;
    state.content.remove(obj);
    obj.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  }
  node.el.remove();
  if (state.hovered === node) state.hovered = null;
}

function styleNode(node, item) {
  const faded = item.kind === "faded";
  node.color = new THREE.Color(item.color).getHex();
  if (node.arrow) {
    node.arrow.setColor(node.color);
    for (const m of [node.arrow.line.material, node.arrow.cone.material]) {
      if (m.transparent !== faded) m.needsUpdate = true;
      Object.assign(m, { transparent: faded, opacity: faded ? 0.2 : 1 });
    }
  }
  if (node.mesh) node.mesh.material.color.set(node.color);
  node.el.textContent = item.label;
  const pill = item.kind === "answer";
  Object.assign(node.el.style, pill ? { ...PILL_STYLE, background: `color-mix(in srgb, ${item.color} 70%, #0b0e14)` } : faded || item.kind === "point" ? DIM_STYLE : WORD_STYLE);
}

function syncNodes(state, items) {
  const now = performance.now();
  const ids = new Set(items.map((it) => it.id));
  for (const node of state.nodes.values()) {
    if (ids.has(node.id) || node.removing) continue;
    Object.assign(node, { removing: true, growFrom: node.grow, growTo: 0, growT0: now, growDelay: 0 });
  }
  for (const item of items) {
    const target = new THREE.Vector3(...item.pos);
    let node = state.nodes.get(item.id);
    const isPoint = item.kind === "point";
    if (node && Boolean(node.mesh) !== isPoint) {
      disposeNode(state, node);
      state.nodes.delete(item.id);
      node = null;
    }
    if (!node) {
      node = { id: item.id, current: target.clone(), start: target.clone(), target, moveT0: now, grow: 0, growFrom: 0, growTo: 1, growT0: now, growDelay: (item.delay ?? 0) * 1000 };
      if (isPoint) {
        node.mesh = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 }));
        state.content.add(node.mesh);
      } else {
        node.arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xffffff, 0.2, 0.1);
        state.content.add(node.arrow);
        if (item.kind !== "faded") {
          node.tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1, 8), new THREE.MeshBasicMaterial({ visible: false }));
          node.tube.userData.node = node;
          state.content.add(node.tube);
        }
      }
      node.el = document.createElement("div");
      Object.assign(node.el.style, LABEL_STYLE, { opacity: "0" });
      state.labelLayer.appendChild(node.el);
      state.nodes.set(item.id, node);
    } else {
      node.start = node.current.clone();
      node.target = target;
      node.moveT0 = now;
      if (node.removing) Object.assign(node, { removing: false, growFrom: node.grow, growTo: 1, growT0: now, growDelay: 0 });
    }
    styleNode(node, item);
  }
}

function syncLinks(state, links) {
  const { linkGroup } = state;
  linkGroup.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  linkGroup.clear();
  const now = performance.now();
  const key = (l) => `${l.from}>${l.to}>${l.dashed ? 1 : 0}`;
  state.linkAnims = [];
  for (const link of links) {
    const delay = state.seenLinks.has(key(link)) ? -1e6 : (link.delay ?? 0) * 1000;
    const from = new THREE.Vector3(...link.from);
    const to = new THREE.Vector3(...link.to);
    if (link.dashed) {
      const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([from, to]), new THREE.LineDashedMaterial({ color: link.color, dashSize: 0.06, gapSize: 0.05 }));
      line.computeLineDistances();
      linkGroup.add(line);
      state.linkAnims.push({ t0: now, delay, step: (e, started) => { line.visible = started; line.geometry.setFromPoints([from, from.clone().lerp(to, Math.max(e, 1e-3))]); line.computeLineDistances(); } });
      continue;
    }
    const dir = new THREE.Vector3().subVectors(to, from);
    const length = dir.length();
    if (length < 1e-6) continue;
    const head = Math.min(0.18, length * 0.16);
    const width = Math.min(0.08, length * 0.08);
    const arrow = new THREE.ArrowHelper(dir.normalize(), from, length, new THREE.Color(link.color).getHex(), head, width);
    if (link.faded) for (const m of [arrow.line.material, arrow.cone.material]) Object.assign(m, { transparent: true, opacity: 0.2 });
    linkGroup.add(arrow);
    state.linkAnims.push({ t0: now, delay, step: (e, started) => { arrow.visible = started; arrow.setLength(Math.max(length * e, 1e-3), head * e, width * e); } });
  }
  state.seenLinks = new Set(links.map(key));
}
