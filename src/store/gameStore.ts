import { create } from "zustand";
import type { BlendshapeValues } from "../types/blendshape";

type GamePhase =
  | "idle"
  | "preview"
  | "playing"
  | "finished";

type GameConfig = {
  price: number;
  timerSeconds: number;
  doubleWinThreshold: number;
  moneyBackThreshold: number;
};

type GameStore = {
  phase: GamePhase;

  coins: number;

  score: number | null;

  isGuestMode: boolean;

  targetBlendshapes: BlendshapeValues;
  playerBlendshapes: BlendshapeValues;

  config: GameConfig;

  setGuestMode: (value: boolean) => void;

  setPlayerBlendshapes: (
    values: BlendshapeValues
  ) => void;

  setTargetBlendshapes: (
    values: BlendshapeValues
  ) => void;

  startGame: () => void;

  finishGame: (score: number) => void;

  exitGame: () => void;

  updateConfig: (
    config: Partial<GameConfig>
  ) => void;
};

export const useGameStore =
  create<GameStore>()((set) => ({
    phase: "idle",

    coins: 25,

    score: null,

    isGuestMode: false,

    targetBlendshapes:
      {} as BlendshapeValues,

    playerBlendshapes:
      {} as BlendshapeValues,

    config: {
      price: 2,

      timerSeconds: 20,

      doubleWinThreshold: 90, // 90+ = 3+ coin payout

      moneyBackThreshold: 87,
    },

    setGuestMode: (value) =>
      set({
        isGuestMode: value,
      }),

    setPlayerBlendshapes: (values) =>
      set({
        playerBlendshapes: values,
      }),

    setTargetBlendshapes: (values) =>
      set({
        targetBlendshapes: values,
      }),

    startGame: () =>
      set((state) => ({
        phase: "playing",

        coins: state.isGuestMode
          ? state.coins
          : state.coins - state.config.price,

        score: null,
      })),

    finishGame: (score) =>
      set({
        phase: "finished",
        score,
      }),

    exitGame: () =>
      set({
        phase: "idle",
        score: null,
      }),

    updateConfig: (config) =>
      set((state) => ({
        config: {
          ...state.config,
          ...config,
        },
      })),
  }));