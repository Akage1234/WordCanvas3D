"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";

function Points({ embeddings, tokens }) {
  return (
    <group>
      {embeddings.map((vec, i) => (
        <mesh key={i} position={vec}>
          <sphereGeometry args={[0.03, 16, 16]} />
          <meshStandardMaterial color="#1d4ed8" />
        </mesh>
      ))}
    </group>
  );
}

export default function EmbeddingCanvas() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/sample_embeddings.json")
      .then(res => res.json())
      .then(setData);
  }, []);

  if (!data) return null;

  return (
    <div className="h-[500px] mt-10 rounded-lg overflow-hidden shadow">
      <Canvas camera={{ position: [1.5, 1.5, 1.5] }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[5, 5, 5]} />
        <Points embeddings={data.embeddings} tokens={data.tokens} />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
