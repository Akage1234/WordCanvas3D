"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ungzip } from "pako";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function VectorPlaygroundCanvas({ embeddingModel = "glove_50d", showGridlines = true }) {
  const ref = useRef(null);
  const rafRef = useRef(0);
  const sceneRef = useRef(null);
  const gridHelperRef = useRef(null);
  const axesHelperRef = useRef(null);
  const manVectorRef = useRef(null);
  const manVectorLabelRef = useRef(null);
  const manVectorHoverTubeRef = useRef(null); // Invisible tube for hover detection
  const manVectorOriginalColor = useRef(0x00aaff);
  const raycasterRef = useRef(null);
  const mouseRef = useRef(new THREE.Vector2());

  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
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
    container.appendChild(renderer.domElement);

    // Add OrbitControls for camera manipulation
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 0, 0);

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

    // Helper function to create vector arrow
    function createVectorArrow(vector, color = 0xff0000, label = "") {
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
        coneMaterial: arrowHelper.cone.material
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

    // Load full embeddings and plot "Man" vector
    async function loadFullEmbeddings() {
      try {
        // Normalize model name to lowercase for folder path
        const modelFolder = embeddingModel.toLowerCase();
        const modelNum = embeddingModel.replace("glove_", "").toLowerCase();
        
        // Load the full embeddings file (highest word count: 10000)
        const fileName = `wiki_giga_${modelNum}_10000_full.json.gz`;
        const fetchUrl = `/${modelFolder}/${fileName}`;
        
        const res = await fetch(fetchUrl);
        const buf = await res.arrayBuffer();
        const text = ungzip(new Uint8Array(buf), { to: "string" });
        const data = JSON.parse(text);
        
        console.log(`Loaded full embeddings for ${embeddingModel}:`, Object.keys(data).length, "words");
        
        // Get "Man" vector (using first 3 dimensions for 3D visualization)
        if (data["man"] || data["Man"]) {
          const manVector = data["man"] || data["Man"];
          // Use first 3 dimensions for 3D visualization
          const manVector3D = [manVector[0] || 0, manVector[1] || 0, manVector[2] || 0];
          const vectorEnd = new THREE.Vector3().fromArray(manVector3D);
          
          // Remove previous vector and label if exists
          if (manVectorRef.current) {
            scene.remove(manVectorRef.current);
            manVectorRef.current.dispose();
          }
          if (manVectorLabelRef.current) {
            scene.remove(manVectorLabelRef.current);
            manVectorLabelRef.current.material.map.dispose();
            manVectorLabelRef.current.material.dispose();
          }

          // Create and add vector arrow
          const manArrow = createVectorArrow(manVector3D, 0x00aaff, "Man");
          if (manArrow) {
            manVectorRef.current = manArrow;
            manVectorOriginalColor.current = 0x00aaff;
            scene.add(manArrow);
            
            // Add hover tube for raycasting (like EmbeddingCanvas)
            if (manArrow.userData.hoverTube) {
              manVectorHoverTubeRef.current = manArrow.userData.hoverTube;
              scene.add(manVectorHoverTubeRef.current);
            }
            
            // Create label for "Man"
            const manLabel = createTextSprite("Man", 0x00aaff);
            // Position label at the end of the vector with slight offset
            const labelOffset = vectorEnd.clone().normalize().multiplyScalar(0.15);
            manLabel.position.copy(vectorEnd).add(labelOffset);
            manLabel.renderOrder = 1000;
            manVectorLabelRef.current = manLabel;
            scene.add(manLabel);
          }
        }
      } catch (error) {
        console.error("Error loading full embeddings:", error);
      }
    }

    loadFullEmbeddings();

    // Initialize raycaster for hover detection (same as EmbeddingCanvas)
    const raycaster = new THREE.Raycaster();
    raycasterRef.current = raycaster;

    // Hover detection using raycaster (same approach as EmbeddingCanvas)
    const onPointerMove = (event) => {
      if (!manVectorRef.current || !manVectorHoverTubeRef.current || !container) {
        updateVectorColor(manVectorRef.current, manVectorOriginalColor.current);
        return;
      }

      // Use canvas rect for precise raycasting coordinates (same as EmbeddingCanvas)
      const pickRect = renderer.domElement.getBoundingClientRect();
      const x = ((event.clientX - pickRect.left) / pickRect.width) * 2 - 1;
      const y = -((event.clientY - pickRect.top) / pickRect.height) * 2 + 1;
      mouseRef.current.set(x, y);

      // Set raycaster from camera (same as EmbeddingCanvas)
      raycaster.setFromCamera(mouseRef.current, camera);
      
      // Intersect with hover tube (same as EmbeddingCanvas uses intersectObject with Points)
      const intersects = raycaster.intersectObject(manVectorHoverTubeRef.current, false);

      if (intersects.length > 0) {
        // Hovering - change color to yellow
        updateVectorColor(manVectorRef.current, 0xffff00);
        container.style.cursor = "pointer";
      } else {
        // Not hovering - restore original color
        updateVectorColor(manVectorRef.current, manVectorOriginalColor.current);
        container.style.cursor = "default";
      }
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
      if (manVectorRef.current) {
        manVectorRef.current.dispose();
      }
      if (manVectorHoverTubeRef.current) {
        scene.remove(manVectorHoverTubeRef.current);
        manVectorHoverTubeRef.current.geometry.dispose();
        manVectorHoverTubeRef.current.material.dispose();
      }
      if (manVectorLabelRef.current) {
        scene.remove(manVectorLabelRef.current);
        manVectorLabelRef.current.material.map.dispose();
        manVectorLabelRef.current.material.dispose();
      }
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
    };
  }, [embeddingModel]);

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

  return <div ref={ref} className="w-full h-full" />;
}
