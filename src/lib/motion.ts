import { useReducedMotion } from 'motion/react';

// Damped Liquid Obsidian Motion System
export const obsidianMotion = {
  // Standard spring: Overdamped settling, liquid feel, no playful bouncing
  spring: {
    type: "spring",
    mass: 1.2,
    damping: 30,
    stiffness: 200,
    restDelta: 0.001,
    restSpeed: 0.001,
  },
  
  // Heavier mass for larger panels/modals
  heavySpring: {
    type: "spring",
    mass: 1.5,
    damping: 35,
    stiffness: 150,
    restDelta: 0.001,
    restSpeed: 0.001,
  },

  // Snappier for smaller elements like composer focus
  snappySpring: {
    type: "spring",
    mass: 0.8,
    damping: 25,
    stiffness: 300,
    restDelta: 0.001,
    restSpeed: 0.001,
  },

  // Fallback for reduced motion preference
  reduced: {
    type: "tween",
    duration: 0.2,
    ease: "easeInOut",
  }
};

export function getMotion(type: 'standard' | 'heavy' | 'snappy' = 'standard', reducedMotion: boolean | null = false): any {
  if (reducedMotion) return obsidianMotion.reduced;
  switch (type) {
    case 'heavy': return obsidianMotion.heavySpring;
    case 'snappy': return obsidianMotion.snappySpring;
    case 'standard':
    default: 
      return obsidianMotion.spring;
  }
}
