// sceneConfig.ts

export const defaultSceneConfig = {
camera: {
    x: 0,
    y: -2.0,
    z: 5.4,
    fov: 56,
    rotationX: 0.2,
  },

  environment: {
    preset: "studio",
    intensity: 0.1,
    blur: 0.7,
    rotation: 3.14,
  },

  ambientLight: {
    intensity: 0.6,
  },

  light1: {
    color: "#096afc",
    intensity: 117,
    distance: 12.1,
    decay: 0.9,
    position: [0, 3.2, -1.2],
  },

  light2: {
    color: "#ba6040",
    intensity: 209,
    distance: 17.76,
    decay: 0.8,
    position: [0.3, -4.2, -3.1],
  },

  light3: {
    color: "#823f00",
    intensity: 607,
    distance: 46.9,
    decay: 1.2,
    position: [-0.4, 8.3, 13.6  ],
  },
}
