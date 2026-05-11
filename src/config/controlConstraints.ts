// src/config/controlConstraints.ts

import type { BlendshapeValues } from '../types/blendshape'

/**
 * Constraint defines a blendshape that is limited based on the state of other blendshapes.
 * Constraints can limit both minimum and maximum values.
 */
export interface Constraint {
  /** The key being constrained */
  target: keyof BlendshapeValues
  /** Returns the minimum allowed value given current blendshape state (optional) */
  min?: (current: BlendshapeValues) => number
  /** Returns the maximum allowed value given current blendshape state (optional) */
  max?: (current: BlendshapeValues) => number
}

/**
 * Define all blendshape constraints.
 * 
 * Constraints prevent:
 * 1. Simultaneous up/down movements (mutually exclusive)
 * 2. Simultaneous left/right movements (mutually exclusive)
 * 3. Cheek clipping when mouth is open (mouth_up limits cheek_down range)
 */
export const CONSTRAINTS: Constraint[] = [
  // Mouth: Up and Down are mutually exclusive
  {
    target: 'Mouth_Up',
    max: (bs) => bs['Mouth_Down'] > 0 ? 0 : 1,
  },
  {
    target: 'Mouth_Down',
    max: (bs) => bs['Mouth_Up'] > 0 ? 0 : 1,
  },
  // Mouth: Left and Right are mutually exclusive
  {
    target: 'Mouth_Left',
    max: (bs) => bs['Mouth_Right'] > 0 ? 0 : 1,
  },
  {
    target: 'Mouth_Right',
    max: (bs) => bs['Mouth_Left'] > 0 ? 0 : 1,
  },

  // Brows: Up and Down are mutually exclusive per side
  {
    target: 'L_Brow_Up',
    max: (bs) => bs['L_Brow_Down'] > 0 ? 0 : 1,
  },
  {
    target: 'L_Brow_Down',
    max: (bs) => bs['L_Brow_Up'] > 0 ? 0 : 1,
  },
  {
    target: 'R_Brow_Up',
    max: (bs) => bs['R_Brow_Down'] > 0 ? 0 : 1,
  },
  {
    target: 'R_Brow_Down',
    max: (bs) => bs['R_Brow_Up'] > 0 ? 0 : 1,
  },
  // Brows: Left and Right are mutually exclusive per side
  {
    target: 'L_Brow_Left',
    max: (bs) => bs['L_Brow_Right'] > 0 ? 0 : 1,
  },
  {
    target: 'L_Brow_Right',
    max: (bs) => bs['L_Brow_Left'] > 0 ? 0 : 1,
  },
  {
    target: 'R_Brow_Left',
    max: (bs) => bs['R_Brow_Right'] > 0 ? 0 : 1,
  },
  {
    target: 'R_Brow_Right',
    max: (bs) => bs['R_Brow_Left'] > 0 ? 0 : 1,
  },

  // Cheeks: Up and Down are mutually exclusive per side
  {
    target: 'L_Cheek_Up',
    max: (bs) => bs['L_Cheek_Down'] > 0 ? 0 : 1,
  },
  {
    target: 'L_Cheek_Down',
    max: (bs) => bs['L_Cheek_Up'] > 0 ? 0 : 1,
  },
  {
    target: 'R_Cheek_Up',
    max: (bs) => bs['R_Cheek_Down'] > 0 ? 0 : 1,
  },
  {
    target: 'R_Cheek_Down',
    max: (bs) => bs['R_Cheek_Up'] > 0 ? 0 : 1,
  },

  // Ears: Up and Down are mutually exclusive per side
  {
    target: 'L_Ear_Up',
    max: (bs) => bs['L_Ear_Down'] > 0 ? 0 : 1,
  },
  {
    target: 'L_Ear_Down',
    max: (bs) => bs['L_Ear_Up'] > 0 ? 0 : 1,
  },
  {
    target: 'R_Ear_Up',
    max: (bs) => bs['R_Ear_Down'] > 0 ? 0 : 1,
  },
  {
    target: 'R_Ear_Down',
    max: (bs) => bs['R_Ear_Up'] > 0 ? 0 : 1,
  },
  // Ears: Left and Right are mutually exclusive per side
  {
    target: 'L_Ear_Left',
    max: (bs) => bs['L_Ear_Right'] > 0 ? 0 : 1,
  },
  {
    target: 'L_Ear_Right',
    max: (bs) => bs['L_Ear_Left'] > 0 ? 0 : 1,
  },
  {
    target: 'R_Ear_Left',
    max: (bs) => bs['R_Ear_Right'] > 0 ? 0 : 1,
  },
  {
    target: 'R_Ear_Right',
    max: (bs) => bs['R_Ear_Left'] > 0 ? 0 : 1,
  },

  // Nose: Up and Down are mutually exclusive
  {
    target: 'Nose_Up',
    max: (bs) => bs['Nose_Down'] > 0 ? 0 : 1,
  },
  {
    target: 'Nose_Down',
    max: (bs) => bs['Nose_Up'] > 0 ? 0 : 1,
  },
  // Nose: Left and Right are mutually exclusive
  {
    target: 'Nose_Left',
    max: (bs) => bs['Nose_Right'] > 0 ? 0 : 1,
  },
  {
    target: 'Nose_Right',
    max: (bs) => bs['Nose_Left'] > 0 ? 0 : 1,
  },

  // Cheeks limited when mouth opens (mouth_up reduces cheek_down range)
  {
    target: 'R_Cheek_Down',
    max: (bs) => bs['Mouth_Up'] > 0 ? (1 - bs['Mouth_Up'] * 0.5) : 1,
  },
  {
    target: 'L_Cheek_Down',
    max: (bs) => bs['Mouth_Up'] > 0 ? (1 - bs['Mouth_Up'] * 0.5) : 1,
  },
]