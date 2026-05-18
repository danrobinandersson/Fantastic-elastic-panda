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
    preset: "dawn",
    intensity: 0.2,
    blur: 0.7,
    rotation: -0.65,
  },

  ambientLight: {
    intensity: 0.0,
  },

  light1: {
    color: "#d56103",
    intensity: 225,
    distance: 12.1,
    decay: 1.0,
    position: [-1.4, 6.7, -2.5],
  },

  light2: {
    color: "#ba6040",
    intensity: 161,
    distance: 23.6,
    decay: 0.9,
    position: [0.0, -3.5, -3.4],
  },

  light3: {
    color: "#823f00",
    intensity: 888,
    distance: 26.5,
    decay: 1.3,
    position: [-2.3, 5.3, 20.2  ],
  },
}