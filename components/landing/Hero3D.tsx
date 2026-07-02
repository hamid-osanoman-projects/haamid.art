'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text3D, Center } from '@react-three/drei';
import * as THREE from 'three';

// Suppress Three.js Clock deprecation warning caused by React Three Fiber v9 internals
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (
      args[0] &&
      typeof args[0] === 'string' &&
      args[0].includes('THREE.Clock: This module has been deprecated')
    ) {
      return;
    }
    originalWarn(...args);
  };
}

// Particle background drifting slowly
function Particles({ count = 200 }) {
  const pointsRef = useRef<THREE.Points>(null);

  // Generate random positions and colors for particles
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      // Random coordinates in a cube
      pos[i * 3] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 16;

      // Color gradient from #7F77DD (127, 119, 221) to #3ECF8E (62, 207, 142)
      const t = Math.random();
      cols[i * 3] = (127 + t * (62 - 127)) / 255;
      cols[i * 3 + 1] = (119 + t * (207 - 119)) / 255;
      cols[i * 3 + 2] = (221 + t * (142 - 221)) / 255;
    }

    return [pos, cols];
  }, [count]);

  // Animate the particles drifting
  useFrame((state) => {
    if (pointsRef.current) {
      const time = state.clock.getElapsedTime() * 0.05;
      const geo = pointsRef.current.geometry;
      const posAttr = geo.attributes.position;

      for (let i = 0; i < count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        // Slowly drift up, reset if out of bounds
        let newY = y + 0.005 + Math.sin(time + x) * 0.002;
        if (newY > 8) newY = -8;
        posAttr.setY(i, newY);
      }
      posAttr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          itemSize={3}
          array={positions}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
          itemSize={3}
          array={colors}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// Camera parallax rig based on pointer coords
function CameraRig() {
  useFrame((state) => {
    // Parallax strength control (state.pointer goes from -1 to 1)
    const targetX = state.pointer.x * 1.5;
    const targetY = state.pointer.y * 1.5;

    // Smooth transition interpolation
    state.camera.position.x += (targetX - state.camera.position.x) * 0.08;
    state.camera.position.y += (targetY - state.camera.position.y) * 0.08;
    state.camera.lookAt(0, 0, 0);
  });
  return null;
}

// Floating "HAMID" metallic text
function FloatingText() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Slow float & rotation over time
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime();
      // Gentle floating up and down
      meshRef.current.position.y = Math.sin(time * 0.8) * 0.15;
      
      // Gentle rotation on Y, accelerates slightly on hover
      const rotationSpeed = hovered ? 0.6 : 0.25;
      meshRef.current.rotation.y = Math.sin(time * rotationSpeed) * 0.12;
      meshRef.current.rotation.x = Math.cos(time * 0.2) * 0.05;
    }
  });

  return (
    <Center>
      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        scale={hovered ? 1.08 : 1.0}
      >
        <Text3D
          font="https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json"
          size={1.4}
          height={0.25}
          curveSegments={12}
          bevelEnabled
          bevelThickness={0.05}
          bevelSize={0.03}
          bevelOffset={0}
          bevelSegments={5}
        >
          HAMID
          <meshStandardMaterial
            metalness={0.9}
            roughness={0.15}
            color={hovered ? '#a855f7' : '#7F77DD'}
            emissive={hovered ? '#1e1b4b' : '#000000'}
          />
        </Text3D>
      </mesh>
    </Center>
  );
}

export default function Hero3D() {
  return (
    <div className="absolute inset-0 -z-10 h-full w-full bg-[#0a0a0a]">
      {/* 3D Canvas rendering */}
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 75 }}
        gl={{ antialias: true, alpha: false }}
        className="h-full w-full"
      >
        <color attach="background" args={['#0a0a0a']} />
        
        {/* Lights configuration */}
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#7F77DD" />
        <pointLight position={[-10, -10, 10]} intensity={1.2} color="#3ECF8E" />
        <pointLight position={[0, 0, 5]} intensity={0.8} color="#ffffff" />
        
        {/* Animated text and particles */}
        <FloatingText />
        <Particles count={200} />
        
        {/* Mouse parallax effect */}
        <CameraRig />
      </Canvas>
    </div>
  );
}
