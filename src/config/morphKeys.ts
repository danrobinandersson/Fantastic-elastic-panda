// src/config/morphKeys.ts

/**
 * All morph keys available in the panda.glb model.
 */
export const MORPH_KEYS = [
 'Blink',
  'L_Brow_Down', 'L_Brow_Left', 'L_Brow_Right', 'L_Brow_Up',
  'L_Cheek_Down', 'L_Cheek_Left', 'L_Cheek_Up',
  'L_Ear_Down', 'L_Ear_Left', 'L_Ear_Right', 'L_Ear_Up',
  'L_Eye_Blink',
  'MouthClosed', 'Mouth_Down', 'Mouth_Left', 'Mouth_Right', 'Mouth_Up',
  'Nose_Down', 'Nose_Left', 'Nose_Right', 'Nose_Up',
  'R_Brow_Down', 'R_Brow_Left', 'R_Brow_Right', 'R_Brow_Up',
  'R_Cheek_Down', 'R_Cheek_Right', 'R_Cheek_Up',
  'R_Ear_Down', 'R_Ear_Left', 'R_Ear_Right', 'R_Ear_Up',
  'R_Eye_Blink',
] as const

/**
 * Controllable blendshapes tied to the face control zones.
 * Excludes automatic controls like Blink, Eye_Blink, and MouthClosed.
 */
export const CONTROLLABLE_MORPH_KEYS = [
  'L_Brow_Down', 'L_Brow_Left', 'L_Brow_Right', 'L_Brow_Up',
  'L_Cheek_Down', 'L_Cheek_Left', 'L_Cheek_Up',
  'L_Ear_Down', 'L_Ear_Left', 'L_Ear_Right', 'L_Ear_Up',
  'Mouth_Down', 'Mouth_Left', 'Mouth_Right', 'Mouth_Up',
  'Nose_Down', 'Nose_Left', 'Nose_Right', 'Nose_Up',
  'R_Brow_Down', 'R_Brow_Left', 'R_Brow_Right', 'R_Brow_Up',
  'R_Cheek_Down', 'R_Cheek_Right', 'R_Cheek_Up',
  'R_Ear_Down', 'R_Ear_Left', 'R_Ear_Right', 'R_Ear_Up',
] as const