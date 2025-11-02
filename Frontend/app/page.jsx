'use client';

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Button } from '@/components/ui/button'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

// Tiny typewriter for rotating taglines
function useTypewriter(lines, speed = 40, hold = 1400) {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  useEffect(() => {
    let i = 0;
    let mounted = true;
    const type = () => {
      if (!mounted) return;
      if (i <= lines[index].length) {
        setText(lines[index].slice(0, i));
        i++;
        setTimeout(type, speed);
      } else {
        setTimeout(() => {
          setIndex((prev) => (prev + 1) % lines.length);
          setText('');
        }, hold);
      }
    };
    type();
    return () => { mounted = false; };
  }, [index, lines, speed, hold]);
  return text;
}

// 3D: simple interactive floating points cloud
function FloatingPoints({ count = 800, color = '#60a5fa', labeledCount = 24, neighbors = 3 }) {
    const groupRef = useRef();
    const geomRef = useRef();
  
    const wordBank = useMemo(
      () => [
        'token', 'vector', 'embedding', 'cosine', 'norm', 'latent', 'space', 'similarity',
        'cluster', 'feature', 'dimension', 'context', 'attention', 'matrix', 'basis',
        'graph', 'manifold', 'loss', 'gradient', 'epoch', 'layer', 'neuron', 'encode',
        'decode', 'project', 'orthogonal', 'semantic', 'syntax', 'scale', 'shift',
        'projection', 'alignment', 'distance', 'angle', 'rank', 'kernel', 'entropy',
      ],
      []
    );
  
    const positions = useMemo(() => {
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const r = 0.9 + Math.random() * 0.6;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const x = r * Math.sin(phi) * Math.cos(theta);
        const y = r * Math.sin(phi) * Math.sin(theta);
        const z = r * Math.cos(phi);
        pos[i * 3 + 0] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
      return pos;
    }, [count]);
  
    const labelIndices = useMemo(() => {
      const n = Math.min(labeledCount, count);
      const indices = new Set();
      while (indices.size < n) indices.add(Math.floor(Math.random() * count));
      return Array.from(indices);
    }, [count, labeledCount]);
  
    const uniqueLabels = useMemo(() => {
      const n = labelIndices.length;
      const pool = [...wordBank];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const base = pool.slice(0, Math.min(n, pool.length));
      while (base.length < n) base.push(`${pool[base.length % pool.length]}-${base.length}`);
      return base;
    }, [labelIndices.length, wordBank]);
  
    const colors = useMemo(() => {
      const base = new THREE.Color(color);
      const highlight = new THREE.Color('#facc15');
      const arr = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const j = i * 3;
        arr[j + 0] = base.r;
        arr[j + 1] = base.g;
        arr[j + 2] = base.b;
      }
      for (let k = 0; k < labelIndices.length; k++) {
        const idx = labelIndices[k];
        const j = idx * 3;
        arr[j + 0] = highlight.r;
        arr[j + 1] = highlight.g;
        arr[j + 2] = highlight.b;
      }
      return arr;
    }, [count, color, labelIndices]);
  
    useFrame((state) => {
      const t = state.clock.getElapsedTime();
      if (groupRef.current) {
        groupRef.current.rotation.y = t * 0.12;
        groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.08;
      }
    });
  
    const getLabelPosition = (i) => {
      const j = i * 3;
      const x = positions[j + 0];
      const y = positions[j + 1];
      const z = positions[j + 2];
      const v = new THREE.Vector3(x, y, z).normalize().multiplyScalar(0.06);
      return [x + v.x, y + v.y, z + v.z];
    };
  
    // Build lightweight graph between labeled points (k-NN)
    const linePositions = useMemo(() => {
      const idxs = labelIndices;
      if (idxs.length === 0) return new Float32Array(0);
      const pts = idxs.map((idx) => {
        const j = idx * 3;
        return new THREE.Vector3(positions[j], positions[j + 1], positions[j + 2]);
      });
  
      const edges = [];
      const seen = new Set();
      for (let i = 0; i < pts.length; i++) {
        // compute distances to others
        const dists = [];
        for (let j = 0; j < pts.length; j++) {
          if (i === j) continue;
          dists.push({ j, d: pts[i].distanceTo(pts[j]) });
        }
        dists.sort((a, b) => a.d - b.d);
        const k = Math.min(neighbors, dists.length);
        for (let n = 0; n < k; n++) {
          const a = Math.min(i, dists[n].j);
          const b = Math.max(i, dists[n].j);
          const key = `${a}-${b}`;
          if (!seen.has(key)) {
            seen.add(key);
            edges.push([a, b]);
          }
        }
      }
  
      const arr = new Float32Array(edges.length * 2 * 3);
      let p = 0;
      for (const [a, b] of edges) {
        arr[p++] = pts[a].x; arr[p++] = pts[a].y; arr[p++] = pts[a].z;
        arr[p++] = pts[b].x; arr[p++] = pts[b].y; arr[p++] = pts[b].z;
      }
      return arr;
    }, [labelIndices, positions, neighbors]);
  
    return (
      <group ref={groupRef}>
        <points>
          <bufferGeometry ref={geomRef}>
            <bufferAttribute
              attach="attributes-position"
              count={positions.length / 3}
              array={positions}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              count={colors.length / 3}
              array={colors}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            vertexColors
            size={0.024}
            sizeAttenuation
            depthWrite={false}
            transparent
            opacity={0.9}
            blending={THREE.NormalBlending}
          />
        </points>
  
        {/* White lines connecting labeled points */}
        {linePositions.length > 0 && (
          <lineSegments>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={linePositions.length / 3}
                array={linePositions}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#ffffff" transparent opacity={0.25} />
          </lineSegments>
        )}
  
        {labelIndices.map((idx, i) => (
          <Html key={idx} position={getLabelPosition(idx)} zIndexRange={[0, 1000]}>
            <div
              style={{
                pointerEvents: 'none',
                background: 'rgba(17, 24, 39, 0.92)',
                color: '#fef3c7',
                border: '1px solid rgba(120, 113, 108, 0.5)',
                padding: '2px 6px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 6px 16px rgba(0,0,0,0.45)',
              }}
            >
              {uniqueLabels[i]}
            </div>
          </Html>
        ))}
      </group>
    );
  }


const Home = () => {
  const lines = useMemo(
    () => [
      'Visualize tokenization in real-time.',
      'Explore embeddings in 3D space.',
      'Play with vectors, gain intuition.',
    ],
    []
  );
  const typed = useTypewriter(lines);

  return (
    <>
     <main className="px-4 sm:px-6 md:px-10 lg:px-14 overflow-hidden min-h-[calc(100dvh-96px)] flex items-center justify-center py-6 md:py-0">
     <div className="mx-auto flex flex-col md:flex-row w-full max-w-7xl items-center justify-center gap-6 md:gap-6 lg:gap-10">
          {/* Left: headline + brief explanation + actions */}
          <section className="relative flex-1 flex flex-col justify-center order-2 md:order-1 w-full md:w-auto">
            <div className="pointer-events-none absolute -inset-10 opacity-40 blur-3xl"
                 aria-hidden
                 style={{
                   background:
                     'radial-gradient(1200px 500px at 0% 0%, rgba(59,130,246,0.20), rgba(0,0,0,0))'
                 }}
            />
            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800/60 px-2 md:px-3 py-1 text-[10px] md:text-xs text-neutral-400 mb-3 md:mb-4">
                <span className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-blue-500 animate-pulse" />
                Live playground
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                Understand text through
                {' '}
                <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300 bg-clip-text text-transparent">
                  tokens and vectors
                </span>
              </h1>
              <p className="mt-3 md:mt-4 text-sm sm:text-base max-w-xl text-neutral-400 leading-relaxed">
                WordCanvas helps you see how text becomes numbers, and how those numbers
                arrange in space. Tokenize inputs, explore embeddings, and build intuition—
                all in your browser.
              </p>

              <div className="mt-4 md:mt-6 h-6 md:h-7 text-sky-300/90">
                <span className="font-mono text-sm md:text-base lg:text-lg">{typed}</span>
                <span className="ml-1 inline-block h-4 md:h-5 w-[2px] align-middle bg-sky-300 animate-pulse" />
              </div>

              <div className="mt-6 md:mt-8 flex flex-wrap gap-2 md:gap-3">
                <Link href="/tokenizer" className="w-full sm:w-auto">
                  <Button className="bg-blue-600 hover:bg-blue-500 text-white w-full sm:w-auto">
                    Try Tokenizer
                  </Button>
                </Link>
                <Link href="/embedding" className="w-full sm:w-auto">
                  <Button variant="outline" className="border-neutral-700 hover:bg-neutral-900 w-full sm:w-auto">
                    View Embeddings
                  </Button>
                </Link>
                <Link href="/vector-playground" className="w-full sm:w-auto">
                  <Button variant="outline" className="border-neutral-700 hover:bg-neutral-900 w-full sm:w-auto">
                    Vector Playground
                  </Button>
                </Link>
              </div>
            </div>
          </section>

          {/* Right: interactive 3D */}
          <section className="relative flex-1 max-w-[860px] w-full order-1 md:order-2">
            <div className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-950" />
            <div className="relative w-full h-[50vh] sm:h-[55vh] md:h-[62dvh] lg:h-[68dvh] rounded-lg md:rounded-xl overflow-hidden border border-neutral-800">
                <Canvas className="h-full w-full" camera={{ position: [1.8, 1.4, 1.8], fov: 55 }}>
                <ambientLight intensity={0.6} />
                <pointLight position={[4, 4, 4]} intensity={1.2} />
                <FloatingPoints />
                <OrbitControls enableZoom={false} minPolarAngle={0.9} maxPolarAngle={2.2} />
                </Canvas>
            </div>
        </section>
        </div>
      </main>
    </>
  )
}

export default Home