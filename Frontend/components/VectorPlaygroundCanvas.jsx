"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { ungzip } from "pako";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function VectorPlaygroundCanvas({
  embeddingModel = "glove_300D",
  showGridlines = true,
  words = [],
  resultVector = null,
  resultLabel = "Result",
  resultInfo = null,
  onEmbeddingsLoaded = null,
  vectorA = null,
  vectorB = null,
  vectorC = null,
}) {
  const ref = useRef(null);
  const rafRef = useRef(0);
  const sceneRef = useRef(null);
  const gridHelperRef = useRef(null); 
  const axesHelperRef = useRef(null);
  const vectorsRef = useRef(new Map()); // Map of word -> { arrow, label, hoverTube, originalColor }
  const embeddingsDataRef = useRef(null); // Store loaded embeddings
  const raycasterRef = useRef(null);
  const mouseRef = useRef(new THREE.Vector2());
  const hoveredVectorRef = useRef(null); // Currently hovered vector
  const resultVectorRef = useRef(null); // Store result vector object
  const rendererRef = useRef(null); // Store renderer reference
  const cameraRef = useRef(null); // Store camera reference
  const distanceVectorsRef = useRef([]); // Store distance vector arrows (a->b, b->c, c->output)
  const [embeddingsReady, setEmbeddingsReady] = useState(false); // Track when embeddings are loaded

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090a12);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1),
      0.1,
      1000
    );
    camera.position.set(3, 3, 3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.sortObjects = true; // Enable sorting for proper depth
    renderer.depthTest = true;
    renderer.depthWrite = true;
    
    // Style the canvas to fill container properly
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.outline = 'none';
    
    container.appendChild(renderer.domElement);

    // Result info box element (shown in canvas)
    const resultInfoBox = document.createElement("div");
    resultInfoBox.setAttribute("data-result-info-box", "true");
    resultInfoBox.style.position = "absolute";
    resultInfoBox.style.top = "20px";
    resultInfoBox.style.right = "20px";
    resultInfoBox.style.pointerEvents = "none";
    resultInfoBox.style.padding = "12px 16px";
    resultInfoBox.style.borderRadius = "8px";
    resultInfoBox.style.background = "rgba(0, 0, 0, 0.85)";
    resultInfoBox.style.color = "white";
    resultInfoBox.style.fontSize = "12px";
    resultInfoBox.style.fontFamily = "system-ui, sans-serif";
    resultInfoBox.style.zIndex = "1000";
    resultInfoBox.style.minWidth = "200px";
    resultInfoBox.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";
    resultInfoBox.style.display = "none";
    resultInfoBox.style.lineHeight = "1.6";
    container.style.position = "relative";
    container.style.width = "100%";
    container.style.height = "100%";
    container.appendChild(resultInfoBox);

    // Add OrbitControls for camera manipulation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);
    // Ensure camera looks at origin
    camera.lookAt(0, 0, 0);

    // Add ambient light
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));

    // Helper function to create text sprite
    function createTextSprite(text, color = 0xffffff) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Use larger canvas for better text rendering
      const padding = 20;
      context.font = 'Bold 64px Arial';
      const metrics = context.measureText(text);
      const textWidth = metrics.width;
      const textHeight = 64;
      
      canvas.width = textWidth + padding * 2;
      canvas.height = textHeight + padding * 2;
      
      // Clear and set background (transparent)
      context.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw text
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.font = 'Bold 64px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture,
        transparent: true,
        alphaTest: 0.1
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(0.3, 0.3, 1);
      
      return sprite;
    }

    // Helper function to create custom axes with labels
    function createAxesHelper() {
      const axesGroup = new THREE.Group();
      const axisLength = 2;
      
      // X-axis (Red) - use ArrowHelper for stability
      const xArrowHelper = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        axisLength,
        0xff0000,
        axisLength * 0.15,
        axisLength * 0.1
      );
      xArrowHelper.line.material.depthWrite = true;
      xArrowHelper.line.material.depthTest = true;
      xArrowHelper.line.renderOrder = 10; // Higher render order than grid
      xArrowHelper.cone.material.depthWrite = true;
      xArrowHelper.cone.material.depthTest = true;
      xArrowHelper.cone.renderOrder = 10;
      axesGroup.add(xArrowHelper);
      
      // X label
      const xLabel = createTextSprite('X', 0xff0000);
      xLabel.position.set(axisLength + 0.15, 0, 0);
      xLabel.renderOrder = 1000;
      axesGroup.add(xLabel);
      
      // Y-axis (Green)
      const yArrowHelper = new THREE.ArrowHelper(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(0, 0, 0),
        axisLength,
        0x00ff00,
        axisLength * 0.15,
        axisLength * 0.1
      );
      yArrowHelper.line.material.depthWrite = true;
      yArrowHelper.line.material.depthTest = true;
      yArrowHelper.line.renderOrder = 10; // Higher render order than grid
      yArrowHelper.cone.material.depthWrite = true;
      yArrowHelper.cone.material.depthTest = true;
      yArrowHelper.cone.renderOrder = 10;
      axesGroup.add(yArrowHelper);
      
      // Y label
      const yLabel = createTextSprite('Y', 0x00ff00);
      yLabel.position.set(0, axisLength + 0.15, 0);
      yLabel.renderOrder = 1000;
      axesGroup.add(yLabel);
      
      // Z-axis (Blue)
      const zArrowHelper = new THREE.ArrowHelper(
        new THREE.Vector3(0, 0, 1),
        new THREE.Vector3(0, 0, 0),
        axisLength,
        0x0000ff,
        axisLength * 0.15,
        axisLength * 0.1
      );
      zArrowHelper.line.material.depthWrite = true;
      zArrowHelper.line.material.depthTest = true;
      zArrowHelper.line.renderOrder = 10; // Higher render order than grid
      zArrowHelper.cone.material.depthWrite = true;
      zArrowHelper.cone.material.depthTest = true;
      zArrowHelper.cone.renderOrder = 10;
      axesGroup.add(zArrowHelper);
      
      // Z label
      const zLabel = createTextSprite('Z', 0x0000ff);
      zLabel.position.set(0, 0, axisLength + 0.15);
      zLabel.renderOrder = 1000;
      axesGroup.add(zLabel);
      
      axesHelperRef.current = axesGroup;
      scene.add(axesGroup);
    }

    // Helper function to create origin marker
    function createOriginMarker() {
      const originGeometry = new THREE.SphereGeometry(0.05, 16, 16);
      const originMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffffff,
        depthWrite: true,
        depthTest: true
      });
      const origin = new THREE.Mesh(originGeometry, originMaterial);
      origin.position.set(0, 0, 0);
      origin.renderOrder = 999;
      scene.add(origin);
    }

    // Helper function to create grid helper
    function createGridHelper() {
      if (gridHelperRef.current) {
        scene.remove(gridHelperRef.current);
        gridHelperRef.current.dispose();
      }
      if (showGridlines) {
        const gridHelper = new THREE.GridHelper(5, 10, 0x444444, 0x222222);
        // Set grid to render first (lower render order) so axes render on top
        gridHelper.renderOrder = -1;
        // Position grid slightly below origin to avoid z-fighting
        gridHelper.position.y = -0.001;
        gridHelper.material.depthWrite = false;
        gridHelper.material.transparent = false;
        gridHelperRef.current = gridHelper;
        scene.add(gridHelper);
      }
    }

    // Color palette for vectors
    const vectorColors = [
      0x00aaff, // Blue
      0xff6b6b, // Red
      0x4ecdc4, // Teal
      0x45b7d1, // Light Blue
      0xf9ca24, // Yellow
      0x6c5ce7, // Purple
      0xa55eea, // Violet
      0x26de81, // Green
      0xfd79a8, // Pink
      0xfa8231, // Orange
    ];

    // Helper function to create vector arrow
    function createVectorArrow(vector, color = 0xff0000, word = "") {
      const direction = new THREE.Vector3().fromArray(vector);
      const length = direction.length();
      
      if (length === 0) return null;

      // Normalize for arrow direction
      direction.normalize();
      
      // Store original direction and length for label positioning
      const vectorEnd = new THREE.Vector3().fromArray(vector);

      // Create arrow helper
      const arrowHelper = new THREE.ArrowHelper(
        direction,
        new THREE.Vector3(0, 0, 0),
        length,
        color,
        length * 0.1,
        length * 0.05
      );
      
      // Store reference to materials for color changes
      arrowHelper.userData = {
        originalColor: color,
        lineMaterial: arrowHelper.line.material,
        coneMaterial: arrowHelper.cone.material,
        word: word
      };

      // Create invisible tube along the arrow for hover detection (like EmbeddingCanvas uses Points)
      // CylinderGeometry creates a cylinder along Y-axis, we need to orient it along the vector direction
      const tubeGeometry = new THREE.CylinderGeometry(0.08, 0.08, length, 8, 1);
      const tubeMaterial = new THREE.MeshBasicMaterial({
        visible: false, // Invisible but raycastable
        transparent: true,
        opacity: 0
      });
      const hoverTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      
      // Position tube at the midpoint of the vector
      const midpoint = vectorEnd.clone().multiplyScalar(0.5);
      hoverTube.position.copy(midpoint);
      
      // Orient tube along the vector direction
      // Cylinder is along Y-axis, so we need to rotate it to align with the direction vector
      const upVector = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(upVector, direction);
      hoverTube.setRotationFromQuaternion(quaternion);
      
      arrowHelper.userData.hoverTube = hoverTube;

      return arrowHelper;
    }
    
    // Helper function to update vector color
    function updateVectorColor(vectorHelper, color) {
      if (!vectorHelper || !vectorHelper.userData) return;
      vectorHelper.line.material.color.set(color);
      vectorHelper.cone.material.color.set(color);
    }

    // Create axes and origin
    createAxesHelper();
    createOriginMarker();
    createGridHelper();

    // Load full embeddings
    async function loadFullEmbeddings() {
      try {
        // Determine model type and folder name
        let modelFolder;
        let fileName;
        
        if (embeddingModel.startsWith("glove_")) {
          // GloVe models: glove_300D -> glove_300d folder, but files use uppercase D
          modelFolder = embeddingModel.toLowerCase();
          const modelNum = embeddingModel.replace("glove_", ""); // Keep original case (300D)
          // Files use uppercase D in filename: glove_300D_full.json.gz
          fileName = `glove_${modelNum}_full.json.gz`;
        } else if (embeddingModel.startsWith("fasttext_")) {
          // FastText models: fasttext_300d -> FastText_300D folder
          modelFolder = "FastText_300D";
          fileName = `FastText_300D_full.json.gz`;
        } else if (embeddingModel.startsWith("word2vec_")) {
          // Word2Vec models: word2vec_300d -> Word2Vec_300D folder
          modelFolder = "Word2Vec_300D";
          fileName = `Word2Vec_300D_full.json.gz`;
        } else {
          // Default fallback
          modelFolder = embeddingModel.toLowerCase();
          fileName = `${embeddingModel}_full.json.gz`;
        }
        
        const fetchUrl = `/${modelFolder}/${fileName}`;
        
        const res = await fetch(fetchUrl);
        const buf = await res.arrayBuffer();
        const text = ungzip(new Uint8Array(buf), { to: "string" });
        const data = JSON.parse(text);
        
        console.log(`Loaded full embeddings for ${embeddingModel}:`, Object.keys(data).length, "words");
        embeddingsDataRef.current = data;
        
        // Notify parent that embeddings are loaded
        if (onEmbeddingsLoaded) {
          onEmbeddingsLoaded(data);
        }
        
        // Signal that embeddings are ready (triggers distance vectors update)
        setEmbeddingsReady(true);
        
        // Words will be plotted by the useEffect that watches the words prop
      } catch (error) {
        console.error("Error loading full embeddings:", error);
      }
    }

    // Reset embeddings ready state when embedding model changes
    setEmbeddingsReady(false);
    
    loadFullEmbeddings();

    // Initialize raycaster for hover detection (same as EmbeddingCanvas)
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;

    // Hover detection using raycaster (same approach as EmbeddingCanvas)
    const onPointerMove = (event) => {
      if (!container || (vectorsRef.current.size === 0 && !resultVectorRef.current)) {
        container.style.cursor = "default";
        return;
      }

      // Use canvas rect for precise raycasting coordinates (same as EmbeddingCanvas)
      const pickRect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - pickRect.left) / pickRect.width) * 2 - 1;
      const y = -((event.clientY - pickRect.top) / pickRect.height) * 2 + 1;
      mouseRef.current.set(x, y);

      // Set raycaster from camera (same as EmbeddingCanvas)
      raycaster.setFromCamera(mouseRef.current, camera);
      
      // Collect all hover tubes (including result vector)
      const allHoverTubes = Array.from(vectorsRef.current.values()).map(v => v.hoverTube).filter(Boolean);
      if (resultVectorRef.current?.hoverTube) {
        allHoverTubes.push(resultVectorRef.current.hoverTube);
      }
      
      // Intersect with all hover tubes
      const intersects = raycaster.intersectObjects(allHoverTubes, false);

      // Reset previously hovered vector
      if (hoveredVectorRef.current && hoveredVectorRef.current !== null) {
        const prevData = hoveredVectorRef.current;
        updateVectorColor(prevData.arrow, prevData.originalColor);
      }

      if (intersects.length > 0) {
        // Find which vector was hovered
        const hoveredTube = intersects[0].object;
        
        // Check if it's the result vector
        if (resultVectorRef.current && resultVectorRef.current.hoverTube === hoveredTube) {
          updateVectorColor(resultVectorRef.current.arrow, 0xffff00);
          hoveredVectorRef.current = resultVectorRef.current;
          container.style.cursor = "pointer";
          return;
        }
        
        // Check regular vectors
        const hoveredWord = Array.from(vectorsRef.current.entries()).find(
          ([word, data]) => data.hoverTube === hoveredTube
        )?.[0];

        if (hoveredWord) {
          const vectorData = vectorsRef.current.get(hoveredWord);
          if (vectorData) {
            // Highlight hovered vector in yellow
            updateVectorColor(vectorData.arrow, 0xffff00);
            hoveredVectorRef.current = vectorData;
            container.style.cursor = "pointer";
            return;
          }
        }
      }

      // Not hovering over any vector
      hoveredVectorRef.current = null;
      container.style.cursor = "default";
    };

    // Add event listeners to the renderer canvas, not container (same as EmbeddingCanvas)
    renderer.domElement.addEventListener("pointermove", onPointerMove);

    // Animation loop
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    // Handle resize
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

    return () => {
      ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(rafRef.current);
      renderer.setAnimationLoop(null);
      renderer.renderLists?.dispose();
      controls.dispose();
      if (gridHelperRef.current) {
        gridHelperRef.current.dispose();
      }
      if (axesHelperRef.current) {
        // Dispose all resources in axes group
        axesHelperRef.current.traverse((object) => {
          if (object instanceof THREE.ArrowHelper) {
            object.line.geometry?.dispose();
            object.line.material?.dispose();
            object.cone.geometry?.dispose();
            object.cone.material?.dispose();
          }
          if (object instanceof THREE.Line) {
            object.geometry?.dispose();
            object.material?.dispose();
          }
          if (object instanceof THREE.Sprite) {
            object.material?.map?.dispose();
            object.material?.dispose();
          }
        });
        scene.remove(axesHelperRef.current);
      }
      // Clean up all vectors
      for (const [word, vectorData] of vectorsRef.current.entries()) {
        if (vectorData.arrow) {
          scene.remove(vectorData.arrow);
          vectorData.arrow.dispose();
        }
        if (vectorData.label) {
          scene.remove(vectorData.label);
          vectorData.label.material.map.dispose();
          vectorData.label.material.dispose();
        }
        if (vectorData.hoverTube) {
          scene.remove(vectorData.hoverTube);
          vectorData.hoverTube.geometry.dispose();
          vectorData.hoverTube.material.dispose();
        }
      }
      vectorsRef.current.clear();
      
      // Clean up result vector
      if (resultVectorRef.current) {
        if (resultVectorRef.current.arrow) {
          scene.remove(resultVectorRef.current.arrow);
          resultVectorRef.current.arrow.dispose();
        }
        if (resultVectorRef.current.label) {
          scene.remove(resultVectorRef.current.label);
          resultVectorRef.current.label.material.map.dispose();
          resultVectorRef.current.label.material.dispose();
        }
        if (resultVectorRef.current.hoverTube) {
          scene.remove(resultVectorRef.current.hoverTube);
          resultVectorRef.current.hoverTube.geometry.dispose();
          resultVectorRef.current.hoverTube.material.dispose();
        }
        resultVectorRef.current = null;
      }
      
      // Clean up distance vectors
      for (const arrow of distanceVectorsRef.current) {
        if (arrow) {
          scene.remove(arrow);
          arrow.dispose();
        }
      }
      distanceVectorsRef.current = [];
      // Dispose all geometries and materials in scene
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          object.material?.dispose();
        }
        if (object instanceof THREE.Line) {
          object.geometry?.dispose();
          object.material?.dispose();
        }
        if (object instanceof THREE.Sprite) {
          object.material?.map?.dispose();
          object.material?.dispose();
        }
      });
      renderer.dispose();
      const gl = renderer.getContext?.();
      gl?.getExtension?.('WEBGL_lose_context')?.loseContext?.();
      container.removeChild(renderer.domElement);
      const resultInfoBox = container.querySelector('[data-result-info-box]');
      if (resultInfoBox && resultInfoBox.parentElement === container) {
        container.removeChild(resultInfoBox);
      }
    };
  }, [embeddingModel]);

  // Update vectors when words or embeddings change
  useEffect(() => {
    if (!sceneRef.current || !embeddingsDataRef.current) {
      // Clear all vectors if scene or embeddings not ready
      if (sceneRef.current) {
        for (const [word, vectorData] of vectorsRef.current.entries()) {
          if (vectorData.arrow) sceneRef.current.remove(vectorData.arrow);
          if (vectorData.label) sceneRef.current.remove(vectorData.label);
          if (vectorData.hoverTube) sceneRef.current.remove(vectorData.hoverTube);
          vectorData.arrow?.dispose();
          vectorData.label?.material?.map?.dispose();
          vectorData.label?.material?.dispose();
          vectorData.hoverTube?.geometry?.dispose();
          vectorData.hoverTube?.material?.dispose();
        }
        vectorsRef.current.clear();
      }
      return;
    }

    // When embedding model changes, clear existing vectors first to force re-plot
    if (words.length === 0) {
      // Clear all vectors if no words
      for (const [word, vectorData] of vectorsRef.current.entries()) {
        if (vectorData.arrow) sceneRef.current.remove(vectorData.arrow);
        if (vectorData.label) sceneRef.current.remove(vectorData.label);
        if (vectorData.hoverTube) sceneRef.current.remove(vectorData.hoverTube);
        vectorData.arrow?.dispose();
        vectorData.label?.material?.map?.dispose();
        vectorData.label?.material?.dispose();
        vectorData.hoverTube?.geometry?.dispose();
        vectorData.hoverTube?.material?.dispose();
      }
      vectorsRef.current.clear();
      return;
    }

    const vectorColors = [
      0x00aaff, 0xff6b6b, 0x4ecdc4, 0x45b7d1, 0xf9ca24,
      0x6c5ce7, 0xa55eea, 0x26de81, 0xfd79a8, 0xfa8231,
    ];

    // Helper to create vector arrow (inline to access scene)
    const createVectorArrow = (vector, color, word) => {
      const direction = new THREE.Vector3().fromArray(vector);
      const length = direction.length();
      if (length === 0) return null;
      direction.normalize();
      const vectorEnd = new THREE.Vector3().fromArray(vector);

      const arrowHelper = new THREE.ArrowHelper(
        direction, new THREE.Vector3(0, 0, 0), length, color,
        length * 0.1, length * 0.05
      );
      arrowHelper.userData = {
        originalColor: color,
        lineMaterial: arrowHelper.line.material,
        coneMaterial: arrowHelper.cone.material,
        word: word
      };

      const tubeGeometry = new THREE.CylinderGeometry(0.08, 0.08, length, 8, 1);
      const tubeMaterial = new THREE.MeshBasicMaterial({
        visible: false, transparent: true, opacity: 0
      });
      const hoverTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
      const midpoint = vectorEnd.clone().multiplyScalar(0.5);
      hoverTube.position.copy(midpoint);
      const upVector = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion();
      quaternion.setFromUnitVectors(upVector, direction);
      hoverTube.setRotationFromQuaternion(quaternion);
      arrowHelper.userData.hoverTube = hoverTube;
      return arrowHelper;
    };

    // Helper to create text sprite (inline)
    const createTextSprite = (text, color) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      const padding = 20;
      context.font = 'Bold 64px Arial';
      const metrics = context.measureText(text);
      const textWidth = metrics.width;
      canvas.width = textWidth + padding * 2;
      canvas.height = 64 + padding * 2;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      context.font = 'Bold 64px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, canvas.width / 2, canvas.height / 2);
      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture, transparent: true, alphaTest: 0.1
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(0.3, 0.3, 1);
      return sprite;
    };

    // ALWAYS clear ALL existing word vectors to force re-plot with updated centroid
    // This ensures vectors are re-centered when resultVector or words change
    for (const [word, vectorData] of vectorsRef.current.entries()) {
      if (vectorData.arrow) sceneRef.current.remove(vectorData.arrow);
      if (vectorData.label) sceneRef.current.remove(vectorData.label);
      if (vectorData.hoverTube) sceneRef.current.remove(vectorData.hoverTube);
      vectorData.arrow?.dispose();
      vectorData.label?.material?.map?.dispose();
      vectorData.label?.material?.dispose();
      vectorData.hoverTube?.geometry?.dispose();
      vectorData.hoverTube?.material?.dispose();
    }
    vectorsRef.current.clear();

    // Remove vectors that are no longer in the words list
    const currentWords = new Set(words);

    // Calculate scale factor based on all vectors (words + result) to make them more visible
    let maxDistance = 0;
    const targetRadius = 2.5; // Target radius for the furthest vector
    
    // Check all word vectors
    words.forEach((word) => {
      if (!embeddingsDataRef.current[word]) return;
      const embedding = embeddingsDataRef.current[word];
      const vector3D = new THREE.Vector3(
        embedding[0] || 0,
        embedding[1] || 0,
        embedding[2] || 0
      );
      const distance = vector3D.length();
      if (distance > maxDistance) maxDistance = distance;
    });
    
    // Check result vector if present
    if (resultVector && Array.isArray(resultVector) && resultVector.length >= 3) {
      const resultVector3D = new THREE.Vector3(
        resultVector[0] || 0,
        resultVector[1] || 0,
        resultVector[2] || 0
      );
      const distance = resultVector3D.length();
      if (distance > maxDistance) maxDistance = distance;
    }
    
    // Calculate scale factor - if vectors are very small, scale them up
    // If maxDistance is 0 or very small, use a default scale
    const scaleFactor = maxDistance > 0.01 ? targetRadius / maxDistance : 100;
    
    // Add vectors for all words using scaled embedding positions
    words.forEach((word, index) => {
      // Skip words not in the current words list
      if (!currentWords.has(word)) return;
      
      if (!embeddingsDataRef.current[word]) {
        console.warn(`Word "${word}" not found in embeddings`);
        return;
      }

      const embedding = embeddingsDataRef.current[word];
      // Apply scale factor to make vectors more visible
      const vector3D = [
        (embedding[0] || 0) * scaleFactor,
        (embedding[1] || 0) * scaleFactor,
        (embedding[2] || 0) * scaleFactor
      ];
      const vectorEnd = new THREE.Vector3().fromArray(vector3D);
      const color = vectorColors[index % vectorColors.length];

      const arrow = createVectorArrow(vector3D, color, word);
      if (!arrow) return;

      sceneRef.current.add(arrow);

      const hoverTube = arrow.userData.hoverTube;
      if (hoverTube) {
        sceneRef.current.add(hoverTube);
      }

      const label = createTextSprite(word, color);
      const labelOffset = vectorEnd.clone().normalize().multiplyScalar(0.15);
      label.position.copy(vectorEnd).add(labelOffset);
      label.renderOrder = 1000;
      sceneRef.current.add(label);

      vectorsRef.current.set(word, {
        arrow,
        label,
        hoverTube,
        originalColor: color
      });
      });
  }, [words, embeddingModel, embeddingsReady, resultVector]);

  // Update gridlines when showGridlines changes
  useEffect(() => {
    if (!sceneRef.current) return;

    if (gridHelperRef.current) {
      sceneRef.current.remove(gridHelperRef.current);
      gridHelperRef.current.dispose();
      gridHelperRef.current = null;
    }

    if (showGridlines) {
      const gridHelper = new THREE.GridHelper(5, 10, 0x444444, 0x222222);
      // Set grid to render first (lower render order) so axes render on top
      gridHelper.renderOrder = -1;
      // Position grid slightly below origin to avoid z-fighting
      gridHelper.position.y = -0.001;
      gridHelper.material.depthWrite = false;
      gridHelper.material.transparent = false;
      gridHelperRef.current = gridHelper;
      sceneRef.current.add(gridHelper);
    }
  }, [showGridlines]);

  // Update result vector when resultVector prop changes
  useEffect(() => {
    if (!sceneRef.current || !embeddingsDataRef.current) return;

    // Remove existing result vector
    if (resultVectorRef.current) {
      if (resultVectorRef.current.arrow) sceneRef.current.remove(resultVectorRef.current.arrow);
      if (resultVectorRef.current.label) sceneRef.current.remove(resultVectorRef.current.label);
      if (resultVectorRef.current.hoverTube) sceneRef.current.remove(resultVectorRef.current.hoverTube);
      resultVectorRef.current.arrow?.dispose();
      resultVectorRef.current.label?.material?.map?.dispose();
      resultVectorRef.current.label?.material?.dispose();
      resultVectorRef.current.hoverTube?.geometry?.dispose();
      resultVectorRef.current.hoverTube?.material?.dispose();
      resultVectorRef.current = null;
    }

    // Add new result vector if provided
    if (resultVector && Array.isArray(resultVector) && resultVector.length >= 3) {
      // Calculate scale factor (same logic as in words effect for consistency)
      let maxDistance = 0;
      const targetRadius = 2.5;
      
      // Check all word vectors
      words.forEach((word) => {
        if (!embeddingsDataRef.current[word]) return;
        const embedding = embeddingsDataRef.current[word];
        const vector3D = new THREE.Vector3(
          embedding[0] || 0,
          embedding[1] || 0,
          embedding[2] || 0
        );
        const distance = vector3D.length();
        if (distance > maxDistance) maxDistance = distance;
      });
      
      // Check result vector
      const resultVector3D = new THREE.Vector3(
        resultVector[0] || 0,
        resultVector[1] || 0,
        resultVector[2] || 0
      );
      const distance = resultVector3D.length();
      if (distance > maxDistance) maxDistance = distance;
      
      // Calculate scale factor
      const scaleFactor = maxDistance > 0.01 ? targetRadius / maxDistance : 100;
      
      // Apply scale factor to result vector
      const vector3D = [
        (resultVector[0] || 0) * scaleFactor,
        (resultVector[1] || 0) * scaleFactor,
        (resultVector[2] || 0) * scaleFactor
      ];
      const vectorEnd = new THREE.Vector3().fromArray(vector3D);
      const resultColor = 0x00ff00; // Green color for result vector

      // Helper to create vector arrow
      const createResultArrow = (vector, color, word) => {
        const direction = new THREE.Vector3().fromArray(vector);
        const length = direction.length();
        if (length === 0) return null;
        direction.normalize();

        const arrowHelper = new THREE.ArrowHelper(
          direction, new THREE.Vector3(0, 0, 0), length, color,
          length * 0.1, length * 0.05
        );
        
        arrowHelper.userData = {
          originalColor: color,
          lineMaterial: arrowHelper.line.material,
          coneMaterial: arrowHelper.cone.material,
          word: word
        };

        const tubeGeometry = new THREE.CylinderGeometry(0.12, 0.12, length, 8, 1); // Slightly thicker for result
        const tubeMaterial = new THREE.MeshBasicMaterial({
          visible: false, transparent: true, opacity: 0
        });
        const hoverTube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        const midpoint = vectorEnd.clone().multiplyScalar(0.5);
        hoverTube.position.copy(midpoint);
        const upVector = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion();
        quaternion.setFromUnitVectors(upVector, direction);
        hoverTube.setRotationFromQuaternion(quaternion);
        arrowHelper.userData.hoverTube = hoverTube;
        return arrowHelper;
      };

      // Helper to create text sprite
      const createTextSprite = (text, color) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        const padding = 20;
        context.font = 'Bold 64px Arial';
        const metrics = context.measureText(text);
        const textWidth = metrics.width;
        canvas.width = textWidth + padding * 2;
        canvas.height = 64 + padding * 2;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.font = 'Bold 64px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const spriteMaterial = new THREE.SpriteMaterial({
          map: texture, transparent: true, alphaTest: 0.1
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(0.3, 0.3, 1);
        return sprite;
      };

      const arrow = createResultArrow(vector3D, resultColor, resultLabel);
      if (arrow) {
        sceneRef.current.add(arrow);

        const hoverTube = arrow.userData.hoverTube;
        if (hoverTube) {
          sceneRef.current.add(hoverTube);
        }

        const label = createTextSprite(resultLabel, resultColor);
        const labelOffset = vectorEnd.clone().normalize().multiplyScalar(0.15);
        label.position.copy(vectorEnd).add(labelOffset);
        label.renderOrder = 1000;
        sceneRef.current.add(label);

        resultVectorRef.current = {
          arrow,
          label,
          hoverTube,
          originalColor: resultColor
        };
      }
    }
  }, [resultVector, resultLabel, words, embeddingModel]);

  // Update result info box when resultInfo prop changes
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    
    const resultInfoBox = container.querySelector('[data-result-info-box]');
    if (!resultInfoBox) return;

    if (resultInfo && resultInfo.closestWord) {
      resultInfoBox.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 8px; font-size: 13px;">Result:</div>
        <div style="margin-bottom: 6px;">
          <span style="color: rgba(255,255,255,0.7);">Closest word: </span>
          <span style="font-weight: 600; color: #00ff00;">${resultInfo.closestWord}</span>
        </div>
        <div style="margin-bottom: 6px; font-family: monospace; font-size: 11px; color: rgba(255,255,255,0.7);">
          3D: (${resultInfo.vector3D[0].toFixed(3)}, ${resultInfo.vector3D[1].toFixed(3)}, ${resultInfo.vector3D[2].toFixed(3)})
        </div>
        ${resultInfo.similarity !== undefined ? `
          <div style="font-family: monospace; font-size: 11px; color: rgba(255,255,255,0.7);">
            Similarity: ${resultInfo.similarity.toFixed(4)}
          </div>
        ` : ''}
      `;
      resultInfoBox.style.display = "block";
    } else {
      resultInfoBox.style.display = "none";
    }
  }, [resultInfo]);

  // Create/update distance vectors (a->b, b->c, c->output) when calculation is complete
  useEffect(() => {
    if (!sceneRef.current || !embeddingsDataRef.current) {
      // Clean up distance vectors if scene or embeddings not ready
      if (sceneRef.current) {
        for (const arrow of distanceVectorsRef.current) {
          if (arrow) {
            sceneRef.current.remove(arrow);
            arrow.dispose();
          }
        }
        distanceVectorsRef.current = [];
      }
      return;
    }

    // Remove existing distance vectors
    for (const arrow of distanceVectorsRef.current) {
      if (arrow) {
        sceneRef.current.remove(arrow);
        arrow.dispose();
      }
    }
    distanceVectorsRef.current = [];

    // Only create distance vectors if we have all required vectors: a, b, c, and resultVector
    if (!vectorA || !vectorB || !vectorC || !resultVector) {
      return;
    }

    // Check if all words exist in embeddings
    if (!embeddingsDataRef.current[vectorA] || !embeddingsDataRef.current[vectorB] || !embeddingsDataRef.current[vectorC]) {
      return;
    }

    // Calculate scale factor (same logic as in other effects for consistency)
    let maxDistance = 0;
    const targetRadius = 2.5;
    
    // Check all word vectors (including a, b, c)
    const allWords = [vectorA, vectorB, vectorC];
    allWords.forEach((word) => {
      if (!embeddingsDataRef.current[word]) return;
      const embedding = embeddingsDataRef.current[word];
      const vector3D = new THREE.Vector3(
        embedding[0] || 0,
        embedding[1] || 0,
        embedding[2] || 0
      );
      const distance = vector3D.length();
      if (distance > maxDistance) maxDistance = distance;
    });
    
    // Check result vector
    if (resultVector && Array.isArray(resultVector) && resultVector.length >= 3) {
      const resultVector3D = new THREE.Vector3(
        resultVector[0] || 0,
        resultVector[1] || 0,
        resultVector[2] || 0
      );
      const distance = resultVector3D.length();
      if (distance > maxDistance) maxDistance = distance;
    }
    
    // Calculate scale factor
    const scaleFactor = maxDistance > 0.01 ? targetRadius / maxDistance : 100;

    // Get 3D positions for a, b, c, and result using SCALED embedding positions
    const getVector3D = (word) => {
      if (word === 'result' || word === null) {
        if (!resultVector) return null;
        return new THREE.Vector3(
          (resultVector[0] || 0) * scaleFactor,
          (resultVector[1] || 0) * scaleFactor,
          (resultVector[2] || 0) * scaleFactor
        );
      }
      const embedding = embeddingsDataRef.current[word];
      if (!embedding) return null;
      return new THREE.Vector3(
        (embedding[0] || 0) * scaleFactor,
        (embedding[1] || 0) * scaleFactor,
        (embedding[2] || 0) * scaleFactor
      );
    };

    const posA = getVector3D(vectorA);
    const posB = getVector3D(vectorB);
    const posC = getVector3D(vectorC);
    const posResult = getVector3D(null);

    if (!posA || !posB || !posC || !posResult) {
      return;
    }

    // Yellow color for distance vectors
    const distanceColor = 0xffff00;

    // Helper function to create distance arrow from start to end position
    const createDistanceArrow = (startPos, endPos, color) => {
      const direction = new THREE.Vector3().subVectors(endPos, startPos);
      const length = direction.length();
      
      if (length === 0) return null;

      const normalizedDir = direction.clone().normalize();

      // Create arrow helper positioned at start, pointing toward end
      const arrowHelper = new THREE.ArrowHelper(
        normalizedDir,
        startPos.clone(),
        length,
        color,
        length * 0.15,
        length * 0.08
      );

      return arrowHelper;
    };

    // Create distance vectors: a->b, b->c, c->output
    const arrowAB = createDistanceArrow(posA, posB, distanceColor);
    if (arrowAB) {
      sceneRef.current.add(arrowAB);
      distanceVectorsRef.current.push(arrowAB);
    }

    const arrowBC = createDistanceArrow(posB, posC, distanceColor);
    if (arrowBC) {
      sceneRef.current.add(arrowBC);
      distanceVectorsRef.current.push(arrowBC);
    }

    const arrowCResult = createDistanceArrow(posC, posResult, distanceColor);
    if (arrowCResult) {
      sceneRef.current.add(arrowCResult);
      distanceVectorsRef.current.push(arrowCResult);
    }
  }, [vectorA, vectorB, vectorC, resultVector, embeddingModel, words, embeddingsReady]);

  return <div ref={ref} className="w-full h-full" />;
}
