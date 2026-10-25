"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";
function Orb() {
  const ref = useRef<Mesh>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.035;
  });
  return (
    <mesh ref={ref} rotation={[0.4, 0.2, 0.1]}>
      <icosahedronGeometry args={[2, 2]} />
      <meshBasicMaterial color="#b7c998" wireframe transparent opacity={0.12} />
    </mesh>
  );
}
export default function Ambient() {
  return (
    <div className="ambient" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 5] }}
        gl={{ alpha: true, antialias: false }}
      >
        <Orb />
      </Canvas>
    </div>
  );
}
