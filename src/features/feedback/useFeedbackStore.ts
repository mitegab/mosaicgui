import { create } from 'zustand';

// ─── Types ─────────────────────────────────────────────────────────────────

export type FeedbackType = 'bug' | 'idea' | 'praise' | 'other';

export interface Annotation {
  id: string;
  type: 'rect' | 'arrow' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color: string;
}

export interface FeedbackSubmission {
  id: string;
  type: FeedbackType;
  message: string;
  screenshotDataUrl: string | null;
  annotations: Annotation[];
  pageUrl: string;
  createdAt: string;
  browserInfo: string;
}

export interface NewFeedbackInput {
  type: FeedbackType;
  message: string;
  screenshotDataUrl: string | null;
  annotations: Annotation[];
}

// ─── Store ───────────────────────────────────────────────────────────────────

interface FeedbackState {
  submissions: FeedbackSubmission[];
  isWidgetOpen: boolean;
  openWidget: () => void;
  closeWidget: () => void;
  submit: (feedback: NewFeedbackInput) => void;
}

export const useFeedbackStore = create<FeedbackState>((set) => ({
  submissions: [],
  isWidgetOpen: false,

  openWidget: () => set({ isWidgetOpen: true }),
  closeWidget: () => set({ isWidgetOpen: false }),

  submit: (feedback) =>
    set((state) => {
      const submission: FeedbackSubmission = {
        id: crypto.randomUUID(),
        type: feedback.type,
        message: feedback.message,
        screenshotDataUrl: feedback.screenshotDataUrl,
        annotations: feedback.annotations,
        pageUrl: typeof window !== 'undefined' ? window.location.href : '',
        createdAt: new Date().toISOString(),
        browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      };
      return { submissions: [submission, ...state.submissions].slice(0, 50) };
    }),
}));
