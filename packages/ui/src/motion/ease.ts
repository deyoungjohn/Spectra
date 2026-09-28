// packages/ui/src/motion/ease.ts
// Shared motion tokens and canonical spring physics from beui / DESIGN.md

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.77, 0, 0.175, 1] as const;
export const EASE_OUT_CSS = "cubic-bezier(0.16, 1, 0.3, 1)";

/** Press feedback on buttons and interactive cards */
export const SPRING_PRESS = {
  type: "spring",
  stiffness: 500,
  damping: 30,
  mass: 0.6,
} as const;

/** Content swaps — transitions inside controls */
export const SPRING_SWAP = {
  type: "spring",
  stiffness: 460,
  damping: 30,
  mass: 0.55,
} as const;

/** Overlay panel entrances — modals and dialogs */
export const SPRING_PANEL = {
  type: "spring",
  stiffness: 420,
  damping: 40,
  mass: 0.5,
} as const;

/** Shared-layout glides — active tab indicators and pills morphing positions */
export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 380,
  damping: 30,
  mass: 0.6,
} as const;

/** Cursor-follow physics for decorative mouse tracking (3D tilt, glare) */
export const SPRING_MOUSE = {
  stiffness: 220,
  damping: 18,
  mass: 0.3,
} as const;
