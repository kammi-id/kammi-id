import { atom } from 'nanostores'

// Currently visible narrative phase: -1 = hero, 0 = Visi, …, 4 = Kredo
export const $tentangPhase = atom<number>(-1)

// Absolute scroll-Y positions for each phase start, populated by TentangScene
// after GSAP + ScrollTrigger have resolved their pixel coordinates.
export const $tentangPhaseScrollY = atom<number[]>([])
