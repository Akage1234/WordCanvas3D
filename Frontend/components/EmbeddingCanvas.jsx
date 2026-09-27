"use client";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import JSZip from "jszip";
import { createExplorationLayer } from "@/components/embedding/explorationLayer.mjs";
import { exploreNetwork } from "@/components/embedding/exploration.mjs";
import { ungzip } from "pako";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { datasetUrl, parseDataset, DatasetError } from "@/components/embedding/embeddingData.mjs";
import {
  CLUSTER_COLORS,
  DEFAULT_POINT_COLOR,
  clusterColor,
  darkenHex,
} from "@/components/embedding/embeddingPalette.mjs";

// Seconds of context loss before the page offers a manual 3D reload (restoration may still happen later).
const CONTEXT_RESTORE_WAIT_MS = 5000;

const EmbeddingCanvas = forwardRef(function EmbeddingCanvas({ embeddingModel = "glove_300D", wordCount = "1000", reductionMethod = "pca", searchWord = "", pickedWord = "", useClusterColors = false, showClusterEdges = false, onDataStatus = null, onGraphicsStatus = null, onPick = null, exploration, motion = true, ariaLabel }, ref) {
  const containerRef = useRef(null);
  const canvasFunctionsRef = useRef({ searchForWord: null, updateClusterColors: null, resetColors: null });
  const useClusterColorsRef = useRef(useClusterColors);
  const showClusterEdgesRef = useRef(showClusterEdges);
  const selectedWordRef = useRef(pickedWord || searchWord);
  const explorationRef = useRef(exploration);
  explorationRef.current = exploration;
  const callbacksRef = useRef({});
  callbacksRef.current = { onDataStatus, onGraphicsStatus, onPick };
  selectedWordRef.current = pickedWord || searchWord;
  const motionRef = useRef(motion);
  motionRef.current = motion;
  const methodRef = useRef(reductionMethod);
  methodRef.current = reductionMethod;
  const flownWordRef = useRef(selectedWordRef.current);

  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    locate: (word) => canvasFunctionsRef.current?.frameSelection?.(word),
    frameCluster: (id) => canvasFunctionsRef.current?.frameCluster?.(id),
    retry: () => canvasFunctionsRef.current?.retry?.(),
    clearSelection: () => canvasFunctionsRef.current?._internalSearchForWord?.(""),
  }), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    const emitData = (s) => { if (!disposed) callbacksRef.current.onDataStatus?.(s); };
    const emitGraphics = (s) => { if (!disposed) callbacksRef.current.onGraphicsStatus?.(s); };

    // --- Setup scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090a12); // Even darker blue-black background
    scene.fog = new THREE.Fog(0x090a12, 2, 8);
    const drift = { uTime: { value: 0 }, uDrift: { value: 0 } };
    const addDrift = (mat) => {
      mat.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, drift);
        shader.vertexShader = `uniform float uTime;\nuniform float uDrift;\n${shader.vertexShader}`.replace("#include <begin_vertex>",
          "#include <begin_vertex>\ntransformed += uDrift * vec3(sin(uTime * 0.6 + position.y * 9.0), sin(uTime * 0.5 + position.z * 9.0), sin(uTime * 0.7 + position.x * 9.0));");
      };
      return mat;
    };
    const camera = new THREE.PerspectiveCamera(
      75,
      Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
      0.1,
      1000
    );
    camera.position.z = 3;

    // Renderer creation can fail (WebGL disabled/unsupported). Data, search and text details still work without it.
    let renderer = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch (error) {
      console.error("WebGL unavailable:", error);
    }
    emitGraphics(renderer ? "ok" : "unavailable");

    let controls = null;
    if (renderer) {
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Style the canvas to fill container properly
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.outline = 'none';
    
    container.appendChild(renderer.domElement);

    // Setup OrbitControls for interactivity
      controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.65;
    controls.target.set(0, 0, 0);
    controls.autoRotateSpeed = 0.5;
    }
    // Ensure camera looks at origin
    camera.lookAt(0, 0, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    // Track resources for cleanup
    const meshes = [];
    let geometry = null;
    let material = null;
    let points = null;
    let labels = [];
    let coordinates = [];
    let hoveredIndex = null;
    let searchedIndex = null;
    const defaultColor = new THREE.Color(DEFAULT_POINT_COLOR);
    const highlightColor = new THREE.Color(0xffff00);
    const searchColor = new THREE.Color(0xff00ff); // Magenta for searched word
    let highlightSphere = null;
    let searchSphere = null;
    let loadedDataset = null;
    let morph = null;
    let lastInput = performance.now();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const explorationLayer = createExplorationLayer(scene, camera, container, (word) => callbacksRef.current.onPick?.(word));
    let clusters = null; // Array of cluster IDs (pre-computed from JSON)
    let edgesData = null; // Array of edge indices per point (pre-computed from JSON)
    let clusterEdges = null;
    let raf = 0; // render loop handle; 0 = not running
    let isDragging = false;
    let cameraAnimRaf = 0;
    let finishCameraAnimation = null;
    let contextLost = false;
    let restoreTimer = 0;

    // Raycaster + mouse for hover picking
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.05 };
    const mouse = new THREE.Vector2();

    // Tooltip element
    const tooltip = document.createElement("div");
    tooltip.dataset.wordTooltip = "true";
    tooltip.setAttribute("aria-hidden", "true"); // details are exposed as text in the page panel
    tooltip.style.position = "absolute";
    tooltip.style.pointerEvents = "none";
    Object.assign(tooltip.style, {
      padding: "2px 3px", color: "#fff", font: "650 15px/1.25 system-ui, sans-serif", letterSpacing: "0.01em",
      WebkitTextStroke: "2px #05070d", paintOrder: "stroke fill", textShadow: "0 2px 5px #000", whiteSpace: "nowrap", zIndex: "20", display: "none",
    });
    container.style.position = "relative";
    container.appendChild(tooltip);
    
    const tooltipName = document.createElement("div");
    tooltipName.style.letterSpacing = "0.005em";
    tooltipName.style.marginBottom = "1px";
    tooltip.appendChild(tooltipName);
    
    const tooltipCoords = document.createElement("div");
    tooltipCoords.style.display = "none";
    tooltipCoords.style.fontSize = "10.5px";
    tooltipCoords.style.color = "rgba(255,255,255,0.5)";
    tooltipCoords.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, monospace";
    tooltipCoords.style.fontVariantNumeric = "tabular-nums";
    tooltip.appendChild(tooltipCoords);

    // While the tooltip belongs to the selected point it is clickable and clears the selection;
    // a plain hover tooltip stays inert so it never eats a drag.
    const setTooltipInteractive = (interactive) => {
      tooltip.style.pointerEvents = interactive ? "auto" : "none";
      tooltip.style.cursor = interactive ? "pointer" : "default";
    };
    const onTooltipClick = () => callbacksRef.current.onPick?.("");
    tooltip.addEventListener("click", onTooltipClick);

    const setSelectedTooltipColor = () => {
      setTooltipInteractive(true);
    };

    // Show the tooltip 10px below-right of (x, y) in container pixels, kept inside the container.
    const placeTooltip = (x, y) => {
      if (tooltip.style.pointerEvents === "auto") { tooltip.style.display = "none"; return; }
      tooltip.style.display = "block";
      const maxLeft = container.clientWidth - tooltip.offsetWidth - 4;
      const maxTop = container.clientHeight - tooltip.offsetHeight - 4;
      tooltip.style.left = `${Math.max(4, Math.min(x + 10, maxLeft))}px`;
      tooltip.style.top = `${Math.max(4, Math.min(y + 10, maxTop))}px`;
    };

    // --- Touch handling for mobile: tap to identify point ---
    let touchStartX = 0;
    let touchStartY = 0;
    let touchMoved = false;

    const getNormalizedFromClient = (clientX, clientY) => {
      const pickRect = renderer.domElement.getBoundingClientRect();
      const x = ((clientX - pickRect.left) / pickRect.width) * 2 - 1;
      const y = -((clientY - pickRect.top) / pickRect.height) * 2 + 1;
      return { x, y };
    };

    const pickAt = (clientX, clientY) => {
      if (!points || labels.length === 0 || !geometry) return null;
      const ndc = getNormalizedFromClient(clientX, clientY);
      mouse.set(ndc.x, ndc.y);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(points, false);
      if (intersects.length === 0 || typeof intersects[0].index !== 'number') return null;
      return intersects[0].index;
    };

    const onTouchStart = (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchMoved = false;
    };

    const onTouchMove = (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (dx * dx + dy * dy > 64) {
        // movement > 8px ⇒ treat as orbit gesture
        touchMoved = true;
      }
    };

    const onTouchEnd = (e) => {
      // If it was a drag, don't treat as tap
      if (touchMoved) return;
      const t = (e.changedTouches && e.changedTouches[0]) || null;
      if (!t) return;

      const idx = pickAt(t.clientX, t.clientY);
      if (idx === null) return;
      const label = labels[idx];
      const coord = coordinates[idx];
      if (label === selectedWordRef.current) {
        callbacksRef.current.onPick?.(""); // tapping the selected point again clears it
        return;
      }

      // Show tooltip near the tapped point by projecting to screen
      if (label && coord) {
        const world = new THREE.Vector3(coord.x, coord.y, coord.z).addScalar(0.1);
        const projected = world.clone().project(camera);
        const rect = container.getBoundingClientRect();
        const sx = (projected.x * 0.5 + 0.5) * rect.width;
        const sy = (-projected.y * 0.5 + 0.5) * rect.height;

        tooltipName.textContent = label;
        tooltipCoords.textContent = `${coord.x.toFixed(3)}   ${coord.y.toFixed(3)}   ${coord.z.toFixed(3)}`;
        setSelectedTooltipColor(idx);
        placeTooltip(sx, sy);

        // Add or move a persistent search sphere at the tapped point
        if (searchSphere) {
          scene.remove(searchSphere);
          searchSphere.geometry.dispose();
          searchSphere.material.dispose();
          searchSphere = null;
        }
        const sphereGeometry = new THREE.SphereGeometry(0.035, 16, 16);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.7 });
        searchSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        searchSphere.position.set(coord.x, coord.y, coord.z);
        scene.add(searchSphere);

        // Remember selected index so hover won't fight tooltip
        searchedIndex = idx;
        callbacksRef.current.onPick?.(label);
      }
    };

    // Remove the drawn dataset (points + edges) so a reload never stacks scenes.
    function clearDataset() {
      removeClusterEdges();
      morph = null;
      explorationLayer.setHidden(false);
      if (points) {
        scene.remove(points);
        const idx = meshes.indexOf(points);
        if (idx > -1) meshes.splice(idx, 1);
        points = null;
          }
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      geometry = null;
      material = null;
          }
          
    // --- Load and plot embeddings ---
    // Only the most recent load of this mounted scene may publish anything.
    let loadSeq = 0;
    let loadAbort = null;
    async function loadEmbeddings() {
      const id = ++loadSeq;
      loadAbort?.abort();
      const abort = new AbortController();
      loadAbort = abort;
      const current = () => !disposed && id === loadSeq;
      emitData({ state: "loading" });
          
      try {
        const fetchUrl = datasetUrl(embeddingModel, wordCount, methodRef.current);
        let res;
        try {
          res = await fetch(fetchUrl, { signal: abort.signal });
        } catch (error) {
          if (error?.name === "AbortError") return;
          throw new DatasetError("network", "Couldn't reach the dataset. Check your connection and try again.");
        }
        if (!current()) return;
        if (!res.ok) throw new DatasetError("http", "This dataset isn't available right now. Try again.");
        const url = res.url || fetchUrl;
          const contentType = res.headers.get("content-type") || "";
      
          let data;
        try {
          // Check URL extension first (most reliable)
          if (url.endsWith(".gz") || url.includes(".gz?") || fetchUrl.endsWith(".gz")) {
            // Handle .gz (gzip compressed)
            const buf = await res.arrayBuffer();
            if (!current()) return;
            const text = ungzip(new Uint8Array(buf), { to: "string" });
            data = JSON.parse(text);
          }
          // Handle .zip (check for actual zip content-type or .zip extension)
          else if (url.endsWith(".zip") || contentType.includes("application/zip")) {
            const blob = await res.blob();
            const zip = await JSZip.loadAsync(blob);
            const file = zip.file("glove_3d_1k.json");
            if (!file) throw new Error("JSON not found in ZIP");
            const text = await file.async("string");
            data = JSON.parse(text);
          }
      // Handle plain JSON
          else {
            data = await res.json();
          }
        } catch (error) {
          if (error?.name === "AbortError") return;
          throw new DatasetError("decode", "The dataset download was incomplete. Try again.");
          }
        if (!current()) return;
          
        // Validate everything before touching the scene: a bad file is rejected as a whole.
        const dataset = parseDataset(data, Number(wordCount));
          
        const previous = loadedDataset && geometry && !reducedMotion.matches ? loadedDataset : null;
        clearDataset();
        loadedDataset = dataset;
        labels = dataset.words;
        clusters = dataset.clusters;
        edgesData = dataset.edges;
        const positions = dataset.positions;
        const n = labels.length;
        coordinates = new Array(n);
        for (let i = 0; i < n; i++) {
            const i3 = i * 3;
          coordinates[i] = { x: positions[i3], y: positions[i3 + 1], z: positions[i3 + 2] };
          }
        hoveredIndex = null;
        searchedIndex = null;
          
        if (renderer) {
          const colors = new Float32Array(n * 3);
          for (let i = 0; i < n; i++) {
            colors[i * 3] = defaultColor.r;
            colors[i * 3 + 1] = defaultColor.g;
            colors[i * 3 + 2] = defaultColor.b;
          }
          // Create BufferGeometry for efficient point rendering (positions are already centred)
          geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
          if (previous) {
            const oldIndex = new Map(previous.words.map((word, index) => [word, index]));
            const start = positions.slice();
            labels.forEach((word, index) => {
              const old = oldIndex.get(word);
              if (old !== undefined) start.set(previous.positions.subarray(old * 3, old * 3 + 3), index * 3);
            });
            geometry.getAttribute("position").array.set(start);
            morph = { start, end: positions, startTime: performance.now() };
            explorationLayer.setHidden(true);
          }
          geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          
          // PointsMaterial for efficient point rendering with vertex colors
          material = addDrift(new THREE.PointsMaterial({
            size: 0.05,
            sizeAttenuation: true,
            depthWrite: false,
            vertexColors: true,
          }));
          
      points = new THREE.Points(geometry, material);
      scene.add(points);
      meshes.push(points);
      
          // Apply current display options (read from refs: they may have changed while loading)
          if (useClusterColorsRef.current) updateClusterColors();
          if (showClusterEdgesRef.current) createClusterEdges();
          
          // A selection kept across a dataset change is re-highlighted without moving the camera.
          if (selectedWordRef.current) searchForWord(selectedWordRef.current, false);
          }

        applyExploration();
        emitData({ state: "ready", dataset });
        } catch (error) {
        if (!current()) return;
          console.error("Error loading embeddings:", error);
        // The page shows a translated message for each kind; the English text stays on the error for the console.
        emitData({ state: "error", kind: error instanceof DatasetError ? error.kind : "invalid" });
        }
      }

    // Clusters are now pre-computed and loaded from JSON - no computation needed

    // Color palette for clusters (defined outside so it's accessible everywhere)
    const clusterColors = CLUSTER_COLORS.map((color) => new THREE.Color(color));

    // Update colors based on clusters
    function updateClusterColors() {
      if (!geometry || !clusters || labels.length === 0) return;
      
      const colorAttr = geometry.getAttribute("color");
      if (!colorAttr) return;
      
      for (let i = 0; i < labels.length; i++) {
        const i3 = i * 3;
        const clusterId = clusters[i];
        // Handle negative cluster IDs (e.g., -1 for noise points in DBSCAN)
        // Use default color for noise points, or map to a valid cluster color
        let color;
        if (clusterId < 0) {
          color = defaultColor; // Use default color for noise points
        } else {
          color = clusterColors[clusterId % clusterColors.length];
        }
        
        const intensity = explorationLayer.intensity(i);
        colorAttr.array[i3] = color.r * intensity;
        colorAttr.array[i3 + 1] = color.g * intensity;
        colorAttr.array[i3 + 2] = color.b * intensity;
      }
      
      colorAttr.needsUpdate = true;
    }

    // Reset all colors to default
    function resetColors() {
      if (!geometry || labels.length === 0) return;
      
      const colorAttr = geometry.getAttribute("color");
      if (!colorAttr) return;
      
      for (let i = 0; i < labels.length; i++) {
        const i3 = i * 3;
        const intensity = explorationLayer.intensity(i);
        colorAttr.array[i3] = defaultColor.r * intensity;
        colorAttr.array[i3 + 1] = defaultColor.g * intensity;
        colorAttr.array[i3 + 2] = defaultColor.b * intensity;
      }
      
      colorAttr.needsUpdate = true;
    }

    // Create edges using pre-computed edge data from JSON
    function createClusterEdges() {
      // Remove existing edges
      removeClusterEdges();
      
      if (!renderer || !edgesData || !coordinates || coordinates.length === 0 || !clusters) return;
      
      const edgeGeometry = new THREE.BufferGeometry();
      const edgePositions = [];
      const edgeColors = [];
      
      // Use pre-computed edges from JSON
      for (let i = 0; i < edgesData.length; i++) {
        const edgeIndices = edgesData[i];
        if (!edgeIndices || edgeIndices.length === 0) continue;
        
        const pos1 = coordinates[i];
        const clusterId = clusters[i];
        // Handle negative cluster IDs (e.g., -1 for noise points)
        let color;
        if (clusterId < 0) {
          color = defaultColor; // Use default color for noise points
        } else {
          color = clusterColors[clusterId % clusterColors.length];
        }
        
        // Create edges to all connected points
        for (const targetIdx of edgeIndices) {
          // Existing rule, kept as-is: draw a stored link only when targetIdx > i. Stored links are
          // directed, so a link listed only by the later row is not drawn.
          if (targetIdx > i && targetIdx < coordinates.length) {
            const pos2 = coordinates[targetIdx];
            
            // Add edge from pos1 to pos2
            edgePositions.push(pos1.x, pos1.y, pos1.z);
            edgePositions.push(pos2.x, pos2.y, pos2.z);
            
            // Add colors for both vertices (use color of source point's cluster)
            edgeColors.push(color.r, color.g, color.b);
            edgeColors.push(color.r, color.g, color.b);
          }
        }
      }
      
      if (edgePositions.length > 0) {
        edgeGeometry.setAttribute('position', new THREE.Float32BufferAttribute(edgePositions, 3));
        edgeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(edgeColors, 3));
        
        const edgeMaterial = addDrift(new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.3,
          linewidth: 1
        }));
        
        clusterEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        clusterEdges.visible = !morph;
        scene.add(clusterEdges);
        meshes.push(clusterEdges);
      }
    }

    // Remove cluster edges
    function removeClusterEdges() {
      if (clusterEdges) {
        scene.remove(clusterEdges);
        if (clusterEdges.geometry) clusterEdges.geometry.dispose();
        if (clusterEdges.material) clusterEdges.material.dispose();
        // Remove from meshes array
        const idx = meshes.indexOf(clusterEdges);
        if (idx > -1) meshes.splice(idx, 1);
        clusterEdges = null;
      }
    }

    // Search for a word and highlight it. `fly` = animate the camera to it (search), false = highlight only.
    function searchForWord(word, fly = true, framing = null) {
      if (!word || !labels.length || !geometry) {
        // Clear search
        if (searchedIndex !== null) {
          const restoreColor = getPointColor(searchedIndex);
          updatePointColor(searchedIndex, restoreColor);
          if (searchSphere) {
            scene.remove(searchSphere);
            searchSphere.geometry.dispose();
            searchSphere.material.dispose();
            searchSphere = null;
          }
          searchedIndex = null;
          // Hide tooltip
          tooltip.style.display = "none";
        }
        return;
      }
      
      // Exact listed token: case variants (e.g. "The" / "the") are different words.
      const foundIndex = labels.indexOf(word);
      
      if (foundIndex === -1) {
        return;
      }
      
      // Get the label and coordinates for the found word
      const label = labels[foundIndex];
      const pos = coordinates[foundIndex];
      
      // Remove previous search highlight
      if (searchedIndex !== null && searchedIndex !== foundIndex) {
        const prevColor = getPointColor(searchedIndex);
        updatePointColor(searchedIndex, prevColor);
        if (searchSphere) {
          scene.remove(searchSphere);
          searchSphere.geometry.dispose();
          searchSphere.material.dispose();
          searchSphere = null;
        }
      }
      
      // Highlight found word
      searchedIndex = foundIndex;
      updatePointColor(foundIndex, searchColor);
      
      // Add search sphere
      if (searchSphere) {
        scene.remove(searchSphere);
        searchSphere.geometry.dispose();
        searchSphere.material.dispose();
      }
      
      const sphereGeometry = new THREE.SphereGeometry(0.04, 16, 16);
      const sphereMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff00ff,
        transparent: true,
        opacity: 0.7
      });
      searchSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
      const worldPos = new THREE.Vector3(pos.x, pos.y, pos.z);
      searchSphere.position.copy(worldPos);
      scene.add(searchSphere);
      
      // Show tooltip immediately and update it continuously
      const showSearchTooltip = () => {
        // Convert 3D position to 2D screen coordinates
        worldPos.project(camera);
        const rect = container.getBoundingClientRect();
        const x = (worldPos.x * 0.5 + 0.5) * rect.width;
        const y = (worldPos.y * -0.5 + 0.5) * rect.height;
        
        // Update tooltip content
        tooltipName.textContent = label;
        setSelectedTooltipColor(foundIndex);
        if (pos) {
          tooltipCoords.textContent = `${pos.x.toFixed(3)}   ${pos.y.toFixed(3)}   ${pos.z.toFixed(3)}`;
        } else {
          tooltipCoords.textContent = "";
        }
        
        // Position tooltip - show if point is visible on screen
        if (worldPos.z < 1 && x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          placeTooltip(x, y);
        } else {
          // Still show tooltip but position it in center if off-screen
          placeTooltip(rect.width / 2, rect.height / 2);
        }
      };
      
      // Show tooltip immediately
      showSearchTooltip();
      
      if (!fly) return;

      animateCameraTo(framing?.center ?? new THREE.Vector3(pos.x, pos.y, pos.z), framing?.distance ?? 1.5);
    }

    function animateCameraTo(targetPos, distance) {
      const direction = new THREE.Vector3()
        .subVectors(camera.position, targetPos)
        .normalize()
        .multiplyScalar(distance);
      const newCamPos = new THREE.Vector3().addVectors(targetPos, direction);
      
      // Smooth camera animation
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const target = targetPos.clone();
      
      cancelAnimationFrame(cameraAnimRaf);
      finishCameraAnimation = () => {
        cancelAnimationFrame(cameraAnimRaf);
        cameraAnimRaf = 0;
        camera.position.copy(newCamPos);
        controls.target.copy(target);
        controls.update();
        finishCameraAnimation = null;
      };

      // Reduced motion (or a lost context): same final camera pose, no interpolation.
      if (contextLost || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        finishCameraAnimation();
        return;
      }

      let progress = 0;
      const duration = 1000; // ms
      const startTime = Date.now();
      
      function animateCamera() {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const ease = 1 - Math.pow(1 - progress, 3);
        
        camera.position.lerpVectors(startPos, newCamPos, ease);
        controls.target.lerpVectors(startTarget, target, ease);
        controls.update();
        
        if (progress < 1) {
          cameraAnimRaf = requestAnimationFrame(animateCamera);
        } else {
          cameraAnimRaf = 0;
          finishCameraAnimation = null;
        }
      }
      
      animateCamera();
    }

    function applyExploration() {
      if (!loadedDataset) return;
      explorationLayer.refresh(loadedDataset, explorationRef.current, selectedWordRef.current);
      if (useClusterColorsRef.current) updateClusterColors();
      else resetColors();
      if (searchedIndex !== null) updatePointColor(searchedIndex, searchColor);
      if (clusterEdges) clusterEdges.material.opacity = explorationLayer.active() ? 0.045 : 0.3;
    }
    canvasFunctionsRef.current.applyExploration = applyExploration;
    canvasFunctionsRef.current.frameSelection = (word) => {
      if (!loadedDataset || !renderer) return;
      const options = explorationRef.current;
      const network = exploreNetwork(labels, edgesData, word, options.pins, options.focus);
      if (!network.roots.length) { searchForWord(word, true); return; }
      const box = new THREE.Box3();
      for (const index of network.active) box.expandByPoint(new THREE.Vector3().fromArray(loadedDataset.positions, index * 3));
      const sphere = box.getBoundingSphere(new THREE.Sphere());
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const distance = Math.max(0.85, sphere.radius / Math.sin(Math.min(halfFov, Math.atan(Math.tan(halfFov) * camera.aspect))) * 1.8);
      // Leave room below the group for the expanded tray.
      sphere.center.addScaledVector(new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion), -distance * 0.28);
      searchForWord(word, true, { center: sphere.center, distance });
    };

    canvasFunctionsRef.current.frameCluster = (id) => {
      if (!loadedDataset || !renderer) return;
      const indices = [];
      const center = new THREE.Vector3();
      for (let i = 0; i < clusters.length; i++) {
        if (clusters[i] !== id) continue;
        indices.push(i);
        center.add(new THREE.Vector3().fromArray(loadedDataset.positions, i * 3));
      }
      if (!indices.length) return;
      center.divideScalar(indices.length);
      const distances = indices.map((i) => center.distanceTo(new THREE.Vector3().fromArray(loadedDataset.positions, i * 3))).sort((a, b) => a - b);
      const radius = distances[Math.floor((distances.length - 1) * 0.9)];
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const fitDistance = radius / Math.sin(Math.min(halfFov, Math.atan(Math.tan(halfFov) * camera.aspect))) * 1.4;
      const currentDistance = camera.position.distanceTo(controls.target);
      const distance = Math.max(0.85, Math.min(fitDistance, currentDistance * 0.78));
      animateCameraTo(center, distance);
    };

    // Expose functions to parent component via ref (with current prop values)
    canvasFunctionsRef.current._internalSearchForWord = searchForWord;
    canvasFunctionsRef.current.searchForWord = (word, fly = true) => searchForWord(word, fly);
    canvasFunctionsRef.current.updateClusterColors = updateClusterColors;
    canvasFunctionsRef.current.resetColors = resetColors;
    canvasFunctionsRef.current.clusters = () => clusters;
    canvasFunctionsRef.current.createClusterEdges = createClusterEdges;
    canvasFunctionsRef.current.removeClusterEdges = removeClusterEdges;
    // Same-dataset retry: reload data into this scene, keeping camera and selection.
    canvasFunctionsRef.current.retry = () => loadEmbeddings();
    canvasFunctionsRef.current.reload = () => loadEmbeddings();
    canvasFunctionsRef.current.glideTo = (word) => {
      const index = labels.indexOf(word);
      if (index < 0 || !renderer) return;
      lastInput = performance.now();
      const { x, y, z } = coordinates[index];
      animateCameraTo(new THREE.Vector3(x, y, z), Math.min(camera.position.distanceTo(controls.target), 2));
    };

    loadEmbeddings();
      
    const updatePointColor = (index, color) => {
      if (!geometry || index === null || index < 0 || !color) return;
      const colorAttr = geometry.getAttribute("color");
      if (!colorAttr) return;

      // Ensure color is a THREE.Color object
      if (!(color instanceof THREE.Color)) {
        console.warn("updatePointColor: color is not a THREE.Color", color);
        return;
      }
      
      const i3 = index * 3;
      colorAttr.array[i3] = color.r;
      colorAttr.array[i3 + 1] = color.g;
      colorAttr.array[i3 + 2] = color.b;
      colorAttr.needsUpdate = true;
    };

    // Helper function to get the correct color for a point based on cluster
    const getPointColor = (index) => {
      if (!clusters || index < 0 || index >= clusters.length) {
        return defaultColor;
      }
      const clusterId = clusters[index];
      if (clusterId < 0 || !useClusterColorsRef.current) {
        return defaultColor.clone().multiplyScalar(explorationLayer.intensity(index));
      }
      return clusterColors[clusterId % clusterColors.length].clone().multiplyScalar(explorationLayer.intensity(index));
    };

    // Without a renderer there is nothing to draw or pick; data and text details still load above.
    if (!renderer) {
      return () => {
        disposed = true;
        loadAbort?.abort();
        explorationLayer.dispose();
        if (tooltip.parentElement === container) container.removeChild(tooltip);
      };
    }

    // --- Animate ---
    const animate = () => {
      const now = performance.now();
      const moving = motionRef.current && !reducedMotion.matches;
      controls.autoRotate = moving && !cameraAnimRaf && !isDragging && now - lastInput > 5000;
      drift.uTime.value = now / 1000;
      drift.uDrift.value = moving ? 0.006 : 0;
      const distance = camera.position.distanceTo(controls.target);
      scene.fog.near = distance * 0.7;
      scene.fog.far = distance * 2.6;
      if (morph && geometry) {
        const t = Math.min(1, (now - morph.startTime) / 1100);
        const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const attr = geometry.getAttribute("position");
        for (let i = 0; i < attr.array.length; i++) attr.array[i] = morph.start[i] + (morph.end[i] - morph.start[i]) * ease;
        attr.needsUpdate = true;
        if (t === 1) {
          morph = null;
          geometry.computeBoundingSphere();
          if (clusterEdges) clusterEdges.visible = true;
          explorationLayer.setHidden(false);
        }
      }
      explorationLayer.hover(morph ? null : hoveredIndex);
      if (searchSphere) searchSphere.visible = !morph;
      controls.update();
      if (material) material.size = 0.05 * Math.min(1, Math.max(0.15, camera.position.distanceTo(controls.target) / 3));
      explorationLayer.frame(performance.now());
      renderer.render(scene, camera);
      
      // Update tooltip position for searched word if active
      if (searchedIndex !== null && searchSphere) {
        const pos = coordinates[searchedIndex];
        const worldPos = new THREE.Vector3(pos.x+0.1, pos.y+0.1, pos.z+0.1);
        worldPos.project(camera);
        
        // Only show tooltip if point is in front of camera
        if (worldPos.z < 1) {
          const rect = container.getBoundingClientRect();
          const x = (worldPos.x * 0.5 + 0.5) * rect.width;
          const y = (worldPos.y * -0.5 + 0.5) * rect.height;
          
          // Only update if coordinates are within reasonable bounds
          if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
            // Ensure tooltip is visible for searched word
            if (tooltip.style.display !== "block") {
              const label = labels[searchedIndex];
              const coord = coordinates[searchedIndex];
              tooltipName.textContent = label;
              setSelectedTooltipColor(searchedIndex);
              if (coord) {
                tooltipCoords.textContent = `${coord.x.toFixed(3)}   ${coord.y.toFixed(3)}   ${coord.z.toFixed(3)}`;
              }
            }
            placeTooltip(x, y);
          } else {
            // Point is off-screen, but keep tooltip ready
            tooltip.style.display = "none";
          }
        } else {
          // Point is behind camera
          tooltip.style.display = "none";
        }
      }
      
      raf = requestAnimationFrame(animate);
    };
    const startLoop = () => { if (!raf) raf = requestAnimationFrame(animate); };
    const stopLoop = () => { cancelAnimationFrame(raf); raf = 0; };
    startLoop();
      
    // --- WebGL context loss / restoration ---
    // three.js calls preventDefault on loss (allowing restoration) and rebuilds its GL state on restore.
    const onContextLost = () => {
      contextLost = true;
      stopLoop();
      finishCameraAnimation?.(); // stop the fly-to; keep its final pose for when drawing resumes
      emitGraphics("lost");
      clearTimeout(restoreTimer);
      restoreTimer = setTimeout(() => { if (contextLost) emitGraphics("stalled"); }, CONTEXT_RESTORE_WAIT_MS);
    };
    const onContextRestored = () => {
      clearTimeout(restoreTimer);
      contextLost = false;
      // Verify the context itself recovered. A healthy frame may draw zero points when
      // the user has panned the cloud outside the camera frustum.
      let recovered = false;
      try {
        renderer.render(scene, camera);
        recovered = !renderer.getContext().isContextLost();
      } catch (error) {
        console.error("WebGL restore failed:", error);
      }
      if (!recovered) {
        emitGraphics("stalled");
        return;
      }
      emitGraphics("ok");
      startLoop();
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);
    renderer.domElement.addEventListener("webglcontextrestored", onContextRestored);
    
    // Attach touch listeners for tap-to-identify
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
    renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true });

    // --- Pointer events for hover ---
    let downX = 0;
    let downY = 0;
    const onPointerDown = (event) => { isDragging = true; lastInput = performance.now(); downX = event.clientX; downY = event.clientY; };
    const onWheel = () => { lastInput = performance.now(); };
    const onTouchInput = () => { lastInput = performance.now(); };
    const onDoubleClick = (event) => {
      const idx = pickAt(event.clientX, event.clientY);
      if (idx === null) return;
      callbacksRef.current.onPick?.(labels[idx]);
      flownWordRef.current = labels[idx];
      const { x, y, z } = coordinates[idx];
      lastInput = performance.now();
      animateCameraTo(new THREE.Vector3(x, y, z), Math.max(0.8, camera.position.distanceTo(controls.target) * 0.6));
    };
    renderer.domElement.addEventListener("wheel", onWheel, { passive: true });
    renderer.domElement.addEventListener("touchstart", onTouchInput, { passive: true });
    renderer.domElement.addEventListener("dblclick", onDoubleClick);
    const onPointerUp = (event) => {
      isDragging = false;
      // A mouse/pen click without drag reports the word to the page (details only; no camera move).
      if (event.pointerType !== "touch" && Math.hypot(event.clientX - downX, event.clientY - downY) < 4) {
        const idx = pickAt(event.clientX, event.clientY);
        // clicking the selected point again clears it
        if (idx !== null) callbacksRef.current.onPick?.(labels[idx] === selectedWordRef.current ? "" : labels[idx]);
      }
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const onPointerMove = (event) => {
      if (isDragging) {
        tooltip.style.display = "none";
        // Reset previous hover
        if (hoveredIndex !== null && geometry) {
          updatePointColor(hoveredIndex, getPointColor(hoveredIndex));
          if (highlightSphere) {
            scene.remove(highlightSphere);
            highlightSphere.geometry.dispose();
            highlightSphere.material.dispose();
            highlightSphere = null;
          }
          hoveredIndex = null;
        }
        return;
      }

      // Use canvas rect for precise raycasting coordinates
      const pickRect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - pickRect.left) / pickRect.width) * 2 - 1;
      const y = -((event.clientY - pickRect.top) / pickRect.height) * 2 + 1;
      mouse.set(x, y);

      if (!points || labels.length === 0 || !geometry) {
        tooltip.style.display = "none";
        return;
      }

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(points, false);

      if (intersects.length > 0 && typeof intersects[0].index === 'number') {
        const idx = intersects[0].index;
        const label = labels[idx];
        const coord = coordinates[idx];
        
        if (label) {
          // If a search is active, don't update tooltip on hover - keep search tooltip visible
          if (searchedIndex !== null) {
            // Only allow hover highlighting if not hovering over the searched word
            if (idx !== searchedIndex) {
              // Reset previous hover if different
              if (hoveredIndex !== null && hoveredIndex !== idx) {
                const restoreColor = getPointColor(hoveredIndex);
                updatePointColor(hoveredIndex, restoreColor);
                if (highlightSphere) {
                  scene.remove(highlightSphere);
                  highlightSphere.geometry.dispose();
                  highlightSphere.material.dispose();
                  highlightSphere = null;
                }
              }
              
              // Highlight new hover (but don't update tooltip)
              if (hoveredIndex !== idx) {
                updatePointColor(idx, highlightColor);
                
                // Remove previous sphere if exists
                if (highlightSphere) {
                  scene.remove(highlightSphere);
                  highlightSphere.geometry.dispose();
                  highlightSphere.material.dispose();
                }
                
                // Add highlight sphere at hovered point position
                const sphereGeometry = new THREE.SphereGeometry(0.03, 16, 16);
                const sphereMaterial = new THREE.MeshBasicMaterial({ 
                  color: 0xffff00,
                  transparent: true,
                  opacity: 0.6
                });
                highlightSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                const pos = coordinates[idx];
                highlightSphere.position.set(pos.x, pos.y, pos.z);
                scene.add(highlightSphere);
                
                hoveredIndex = idx;
              }
            } else {
              // Hovering over searched word - remove hover highlight if exists
              if (hoveredIndex !== null && hoveredIndex !== searchedIndex) {
                const restoreColor = getPointColor(hoveredIndex);
                updatePointColor(hoveredIndex, restoreColor);
                if (highlightSphere) {
                  scene.remove(highlightSphere);
                  highlightSphere.geometry.dispose();
                  highlightSphere.material.dispose();
                  highlightSphere = null;
                }
                hoveredIndex = null;
              }
            }
            container.style.cursor = "pointer";
            // Don't update tooltip - keep search tooltip visible
            return;
          }
          
          // No search active - normal hover behavior
          // Reset previous hover if different
          if (hoveredIndex !== null && hoveredIndex !== idx) {
            const restoreColor = getPointColor(hoveredIndex);
            updatePointColor(hoveredIndex, restoreColor);
            if (highlightSphere) {
              scene.remove(highlightSphere);
              highlightSphere.geometry.dispose();
              highlightSphere.material.dispose();
              highlightSphere = null;
            }
          }
          
          // Highlight new hover
          if (hoveredIndex !== idx) {
            updatePointColor(idx, highlightColor);
            
            // Remove previous sphere if exists
            if (highlightSphere) {
              scene.remove(highlightSphere);
              highlightSphere.geometry.dispose();
              highlightSphere.material.dispose();
            }
            
            // Add highlight sphere at hovered point position
            const sphereGeometry = new THREE.SphereGeometry(0.03, 16, 16);
            const sphereMaterial = new THREE.MeshBasicMaterial({ 
              color: 0xffff00,
              transparent: true,
              opacity: 0.6
            });
            highlightSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
            const pos = coordinates[idx];
            highlightSphere.position.set(pos.x, pos.y, pos.z);
            scene.add(highlightSphere);
            
            hoveredIndex = idx;
          }
          
          // Update tooltip
          tooltipName.textContent = label;
          if (coord) {
            tooltipCoords.textContent = `${coord.x.toFixed(3)}   ${coord.y.toFixed(3)}   ${coord.z.toFixed(3)}`;
          } else {
            tooltipCoords.textContent = "";
          }
          
          // Tooltip relative to container for consistent positioning
          setTooltipInteractive(false);
          const tipRect = container.getBoundingClientRect();
          placeTooltip(event.clientX - tipRect.left, event.clientY - tipRect.top);
          container.style.cursor = "pointer";
        }
      } else {
        // Reset hover
        if (hoveredIndex !== null) {
          const restoreColor = getPointColor(hoveredIndex);
          updatePointColor(hoveredIndex, restoreColor);
          if (highlightSphere) {
            scene.remove(highlightSphere);
            highlightSphere.geometry.dispose();
            highlightSphere.material.dispose();
            highlightSphere = null;
          }
          hoveredIndex = null;
        }
        // Only hide tooltip if no search is active
        if (searchedIndex === null) {
          tooltip.style.display = "none";
        }
        container.style.cursor = "default";
      }
    };

    const onPointerLeave = () => {
      // Reset hover on leave
      if (hoveredIndex !== null && geometry) {
        const restoreColor = getPointColor(hoveredIndex);
        updatePointColor(hoveredIndex, restoreColor);
        if (highlightSphere) {
          scene.remove(highlightSphere);
          highlightSphere.geometry.dispose();
          highlightSphere.material.dispose();
          highlightSphere = null;
        }
        hoveredIndex = null;
      }
      // Only hide tooltip if no search is active
      if (searchedIndex === null) {
        tooltip.style.display = "none";
      }
      container.style.cursor = "default";
    };

    // A cancelled pointer (e.g. touch taken over by scrolling or a system gesture) ends the drag and the hover.
    const onPointerCancel = () => {
      isDragging = false;
      onPointerLeave();
    };

    // Add event listeners to the renderer canvas, not container
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);
    renderer.domElement.addEventListener("pointercancel", onPointerCancel);

    // --- Resize handling ---
    const handleResize = () => {
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      // Ensure canvas stays properly styled after resize
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    // --- Cleanup ---
    return () => {
      disposed = true;
      loadAbort?.abort();
      clearTimeout(restoreTimer);
      ro.disconnect();
      stopLoop();
      cancelAnimationFrame(cameraAnimRaf);
      renderer.setAnimationLoop(null);
      renderer.renderLists?.dispose();

      explorationLayer.dispose();

      // Dispose controls
      controls.dispose();

      // Dispose all meshes
      meshes.forEach((mesh) => {
        scene.remove(mesh);
        if (mesh.geometry) mesh.geometry = null;
        if (mesh.material) mesh.material = null;
      });

      // Dispose highlight sphere
      if (highlightSphere) {
        scene.remove(highlightSphere);
        highlightSphere.geometry.dispose();
        highlightSphere.material.dispose();
      }

      // Dispose search sphere
      if (searchSphere) {
        scene.remove(searchSphere);
        searchSphere.geometry.dispose();
        searchSphere.material.dispose();
      }

      // Dispose cluster edges
      removeClusterEdges();

      // Dispose shared geometry and material
      if (geometry) geometry.dispose();
      if (material) material.dispose();

      tooltip.removeEventListener("click", onTooltipClick);
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      renderer.domElement.removeEventListener("webglcontextrestored", onContextRestored);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("wheel", onWheel);
      renderer.domElement.removeEventListener("touchstart", onTouchInput);
      renderer.domElement.removeEventListener("dblclick", onDoubleClick);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      renderer.domElement.removeEventListener("pointercancel", onPointerCancel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      renderer.domElement.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
      const gl = renderer.getContext?.();
      gl?.getExtension?.("WEBGL_lose_context")?.loseContext?.();
      container.removeChild(renderer.domElement);
      if (tooltip && tooltip.parentElement === container) {
        container.removeChild(tooltip);
      }
    };
  }, [embeddingModel, wordCount]);

  const loadedMethodRef = useRef(reductionMethod);
  useEffect(() => {
    if (loadedMethodRef.current === reductionMethod) return;
    loadedMethodRef.current = reductionMethod;
    canvasFunctionsRef.current?.reload?.();
  }, [reductionMethod]);

  // Update refs when props change
  useEffect(() => {
    useClusterColorsRef.current = useClusterColors;
  }, [useClusterColors]);
  useEffect(() => {
    showClusterEdgesRef.current = showClusterEdges;
  }, [showClusterEdges]);

  // Handle search word changes
  useEffect(() => {
    const searchFn = canvasFunctionsRef.current?.searchForWord;
    const word = pickedWord || searchWord;
    if (searchFn) {
      searchFn(word, false);
    }
    if (word && word !== flownWordRef.current) canvasFunctionsRef.current?.glideTo?.(word);
    flownWordRef.current = word;
  }, [pickedWord, searchWord, useClusterColors]);

  // Handle cluster color changes  
  useEffect(() => {
    const updateFn = canvasFunctionsRef.current?.updateClusterColors;
    const resetFn = canvasFunctionsRef.current?.resetColors;
    const getClusters = canvasFunctionsRef.current?.clusters;
    
    if (useClusterColors && updateFn && getClusters && getClusters()) {
      updateFn();
      // Re-apply search if active
      if (pickedWord || searchWord) {
        const searchFn = canvasFunctionsRef.current?.searchForWord;
        if (searchFn) searchFn(pickedWord || searchWord, false);
      }
    } else if (!useClusterColors && resetFn) {
      resetFn();
      // Re-apply search highlight if active
      if (pickedWord || searchWord) {
        const searchFn = canvasFunctionsRef.current?.searchForWord;
        if (searchFn) searchFn(pickedWord || searchWord, false);
      }
    }
  }, [useClusterColors, pickedWord, searchWord]);

  // Handle cluster edges changes
  useEffect(() => {
    const createFn = canvasFunctionsRef.current?.createClusterEdges;
    const removeFn = canvasFunctionsRef.current?.removeClusterEdges;
    const getClusters = canvasFunctionsRef.current?.clusters;
    
    if (showClusterEdges && createFn && getClusters && getClusters()) {
      createFn();
    } else if (!showClusterEdges && removeFn) {
      removeFn();
    }
  }, [showClusterEdges]);

  useEffect(() => {
    canvasFunctionsRef.current?.applyExploration?.();
  }, [exploration, pickedWord, searchWord, useClusterColors, showClusterEdges]);

  return <div ref={containerRef} className="w-full h-full" role="img" aria-label={ariaLabel} />;
});

export default EmbeddingCanvas;
