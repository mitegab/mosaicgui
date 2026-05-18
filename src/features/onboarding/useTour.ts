import { create } from 'zustand';
import { TOUR_STEPS } from './tourSteps';

const STORAGE_KEY = 'mosaic-tour-completed';

interface TourState {
  isActive: boolean;
  currentStep: number;
  hasCompleted: boolean;
  start: () => void;
  next: () => void;
  prev: () => void;
  skip: () => void;
  complete: () => void;
}

function loadCompleted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveCompleted(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // ignore storage errors
  }
}

export const useTour = create<TourState>((set, get) => ({
  isActive: false,
  currentStep: 0,
  hasCompleted: loadCompleted(),

  start: () => set({ isActive: true, currentStep: 0 }),

  next: () => {
    const { currentStep } = get();
    const lastIndex = TOUR_STEPS.length - 1;
    if (currentStep >= lastIndex) {
      get().complete();
    } else {
      set({ currentStep: currentStep + 1 });
    }
  },

  prev: () => {
    const { currentStep } = get();
    if (currentStep > 0) {
      set({ currentStep: currentStep - 1 });
    }
  },

  skip: () => {
    set({ isActive: false });
    // Do not mark as completed on skip — allow restarting
  },

  complete: () => {
    saveCompleted(true);
    set({ isActive: false, hasCompleted: true });
  },
}));
