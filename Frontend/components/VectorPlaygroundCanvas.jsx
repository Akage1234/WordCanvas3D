"use client";
import { useEffect, useRef } from "react";
import * as THREE from "three";

export default function VectorPlaygroundCanvas() {
  const ref = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const container = ref.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, Math.max(container.clientWidth, 1) / Math.max(container.clientHeight, 1), 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const cubeGeom = new THREE.BoxGeometry();
    const cubeMat = new THREE.MeshStandardMaterial({ color: 0x00aaff });
    const cube = new THREE.Mesh(cubeGeom, cubeMat);
    scene.add(cube);
    scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    camera.position.z = 3;

    const animate = () => {
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

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
      cancelAnimationFrame(rafRef.current);
      renderer.setAnimationLoop(null);
      renderer.renderLists?.dispose();
      cubeGeom.dispose();
      cubeMat.dispose();
      renderer.dispose();
      const gl = renderer.getContext?.();
      gl?.getExtension?.('WEBGL_lose_context')?.loseContext?.();
      container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={ref} className="w-full h-full" />;
}
