import * as THREE from 'three';
import { exploreNetwork, placeLabels } from './exploration.mjs';
import { clusterColor } from './embeddingPalette.mjs';

const PIN_COLORS = [0x72ede5, 0xffc779];

// Owns only the optional exploration graphics. The original cloud and edges stay intact.
export function createExplorationLayer(scene, camera, container, onSelect) {
  const group = new THREE.Group();
  scene.add(group);
  const labelLayer = document.createElement('div');
  labelLayer.setAttribute('aria-hidden', 'true');
  Object.assign(labelLayer.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden', zIndex: '10', transition: 'opacity .35s' });
  container.appendChild(labelLayer);
  const labelNodes = Array.from({ length: 16 }, () => {
    const node = document.createElement('button');
    node.type = 'button';
    node.tabIndex = -1; // Equivalent text actions are available in the tray/search.
    Object.assign(node.style, {
      display: 'none', position: 'absolute', left: '0', top: '0', willChange: 'transform', pointerEvents: 'auto', border: '0', background: 'transparent',
      color: '#fff', padding: '2px 3px', font: '650 15px/1.25 system-ui, sans-serif', letterSpacing: '0.01em',
      whiteSpace: 'nowrap', cursor: 'pointer', textAlign: 'left',
      WebkitTextStroke: '2px #05070d', paintOrder: 'stroke fill', textShadow: '0 2px 5px #000',
    });
    node.addEventListener('click', () => onSelect(node.dataset.word));
    labelLayer.appendChild(node);
    return node;
  });
  const badge = (word) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.tabIndex = -1;
    Object.assign(node.style, {
      display: 'none', position: 'absolute', left: '0', top: '0', willChange: 'transform', pointerEvents: 'auto', border: '0',
      color: '#fff', padding: '2px 8px', borderRadius: '7px', font: '750 17px/1.25 system-ui, sans-serif',
      WebkitTextStroke: '0.6px #000', textShadow: '0 1px 2px #000c', whiteSpace: 'nowrap', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.5)', zIndex: '1',
    });
    node.addEventListener('click', () => onSelect(word(node)));
    labelLayer.appendChild(node);
    return node;
  };
  const selectedNode = badge(() => '');
  const anchorNode = badge((node) => node.textContent);
  Object.assign(anchorNode.style, { fontSize: '15px', background: '#0b0e14cc', boxShadow: 'inset 0 0 0 1.5px #72ede5, 0 2px 10px rgba(0,0,0,0.5)' });
  let placedLabels = [];
  let dataset = null;
  let options = {};
  let selected = '';
  let network = { roots: [], active: new Set(), segments: [], shared: new Set() };
  let rings = [];
  let spotlightGlow = null;
  let pulse = null;
  let pulseStart = 0;
  let lastLabels = 0;
  let lastNetworkKey = '';
  const lastCamera = new THREE.Matrix4();
  let lastLayout = '';
  let labelsDirty = true;
  const projected = new THREE.Vector3();
  const position = new THREE.Vector3();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function clearGraphics() {
    for (const object of [...group.children]) {
      group.remove(object);
      object.geometry.dispose();
      object.material.dispose();
    }
    rings = [];
    pulse = null;
    spotlightGlow = null;
  }

  function intensity(index) {
    if (dataset && options.spotlight !== null && options.spotlight !== undefined) return dataset.clusters[index] === options.spotlight ? 1 : 0.12;
    return network.roots.length && !network.active.has(index) ? 0.13 : 1;
  }

  function refresh(nextDataset, nextOptions, word) {
    const key = JSON.stringify([word, nextOptions.focus, nextOptions.pins]);
    const animateConnections = nextDataset !== dataset || key !== lastNetworkKey;
    lastNetworkKey = key;
    clearGraphics();
    dataset = nextDataset;
    options = nextOptions;
    selected = word;
    network = exploreNetwork(dataset.words, dataset.edges, word, options.pins, options.focus);
    const positions = [];
    const colors = [];
    for (const segment of network.segments) {
      const pinSlot = options.pins.indexOf(dataset.words[segment.source]);
      const color = new THREE.Color(network.shared.has(segment.target) ? 0xffffff : pinSlot >= 0 ? PIN_COLORS[pinSlot] : clusterColor(dataset.clusters[segment.source]));
      for (const index of [segment.source, segment.target]) {
        positions.push(...dataset.positions.subarray(index * 3, index * 3 + 3));
        colors.push(color.r, color.g, color.b);
      }
    }
    if (positions.length) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      group.add(new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false })));
      if (animateConnections && !reducedMotion.matches) {
        const pulseGeometry = new THREE.BufferGeometry();
        pulseGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(network.segments.length * 3), 3));
        pulse = new THREE.Points(pulseGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.027, transparent: true, opacity: 0.9, depthWrite: false }));
        group.add(pulse);
        pulseStart = performance.now();
      }
    }
    if (options.spotlight !== null && options.spotlight !== undefined) {
      const color = new THREE.Color(clusterColor(options.spotlight));
      const members = [];
      const linePositions = [];
      dataset.clusters.forEach((id, index) => {
        if (id !== options.spotlight) return;
        members.push(...dataset.positions.subarray(index * 3, index * 3 + 3));
        for (const target of dataset.edges[index] ?? []) {
          if (target <= index || target * 3 >= dataset.positions.length) continue;
          linePositions.push(...dataset.positions.subarray(index * 3, index * 3 + 3), ...dataset.positions.subarray(target * 3, target * 3 + 3));
        }
      });
      const additive = { color, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
      const lines = new THREE.BufferGeometry();
      lines.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      group.add(new THREE.LineSegments(lines, new THREE.LineBasicMaterial({ ...additive, opacity: 0.6 })));
      const glow = new THREE.BufferGeometry();
      glow.setAttribute('position', new THREE.Float32BufferAttribute(members, 3));
      spotlightGlow = new THREE.Points(glow, new THREE.PointsMaterial({ ...additive, size: 0.07, opacity: 0.16 }));
      group.add(spotlightGlow);
    }
    const ringIndices = [...new Set([...network.roots, ...network.shared])];
    for (const index of ringIndices) {
      const pinSlot = options.pins.indexOf(dataset.words[index]);
      const color = network.shared.has(index) ? 0xffffff : pinSlot >= 0 ? PIN_COLORS[pinSlot] : clusterColor(dataset.clusters[index]);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.046, 0.054, 32), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false }));
      ring.position.fromArray(dataset.positions, index * 3);
      group.add(ring);
      rings.push(ring);
    }
    lastLabels = 0;
    labelsDirty = true;
    placedLabels = [];
    labelNodes.forEach((node) => { node.style.display = 'none'; });
    const selectedIndex = word ? dataset.words.indexOf(word) : -1;
    selectedNode.dataset.index = selectedIndex;
    if (selectedIndex >= 0) {
      selectedNode.textContent = word;
      selectedNode.style.background = `color-mix(in srgb, ${clusterColor(dataset.clusters[selectedIndex])} 70%, #0b0e14)`;
    }
    const anchorIndex = options.pins[0] && options.pins[0] !== word ? dataset.words.indexOf(options.pins[0]) : -1;
    anchorNode.dataset.index = anchorIndex;
    anchorNode.textContent = options.pins[0] ?? '';
    if (options.pins.length === 2) {
      const [a, b] = options.pins.map((pin) => dataset.words.indexOf(pin));
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([...dataset.positions.subarray(a * 3, a * 3 + 3), ...dataset.positions.subarray(b * 3, b * 3 + 3)], 3));
      const line = new THREE.Line(geometry, new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 0.04, gapSize: 0.03, transparent: true, opacity: 0.9, depthWrite: false }));
      line.computeLineDistances();
      group.add(line);
    }
  }

  function toScreen(index, width, height) {
    projected.fromArray(dataset.positions, index * 3).project(camera);
    if (projected.z < -1 || projected.z > 1) return null;
    return [(projected.x * 0.5 + 0.5) * width, (-projected.y * 0.5 + 0.5) * height];
  }

  function trackLabels(width, height) {
    const selectedIndex = Number(selectedNode.dataset.index ?? -1);
    const selectedPoint = selectedIndex >= 0 && toScreen(selectedIndex, width, height);
    selectedNode.style.display = selectedPoint ? 'block' : 'none';
    if (selectedPoint) selectedNode.style.transform = `translate3d(${selectedPoint[0] + 10}px, ${selectedPoint[1] - 12}px, 0)`;
    const anchorIndex = Number(anchorNode.dataset.index ?? -1);
    const anchorPoint = anchorIndex >= 0 && toScreen(anchorIndex, width, height);
    anchorNode.style.display = anchorPoint ? 'block' : 'none';
    if (anchorPoint) anchorNode.style.transform = `translate3d(${anchorPoint[0] + 10}px, ${anchorPoint[1] - 12}px, 0)`;
    placedLabels.forEach((entry, slot) => {
      const node = labelNodes[slot];
      const point = toScreen(entry.index, width, height);
      node.style.display = point ? 'block' : 'none';
      if (point) node.style.transform = `translate3d(${point[0] + 8}px, ${point[1]}px, 0)`;
    });
  }

  function frame(now) {
    if (!dataset) return;
    for (const ring of rings) {
      ring.quaternion.copy(camera.quaternion);
      ring.scale.setScalar(Math.max(0.45, camera.position.distanceTo(ring.position) * 0.28));
    }
    if (spotlightGlow && !reducedMotion.matches) spotlightGlow.material.opacity = 0.16 + 0.04 * Math.sin(now / 400);
    if (pulse) {
      const progress = (now - pulseStart) / 900;
      pulse.visible = progress < 1 && !reducedMotion.matches;
      if (pulse.visible) {
        const attr = pulse.geometry.getAttribute('position');
        network.segments.forEach(({ source, target: end }, index) => {
          for (let axis = 0; axis < 3; axis++) attr.array[index * 3 + axis] = THREE.MathUtils.lerp(dataset.positions[source * 3 + axis], dataset.positions[end * 3 + axis], progress);
        });
        attr.needsUpdate = true;
      }
    }
    const width = container.clientWidth;
    const height = container.clientHeight;
    camera.updateMatrixWorld();
    trackLabels(width, height);
    if (now - lastLabels < 120) return;
    lastLabels = now;
    const tray = container.closest('[data-embedding-status]')?.querySelector('[aria-label="Word exploration"]');
    const bounds = container.getBoundingClientRect();
    const bottom = tray ? Math.max(100, bounds.bottom - tray.getBoundingClientRect().top + 12) : 110;
    const tooltip = container.querySelector('[data-word-tooltip]');
    const tip = tooltip?.style.display === 'block' ? tooltip.getBoundingClientRect() : null;
    const obstacle = tip ? { x: tip.left - bounds.left, y: tip.top - bounds.top, width: tip.width, height: tip.height } : null;
    const layout = `${width}:${height}:${bottom}:${obstacle?.x ?? ''}:${obstacle?.y ?? ''}`;
    if (!labelsDirty && lastCamera.equals(camera.matrixWorld) && layout === lastLayout) return;
    labelsDirty = false;
    lastCamera.copy(camera.matrixWorld);
    lastLayout = layout;
    if (!options.showLabels && options.spotlight == null) {
      placedLabels = [];
      labelNodes.forEach((node) => { node.style.display = 'none'; });
      return;
    }
    const visible = [];
    for (let index = 0; index < dataset.words.length; index++) {
      if (dataset.words[index] === selected || dataset.words[index] === options.pins[0] || intensity(index) < 1) continue;
      position.fromArray(dataset.positions, index * 3);
      projected.copy(position).project(camera);
      if (projected.z < -1 || projected.z > 1 || Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1) continue;
      visible.push({ index, label: dataset.words[index], x: (projected.x * 0.5 + 0.5) * width + 8, y: (-projected.y * 0.5 + 0.5) * height,
        priority: network.roots.includes(index) ? 0 : network.shared.has(index) ? 1 : network.active.has(index) ? 2 : 3,
        distance: position.distanceToSquared(camera.position) });
    }
    visible.sort((a, b) => a.priority - b.priority || a.distance - b.distance || a.index - b.index);
    const obstacles = obstacle ? [obstacle] : [];
    for (const node of [selectedNode, anchorNode]) {
      if (node.style.display !== 'block') continue;
      const box = node.getBoundingClientRect();
      obstacles.push({ x: box.left - bounds.left, y: box.top - bounds.top, width: box.width, height: box.height });
    }
    placedLabels = placeLabels(visible, width, height, width < 600 ? 6 : 16, bottom, 100, obstacles);
    labelNodes.forEach((node, index) => {
      const entry = placedLabels[index];
      if (!entry) { node.style.display = 'none'; return; }
      node.textContent = entry.label;
      node.dataset.word = dataset.words[entry.index];
      node.style.maxWidth = `${entry.width}px`;
    });
    trackLabels(width, height);
  }

  let hoverIndex = null;
  let hoverLines = null;
  function hover(index) {
    if (index === hoverIndex || !dataset) return;
    hoverIndex = index;
    if (hoverLines) {
      scene.remove(hoverLines);
      hoverLines.geometry.dispose();
      hoverLines.material.dispose();
      hoverLines = null;
    }
    if (index === null || index === undefined) return;
    const positions = [];
    for (const target of dataset.edges[index] ?? []) {
      if (target === index || target * 3 >= dataset.positions.length) continue;
      positions.push(...dataset.positions.subarray(index * 3, index * 3 + 3), ...dataset.positions.subarray(target * 3, target * 3 + 3));
    }
    if (!positions.length) return;
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    hoverLines = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: clusterColor(dataset.clusters[index]), transparent: true, opacity: 0.7, depthWrite: false }));
    scene.add(hoverLines);
  }

  function setHidden(hidden) {
    group.visible = !hidden;
    labelLayer.style.opacity = hidden ? '0' : '1';
    labelLayer.style.visibility = hidden ? 'hidden' : 'visible';
  }

  return { refresh, frame, intensity, hover, setHidden, active: () => network.roots.length > 0 || options.spotlight != null,
    dispose() { hover(null); clearGraphics(); scene.remove(group); labelLayer.remove(); } };
}
