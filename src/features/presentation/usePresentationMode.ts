import { create } from 'zustand';

export type FontSize = 'normal' | 'large' | 'xl';
export type PollInterval = 0 | 5000 | 30000 | 60000;

interface PresentationState {
  isPresentation: boolean;
  fontSize: FontSize;
  pollIntervalMs: PollInterval;
  toggle: () => void;
  setFontSize: (size: FontSize) => void;
  setPollInterval: (ms: PollInterval) => void;
}

function applyBodyClass(isPresentation: boolean, fontSize: FontSize) {
  if (isPresentation) {
    document.body.classList.add('presentation-mode');
    document.body.dataset.fontSize = fontSize;
  } else {
    document.body.classList.remove('presentation-mode');
    delete document.body.dataset.fontSize;
  }
}

export const usePresentationMode = create<PresentationState>((set, get) => ({
  isPresentation: false,
  fontSize: 'normal',
  pollIntervalMs: 0,

  toggle: () => {
    const next = !get().isPresentation;
    applyBodyClass(next, get().fontSize);
    set({ isPresentation: next });
  },

  setFontSize: (fontSize) => {
    if (get().isPresentation) {
      document.body.dataset.fontSize = fontSize;
    }
    set({ fontSize });
  },

  setPollInterval: (pollIntervalMs) => {
    set({ pollIntervalMs });
  },
}));
