import { useThree } from "@react-three/fiber";
import { useControls } from "leva";
import * as THREE from "three";

function makeLightControls(
  n: 1 | 2 | 3,
  config: any,
  setConfig?: React.Dispatch<React.SetStateAction<any>>,  // mark optional
) {
  const key = `light${n}` as const;
  return {
    [`light${n}Color`]: {
      value: config[key].color,
      onChange: (v: string) =>
        setConfig?.((prev: any) => ({        // optional chain here
          ...prev,
          [key]: { ...prev[key], color: v },
        })),
    },
    [`light${n}Intensity`]: {
      value: config[key].intensity,
      min: 0,
      max: 1000,
      step: 1,
      onChange: (v: number) =>
        setConfig?.((prev: any) => ({
          ...prev,
          [key]: { ...prev[key], intensity: v },
        })),
    },
    [`light${n}X`]: {
      value: config[key].position[0],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v: number) =>
        setConfig?.((prev: any) => ({
          ...prev,
          [key]: {
            ...prev[key],
            position: [v, prev[key].position[1], prev[key].position[2]],
          },
        })),
    },
    [`light${n}Y`]: {
      value: config[key].position[1],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v: number) =>
        setConfig?.((prev: any) => ({
          ...prev,
          [key]: {
            ...prev[key],
            position: [prev[key].position[0], v, prev[key].position[2]],
          },
        })),
    },
    [`light${n}Z`]: {
      value: config[key].position[2],
      min: -30,
      max: 30,
      step: 0.1,
      onChange: (v: number) =>
        setConfig?.((prev: any) => ({
          ...prev,
          [key]: {
            ...prev[key],
            position: [prev[key].position[0], prev[key].position[1], v],
          },
        })),
    },
    [`light${n}Distance`]: {
      value: config[key].distance,
      min: 0,
      max: 50,
      step: 0.1,
      onChange: (v: number) =>
        setConfig?.((prev: any) => ({
          ...prev,
          [key]: { ...prev[key], distance: v },
        })),
    },
    [`light${n}Decay`]: {
      value: config[key].decay,
      min: 0,
      max: 5,
      step: 0.1,
      onChange: (v: number) =>
        setConfig?.((prev: any) => ({
          ...prev,
          [key]: { ...prev[key], decay: v },
        })),
    },
  };
}

export function SceneDebugController({
  config,
  setConfig,
}: {
  config: any;
  setConfig?: React.Dispatch<React.SetStateAction<any>>;
}) {
  const { camera } = useThree();

  useControls("Scene", {
    ...makeLightControls(1, config, setConfig),
    ...makeLightControls(2, config, setConfig),
    ...makeLightControls(3, config, setConfig),

    ambientIntensity: {
      value: config.ambientLight.intensity,
      min: 0,
      max: 5,
      step: 0.01,
      onChange: (v: number) =>
        setConfig?.((prev: any) => ({
          ...prev,
          ambientLight: { ...prev.ambientLight, intensity: v },
        })),
    },

    envIntensity: {
      value: config.environment.intensity,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v: number) =>
        setConfig?.((prev: any) => ({
          ...prev,
          environment: { ...prev.environment, intensity: v },
        })),
    },

    envRotation: {
      value: config.environment.rotation,
      min: -Math.PI,
      max: Math.PI,
      step: 0.01,
      onChange: (v: number) =>
        setConfig?.((prev: any) => ({
          ...prev,
          environment: { ...prev.environment, rotation: v },
        })),
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

