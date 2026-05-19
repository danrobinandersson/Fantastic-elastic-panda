import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import type { ReactNode } from "react";
import { SceneDebugController }from "../debug/SceneDebugController";

interface Props {
  children: ReactNode;
  config: any;
  setConfig?: React.Dispatch<React.SetStateAction<any>>;
  background?: string | null;
  debug?: boolean;
  className?: string;
  cameraOverride?: Partial<{
    x: number;
    y: number;
    z: number;
    fov: number;
    rotationX: number;
  }>;
}

export function SceneLayout({
  children,
  config,
  setConfig,
  background = null,
  debug = false, // change to true to enable debug panel
  className,
  cameraOverride,
}: Props) {
  return (
    <Canvas
      className={className}
      camera={{
        position: [
          cameraOverride?.x ?? config.camera.x,
          cameraOverride?.y ?? config.camera.y,
          cameraOverride?.z ?? config.camera.z,
        ],
        fov: cameraOverride?.fov ?? config.camera.fov,
        rotation: [cameraOverride?.rotationX ?? config.camera.rotationX, 0, 0],
      }}
      gl={{
        antialias: true,
        alpha: background === null,
      }}
      dpr={[1, 2]}
      onCreated={({ gl, scene }) => {
        if (background === null) {
          gl.setClearColor(0x000000, 0);
          scene.background = null;
        } else {
          scene.background = new THREE.Color(background);
        }
      }}
    >
      <Suspense fallback={null}>
        {debug && (
          <SceneDebugController config={config} setConfig={setConfig} />
        )}

        <ambientLight intensity={config.ambientLight.intensity} />

        <pointLight
          color={config.light1.color}
          intensity={config.light1.intensity}
          position={config.light1.position}
          distance={config.light1.distance}
          decay={config.light1.decay}
        />

        <pointLight
          color={config.light2.color}
          intensity={config.light2.intensity}
          position={config.light2.position}
          distance={config.light2.distance}
          decay={config.light2.decay}
        />

        <pointLight
          color={config.light3.color}
          intensity={config.light3.intensity}
          position={config.light3.position}
          distance={config.light3.distance}
          decay={config.light3.decay}
        />

        <Environment
          preset={config.environment.preset}
          blur={config.environment.blur}
          resolution={64}
          environmentIntensity={config.environment.intensity}
          environmentRotation={[0, config.environment.rotation, 0]}
        />

        {children}
      </Suspense>
    </Canvas>
  );
}