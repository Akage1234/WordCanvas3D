"use client";
import { useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import JSZip from "jszip";
import { ungzip } from "pako";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const EmbeddingCanvas = forwardRef(function EmbeddingCanvas({ embeddingModel = "glove_300D", wordCount = "1000", reductionMethod = "pca", searchWord = "", useClusterColors = false, showClusterEdges = false, onLoadingChange = null }, ref) {
  const containerRef = useRef(null);
  const rafRef = useRef(0);
  const canvasFunctionsRef = useRef({ searchForWord: null, updateClusterColors: null, resetColors: null, getWords: null });
  const useClusterColorsRef = useRef(useClusterColors);
  const wordsListRef = useRef([]);

  // Expose functions via ref
  useImperativeHandle(ref, () => ({
    getWords: () => canvasFunctionsRef.current?.getWords?.() || [],
    searchForWord: (word) => canvasFunctionsRef.current?.searchForWord?.(word),
  }), []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- Setup scene ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090a12); // Even darker blue-black background
    const camera = new THREE.PerspectiveCamera(
      75,
      Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
      0.1,
      1000
    );
    camera.position.z = 3;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
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

    scene.add(new THREE.AmbientLight(0xffffff, 1));

    // Setup OrbitControls for interactivity
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    // Ensure camera looks at origin
    camera.lookAt(0, 0, 0);

    // Track resources for cleanup
    const meshes = [];
    let geometry = null;
    let material = null;
    let points = null;
    let labels = [];
    let coordinates = [];
    let hoveredIndex = null;
    let searchedIndex = null;
    const defaultColor = new THREE.Color(0x00aaff);
    const highlightColor = new THREE.Color(0xffff00);
    const searchColor = new THREE.Color(0xff00ff); // Magenta for searched word
    let highlightSphere = null;
    let searchSphere = null;
    let clusters = null; // Array of cluster IDs (pre-computed from JSON)
    let edgesData = null; // Array of edge indices per point (pre-computed from JSON)
    let clusterEdges = null;

    // Raycaster + mouse for hover picking
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 0.05 };
    const mouse = new THREE.Vector2();

    // Tooltip element
    const tooltip = document.createElement("div");
    tooltip.style.position = "absolute";
    tooltip.style.pointerEvents = "none";
    tooltip.style.padding = "10px 14px";
    tooltip.style.borderRadius = "8px";
    tooltip.style.background = "rgba(0,0,0,0.9)";
    tooltip.style.color = "white";
    tooltip.style.fontSize = "13px";
    tooltip.style.fontFamily = "system-ui, sans-serif";
    tooltip.style.zIndex = "1000";
    tooltip.style.minWidth = "160px";
    tooltip.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
    tooltip.style.display = "none";
    tooltip.style.transform = "translate(10px, 10px)";
    tooltip.style.lineHeight = "1.5";
    container.style.position = "relative";
    container.appendChild(tooltip);
    
    const tooltipName = document.createElement("div");
    tooltipName.style.fontWeight = "600";
    tooltipName.style.marginBottom = "6px";
    tooltip.appendChild(tooltipName);
    
    const tooltipCoords = document.createElement("div");
    tooltipCoords.style.fontSize = "11px";
    tooltipCoords.style.color = "rgba(255,255,255,0.7)";
    tooltipCoords.style.fontFamily = "monospace";
    tooltip.appendChild(tooltipCoords);

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

      // Raycast at touch position
      const ndc = getNormalizedFromClient(t.clientX, t.clientY);
      mouse.set(ndc.x, ndc.y);
      raycaster.setFromCamera(mouse, camera);
      if (!points || labels.length === 0 || !geometry) return;
      const intersects = raycaster.intersectObject(points, false);
      if (intersects.length === 0 || typeof intersects[0].index !== 'number') return;

      const idx = intersects[0].index;
      const label = labels[idx];
      const coord = coordinates[idx];

      // Show tooltip near the tapped point by projecting to screen
      if (label && coord) {
        const world = new THREE.Vector3(coord.x, coord.y, coord.z).addScalar(0.1);
        const projected = world.clone().project(camera);
        const rect = container.getBoundingClientRect();
        const sx = (projected.x * 0.5 + 0.5) * rect.width;
        const sy = (-projected.y * 0.5 + 0.5) * rect.height;

        tooltipName.textContent = label;
        tooltipCoords.textContent = `(${coord.x.toFixed(3)}, ${coord.y.toFixed(3)}, ${coord.z.toFixed(3)})`;
        tooltip.style.left = `${sx}px`;
        tooltip.style.top = `${sy}px`;
        tooltip.style.display = 'block';

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
      }
    };

    // --- Load and plot embeddings ---
    async function loadEmbeddings() {
        try {
          // Notify parent that loading started
          if (onLoadingChange) {
            onLoadingChange(true);
          }
          
          // Build file path based on model and word count
          let fetchUrl;
          
          // Determine model type and folder name
          let modelFolder;
          let fileName;
          
          if (embeddingModel.startsWith("glove_")) {
            // GloVe models: glove_300D -> glove_300d folder, but files use uppercase D
            modelFolder = embeddingModel.toLowerCase();
            const modelNum = embeddingModel.replace("glove_", ""); // Keep original case (300D)
            // Files use uppercase D in filename: glove_300D_1000_pca_3d.json.gz or glove_300D_1000_umap_3d.json.gz
            fileName = `glove_${modelNum}_${wordCount}_${reductionMethod}_3d.json.gz`;
          } else if (embeddingModel.startsWith("fasttext_")) {
            // FastText models: fasttext_300d -> FastText_300D folder
            modelFolder = "FastText_300D";
            fileName = `FastText_300D_${wordCount}_${reductionMethod}_3d.json.gz`;
          } else if (embeddingModel.startsWith("word2vec_")) {
            // Word2Vec models: word2vec_300d -> Word2Vec_300D folder
            modelFolder = "Word2Vec_300D";
            fileName = `Word2Vec_300D_${wordCount}_${reductionMethod}_3d.json.gz`;
          } else {
            // Default fallback
            modelFolder = embeddingModel.toLowerCase();
            fileName = `${embeddingModel}_${wordCount}_${reductionMethod}_3d.json.gz`;
          }
          
          fetchUrl = `/${modelFolder}/${fileName}`;
          
          const res = await fetch(fetchUrl);
          const url = res.url || "";
          const contentType = res.headers.get("content-type") || "";
      
          let data;
      
          // Check URL extension first (most reliable)
          if (url.endsWith(".gz") || url.includes(".gz?")) {
            // Handle .gz (gzip compressed)
            const buf = await res.arrayBuffer();
            const text = ungzip(new Uint8Array(buf), { to: "string" });
            data = JSON.parse(text);
          }
          // Handle .zip (check for actual zip content-type or .zip extension)
          else if (url.endsWith(".zip") || contentType.includes("application/zip")) {
            const blob = await res.blob();
            const zip = await JSZip.loadAsync(blob);
            const file = zip.file("glove_3d_1k.json");
            if (!file) {
              console.error("JSON not found in ZIP");
              return;
            }
            const text = await file.async("string");
            data = JSON.parse(text);
          }
      // Handle plain JSON
          else {
            data = await res.json();
          }

      // Create BufferGeometry for efficient point rendering
          const positions = new Float32Array(data.length * 3);
          const colors = new Float32Array(data.length * 3);
          
          // Initialize clusters and edges arrays
          clusters = new Array(data.length);
          edgesData = new Array(data.length);
          
          for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const { x, y, z, cluster, edges } = item;
            const i3 = i * 3;
            positions[i3] = x;
            positions[i3 + 1] = y;
            positions[i3 + 2] = z;
        // Try common label fields
        labels[i] = item.word || item.token || item.label || String(i);
        coordinates[i] = { x, y, z };
            // Store cluster ID (default to 0 if not provided)
            clusters[i] = cluster !== undefined ? cluster : 0;
            // Store edges array (default to empty if not provided)
            edgesData[i] = Array.isArray(edges) ? edges : [];
            // Initialize colors to default
            colors[i3] = defaultColor.r;
            colors[i3 + 1] = defaultColor.g;
            colors[i3 + 2] = defaultColor.b;
          }
          
          // Center the data at origin
          let sumX = 0, sumY = 0, sumZ = 0;
          for (let i = 0; i < data.length; i++) {
            const i3 = i * 3;
            sumX += positions[i3];
            sumY += positions[i3 + 1];
            sumZ += positions[i3 + 2];
          }
          const centroidX = sumX / data.length;
          const centroidY = sumY / data.length;
          const centroidZ = sumZ / data.length;
          
          // Subtract centroid to center at origin
          for (let i = 0; i < data.length; i++) {
            const i3 = i * 3;
            positions[i3] -= centroidX;
            positions[i3 + 1] -= centroidY;
            positions[i3 + 2] -= centroidZ;
            
            // Update coordinates to match centered positions
            coordinates[i] = {
              x: positions[i3],
              y: positions[i3 + 1],
              z: positions[i3 + 2]
            };
          }
          
          geometry = new THREE.BufferGeometry();
          geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
          
          // PointsMaterial for efficient point rendering with vertex colors
          material = new THREE.PointsMaterial({
            size: 0.05,
            sizeAttenuation: true,
            depthWrite: false,
            vertexColors: true,
          });
          
      points = new THREE.Points(geometry, material);
      scene.add(points);
      meshes.push(points);
      
          console.log(`Loaded ${data.length} embeddings`);
          console.log("Sample labels:", labels.slice(0, 5));
          console.log("First data item:", data[0]);
          
          // Notify parent that loading completed
          if (onLoadingChange) {
            onLoadingChange(false);
          }
        } catch (error) {
          console.error("Error loading embeddings:", error);
          
          // Notify parent that loading failed
          if (onLoadingChange) {
            onLoadingChange(false);
          }
        }
      }

    // Clusters are now pre-computed and loaded from JSON - no computation needed

    // Color palette for clusters (defined outside so it's accessible everywhere)
    const clusterColors = [
      new THREE.Color(0xff6b6b), // Red
      new THREE.Color(0x4ecdc4), // Teal
      new THREE.Color(0x45b7d1), // Blue
      new THREE.Color(0xf9ca24), // Yellow
      new THREE.Color(0x6c5ce7), // Purple
      new THREE.Color(0xa55eea), // Violet
      new THREE.Color(0x26de81), // Green
      new THREE.Color(0xfd79a8), // Pink
    ];

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
        
        colorAttr.array[i3] = color.r;
        colorAttr.array[i3 + 1] = color.g;
        colorAttr.array[i3 + 2] = color.b;
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
        colorAttr.array[i3] = defaultColor.r;
        colorAttr.array[i3 + 1] = defaultColor.g;
        colorAttr.array[i3 + 2] = defaultColor.b;
      }
      
      colorAttr.needsUpdate = true;
    }

    // Create edges using pre-computed edge data from JSON
    function createClusterEdges() {
      // Remove existing edges
      removeClusterEdges();
      
      if (!edgesData || !coordinates || coordinates.length === 0 || !clusters) return;
      
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
          // Only create edge once (since edges are bidirectional, only create when i < targetIdx)
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
        
        const edgeMaterial = new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.3,
          linewidth: 1
        });
        
        clusterEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
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

    // Search for a word and highlight it
    function searchForWord(word, currentUseClusterColors = false) {
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
      
      const normalizedWord = word.toLowerCase().trim();
      const foundIndex = labels.findIndex(label => 
        (label || "").toLowerCase() === normalizedWord
      );
      
      if (foundIndex === -1) {
        console.log(`Word "${word}" not found in vocabulary`);
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
        if (pos) {
          tooltipCoords.textContent = `(${pos.x.toFixed(3)}, ${pos.y.toFixed(3)}, ${pos.z.toFixed(3)})`;
        } else {
          tooltipCoords.textContent = "";
        }
        
        // Position tooltip - show if point is visible on screen
        if (worldPos.z < 1 && x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
          tooltip.style.left = `${x}px`;
          tooltip.style.top = `${y}px`;
          tooltip.style.display = "block";
        } else {
          // Still show tooltip but position it in center if off-screen
          tooltip.style.left = `${rect.width / 2}px`;
          tooltip.style.top = `${rect.height / 2}px`;
          tooltip.style.display = "block";
        }
      };
      
      // Show tooltip immediately
      showSearchTooltip();
      
      // Animate camera to word
      const targetPos = new THREE.Vector3(pos.x, pos.y, pos.z);
      const distance = 1.5;
      const direction = new THREE.Vector3()
        .subVectors(camera.position, targetPos)
        .normalize()
        .multiplyScalar(distance);
      const newCamPos = new THREE.Vector3().addVectors(targetPos, direction);
      
      // Smooth camera animation
      const startPos = camera.position.clone();
      const startTarget = controls.target.clone();
      const target = targetPos.clone();
      
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
          requestAnimationFrame(animateCamera);
        }
      }
      
      animateCamera();
    }

    // Expose functions to parent component via ref (with current prop values)
    canvasFunctionsRef.current._internalSearchForWord = searchForWord;
    canvasFunctionsRef.current.searchForWord = (word) => searchForWord(word, useClusterColors);
    canvasFunctionsRef.current.updateClusterColors = updateClusterColors;
    canvasFunctionsRef.current.resetColors = resetColors;
    canvasFunctionsRef.current.clusters = () => clusters;
    canvasFunctionsRef.current.getWords = () => wordsListRef.current;
    canvasFunctionsRef.current.createClusterEdges = createClusterEdges;
    canvasFunctionsRef.current.removeClusterEdges = removeClusterEdges;

    loadEmbeddings().then(() => {
      // Store words list for combobox
      wordsListRef.current = [...labels];
      
      // Clusters and edges are already loaded from JSON - no computation needed!
      // Apply initial coloring
      if (useClusterColors && clusters) {
        updateClusterColors();
      }
      
      // Create initial edges if enabled
      if (showClusterEdges && edgesData) {
        createClusterEdges();
      }
    });

    // Attach touch listeners for tap-to-identify
    renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: true });
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: true });
    renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: true });

    // --- Animate ---
    const animate = () => {
      controls.update();
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
            tooltip.style.left = `${x}px`;
            tooltip.style.top = `${y}px`;
            // Ensure tooltip is visible for searched word
            if (tooltip.style.display !== "block") {
              const label = labels[searchedIndex];
              const coord = coordinates[searchedIndex];
              tooltipName.textContent = label;
              if (coord) {
                tooltipCoords.textContent = `(${coord.x.toFixed(3)}, ${coord.y.toFixed(3)}, ${coord.z.toFixed(3)})`;
              }
              tooltip.style.display = "block";
            }
          } else {
            // Point is off-screen, but keep tooltip ready
            tooltip.style.display = "none";
          }
        } else {
          // Point is behind camera
          tooltip.style.display = "none";
        }
      }
      
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    // --- Pointer events for hover ---
    let isDragging = false;
    const onPointerDown = () => { isDragging = true; };
    const onPointerUp = () => { isDragging = false; };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

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
        return defaultColor;
      }
      return clusterColors[clusterId % clusterColors.length];
    };

    const onPointerMove = (event) => {
      if (isDragging) {
        tooltip.style.display = "none";
        // Reset previous hover
        if (hoveredIndex !== null && geometry) {
          updatePointColor(hoveredIndex, defaultColor);
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
            tooltipCoords.textContent = `(${coord.x.toFixed(3)}, ${coord.y.toFixed(3)}, ${coord.z.toFixed(3)})`;
          } else {
            tooltipCoords.textContent = "";
          }
          
          // Tooltip relative to container for consistent positioning
          const tipRect = container.getBoundingClientRect();
          tooltip.style.left = `${event.clientX - tipRect.left}px`;
          tooltip.style.top = `${event.clientY - tipRect.top}px`;
          tooltip.style.display = "block";
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

    // Add event listeners to the renderer canvas, not container
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

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
      ro.disconnect();
      cancelAnimationFrame(rafRef.current);
      renderer.setAnimationLoop(null);
      renderer.renderLists?.dispose();

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

      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
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
  }, [embeddingModel, wordCount, reductionMethod]); // Re-run when embedding model, word count, or reduction method changes

  // Update ref when prop changes
  useEffect(() => {
    useClusterColorsRef.current = useClusterColors;
  }, [useClusterColors]);

  // Handle search word changes
  useEffect(() => {
    // Update the search function to use current useClusterColors value
    if (canvasFunctionsRef.current) {
      canvasFunctionsRef.current.searchForWord = (word) => {
        const searchFn = canvasFunctionsRef.current._internalSearchForWord;
        if (searchFn) searchFn(word, useClusterColorsRef.current);
      };
    }
    
    const searchFn = canvasFunctionsRef.current?.searchForWord;
    if (searchFn) {
      searchFn(searchWord);
    }
  }, [searchWord, useClusterColors]);

  // Handle cluster color changes  
  useEffect(() => {
    const updateFn = canvasFunctionsRef.current?.updateClusterColors;
    const resetFn = canvasFunctionsRef.current?.resetColors;
    const getClusters = canvasFunctionsRef.current?.clusters;
    
    if (useClusterColors && updateFn && getClusters && getClusters()) {
      updateFn();
      // Re-apply search if active
      if (searchWord) {
        const searchFn = canvasFunctionsRef.current?.searchForWord;
        if (searchFn) searchFn(searchWord);
      }
    } else if (!useClusterColors && resetFn) {
      resetFn();
      // Re-apply search highlight if active
      if (searchWord) {
        const searchFn = canvasFunctionsRef.current?.searchForWord;
        if (searchFn) searchFn(searchWord);
      }
    }
  }, [useClusterColors, searchWord]);

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

  return <div ref={containerRef} className="w-full h-full" />;
});

export default EmbeddingCanvas;
