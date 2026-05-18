// SceneLayout.tsx

import { Canvas, useThree } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense } from "react";
import { useControls } from "leva";
import * as THREE from "three";
import type { ReactNode } from "react";

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

function SceneDebugController({
  config,
  setConfig,
}: {
  config: any;
  setConfig?: React.Dispatch<React.SetStateAction<any>>;
}) {
  const { camera } = useThree();

  useControls("Scene", {
   

    light1Color: {
      value: config.light1.color,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light1: {
            ...prev.light1,
            color: v,
          },
        }));
      },
    },

      Intensity: {
      value: config.light1.intensity,
      min: 0,
      max: 1000,
      step: 1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light1: {
            ...prev.light1,
            intensity: v,
          },
        }));
      },
    },



    light1X: {
      value: config.light1.position[0],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light1: {
            ...prev.light1,
            position: [v, prev.light1.position[1], prev.light1.position[2]],
          },
        }));
      },
    },

    light1Y: {
      value: config.light1.position[1],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light1: {
            ...prev.light1,
            position: [prev.light1.position[0], v, prev.light1.position[2]],
          },
        }));
      },
    },

    light1Z: {
      value: config.light1.position[2],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light1: {
            ...prev.light1,
            position: [prev.light1.position[0], prev.light1.position[1], v],
          },
        }));
      },
    },

light1Distance: {
  value: config.light1.distance,
  min: 0,
  max: 50,
  step: 0.1,
  onChange: (v) => {
    setConfig?.((prev: any) => ({
      ...prev,
      light1: {
        ...prev.light1,
        distance: v,
      },
    }))
  },
},

light1Decay: {
  value: config.light1.decay,
  min: 0,
  max: 5,
  step: 0.1,
  onChange: (v) => {
    setConfig?.((prev: any) => ({
      ...prev,
      light1: {
        ...prev.light1,
        decay: v,
      },
    }))
  },
},


    light2Color: {
      value: config.light2.color,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light2: {
            ...prev.light2,
            color: v,
          },
        }));
      },
    },


    light2Intensity: {
      value: config.light2.intensity,
      min: 0,
      max: 1000,
      step: 1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light2: {
            ...prev.light2,
            intensity: v,
          },
        }));
      },
    },



    light2X: {
      value: config.light2.position[0],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light2: {
            ...prev.light2,
            position: [v, prev.light2.position[1], prev.light2.position[2]],
          },
        }));
      },
    },

    light2Y: {
      value: config.light2.position[1],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light2: {
            ...prev.light2,
            position: [prev.light2.position[0], v, prev.light2.position[2]],
          },
        }));
      },
    },

    light2Z: {
      value: config.light2.position[2],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light2: {
            ...prev.light2,
            position: [prev.light2.position[0], prev.light2.position[1], v],
          },
        }));
      },
    },

light2Distance: {
  value: config.light2.distance,
  min: 0,
  max: 50,
  step: 0.1,
  onChange: (v) => {
    setConfig?.((prev: any) => ({
      ...prev,
      light2: {
        ...prev.light2,
        distance: v,
      },
    }))
  },
},
light2Decay: {
  value: config.light2.decay,
  min: 0,
  max: 5,
  step: 0.1,
  onChange: (v) => {
    setConfig?.((prev: any) => ({
      ...prev,
      light2: {
        ...prev.light2,
        decay: v,
      },
    }))
  },
},


    light3Color: {
      value: config.light3.color,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light3: {
            ...prev.light3,
            color: v,
          },
        }));
      },
    },


    light3Intensity: {
      value: config.light3.intensity,
      min: 0,
      max: 1000,
      step: 1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light3: {
            ...prev.light3,
            intensity: v,
          },
        }));
      },
    },



    light3X: {
      value: config.light3.position[0],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light3: {
            ...prev.light3,
            position: [v, prev.light3.position[1], prev.light3.position[2]],
          },
        }));
      },
    },

    light3Y: {
      value: config.light3.position[1],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light3: {
            ...prev.light3,
            position: [prev.light3.position[0], v, prev.light3.position[2]],
          },
        }));
      },
    },

    light3Z: {
      value: config.light3.position[2],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light3: {
            ...prev.light3,
            position: [prev.light3.position[0], prev.light3.position[1], v],
          },
        }));
      },
    },

    light3Distance: {
      value: config.light3.distance,
      min: 0,
      max: 50,
      step: 0.1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light3: {
            ...prev.light3,
            distance: v,
          },
        }))
      },
    },

    light3Decay: {
      value: config.light3.decay,
      min: 0,
      max: 5,
      step: 0.1,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          light3: {
            ...prev.light3,
            decay: v,
          },
        }))
      },
    },

  

//     cameraX: {
//   value: config.camera.x,
//   min: -20,
//   max: 20,
//   step: 0.1,
//   onChange: (v) => {
//     setConfig?.((prev: any) => ({
//       ...prev,
//       camera: {
//         ...prev.camera,
//         x: v,
//       },
//     }));
//   },
// },


// cameraY: {
//   value: config.camera.y,
//   min: -20,
//   max: 20,
//   step: 0.1,
//   onChange: (v) => {
//     setConfig?.((prev: any) => ({
//       ...prev,
//       camera: {
//         ...prev.camera,
//         y: v,
//       },
//     }));
//   },
// },

//     cameraZ: {
//       value: config.camera.z,
//       min: -20,
//       max: 20,
//       step: 0.1,
//       onChange: (v) => {
//         setConfig?.((prev: any) => ({
//           ...prev,
//           camera: {
//             ...prev.camera,
//             z: v,
//           },
//         }));
//       },
//     },

//     cameraFov: {
//       value: config.camera.fov,
//       min: 10,
//       max: 120,
//       step: 1,
//       onChange: (v) => {
//         setConfig?.((prev: any) => ({
//           ...prev,
//           camera: {
//             ...prev.camera,
//             fov: v,
//           },
//         }));
//       },
//     },

//     rotationX: {
//       value: config.camera.rotationX,
//       min: -Math.PI,
//       max: Math.PI,
//       step: 0.01,
//       onChange: (v) => {
//         setConfig?.((prev: any) => ({
//           ...prev,
//           camera: {
//             ...prev.camera,
//             rotationX: v,
//           },
//         }));
//       },
//     },

    ambientIntensity: {
      value: config.ambientLight.intensity,
      min: 0,
      max: 5,
      step: 0.01,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          ambientLight: {
            ...prev.ambientLight,
            intensity: v,
          },
        }));
      },
    },

    envIntensity: {
      value: config.environment.intensity,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v) => {
        setConfig?.((prev: any) => ({
          ...prev,
          environment: {
            ...prev.environment,
            intensity: v,
          },
        }));
      },
    },
  });

  if (camera instanceof THREE.PerspectiveCamera) {
    camera.position.set(config.camera.x, config.camera.y, config.camera.z);

    camera.rotation.order = "YXZ";

    camera.rotation.set(config.camera.rotationX, 0, 0);

    camera.fov = config.camera.fov;

    camera.updateProjectionMatrix();
  }

  return null;
}

export function SceneLayout({
  children,
  config,
  setConfig,
  background = null,
  debug = false,
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
