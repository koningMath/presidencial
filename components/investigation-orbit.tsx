"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function Particles() {
  const points = useRef<THREE.Points>(null);
  const outer = useRef<THREE.Group>(null);
  const positions = useMemo(() => {
    const count = 1800;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const radius = 2.05 + (i % 13) * 0.003;
      data[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      data[i * 3 + 1] = radius * Math.cos(phi);
      data[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.065;
    if (outer.current) {
      outer.current.rotation.y -= delta * 0.042;
      outer.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.18) * 0.065;
    }
  });

  return (
    <group rotation={[0.18, -0.23, -0.16]}>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#b6b5b5" size={0.023} sizeAttenuation transparent opacity={0.7} depthWrite={false} />
      </points>
      <group ref={outer}>
        <mesh rotation={[0.35, 0.3, 0.12]}>
          <torusGeometry args={[2.52, 0.008, 5, 240]} />
          <meshBasicMaterial color="#f46a70" transparent opacity={0.65} />
        </mesh>
        <mesh rotation={[-0.52, 0.2, 0.6]}>
          <torusGeometry args={[2.7, 0.0035, 4, 240]} />
          <meshBasicMaterial color="#94a9ff" transparent opacity={0.36} />
        </mesh>
      </group>
    </group>
  );
}

export default function InvestigationOrbit() {
  return (
    <Canvas camera={{ position: [0, 0, 7.5], fov: 42 }} dpr={[1, 1.5]} gl={{ alpha: true, antialias: true }}>
      <Particles />
    </Canvas>
  );
}
