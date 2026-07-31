import { create } from 'zustand';
import { useQueryStore } from '../../store/queryStore';

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  avatarInitials: string;
  cursor: { x: number; y: number } | null;
  selectedNodeId: string | null;
  lastActiveAt: string;
  isBot?: boolean;
}

interface PresenceState {
  collaborators: Collaborator[];
  localUser: Collaborator;
  updateCursor: (x: number, y: number) => void;
  setSelection: (nodeId: string | null) => void;
  addCollaborator: (collaborator: Collaborator) => void;
  removeCollaborator: (id: string) => void;
  destroy: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FAKE_NAMES = ['Ada L.', 'Grace H.', 'Alan T.'];
const CHANNEL_NAME = 'mosaic-presence';
const SITE_ID_KEY = 'mosaic-presence-site-id';
const THROTTLE_MS = 50;

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function colorForSeed(seed: number): string {
  const hue = Math.round((seed * 137.508) % 360);
  return `hsl(${hue}, 72%, 62%)`;
}

function initialsFor(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function getLocalSiteId(): string {
  try {
    let id = sessionStorage.getItem(SITE_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SITE_ID_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function makeBot(name: string, index: number): Collaborator {
  return {
    id: `bot-${index}-${hashString(name)}`,
    name,
    color: colorForSeed(hashString(name)),
    avatarInitials: initialsFor(name),
    cursor: { x: 200 + index * 220, y: 160 + index * 90 },
    selectedNodeId: null,
    lastActiveAt: new Date().toISOString(),
    isBot: true,
  };
}

type PresenceMessage =
  | { type: 'cursor'; id: string; name: string; color: string; avatarInitials: string; x: number; y: number }
  | { type: 'selection'; id: string; nodeId: string | null }
  | { type: 'leave'; id: string };

const localSiteId = getLocalSiteId();

const localUserSeed: Collaborator = {
  id: localSiteId,
  name: 'You',
  color: colorForSeed(hashString(localSiteId)),
  avatarInitials: 'Y',
  cursor: null,
  selectedNodeId: null,
  lastActiveAt: new Date().toISOString(),
};

let channel: BroadcastChannel | null = null;
let lastBroadcastAt = 0;
let jitterInterval: ReturnType<typeof setInterval> | null = null;

export const usePresenceStore = create<PresenceState>((set, get) => ({
  collaborators: FAKE_NAMES.map((name, index) => makeBot(name, index)),
  localUser: localUserSeed,

  updateCursor: (x, y) => {
    set((state) => ({ localUser: { ...state.localUser, cursor: { x, y }, lastActiveAt: new Date().toISOString() } }));

    const now = Date.now();
    if (channel && now - lastBroadcastAt >= THROTTLE_MS) {
      lastBroadcastAt = now;
      const { localUser } = get();
      const message: PresenceMessage = {
        type: 'cursor',
        id: localUser.id,
        name: localUser.name,
        color: localUser.color,
        avatarInitials: localUser.avatarInitials,
        x,
        y,
      };
      channel.postMessage(message);
    }
  },

  setSelection: (nodeId) => {
    set((state) => ({ localUser: { ...state.localUser, selectedNodeId: nodeId } }));
    channel?.postMessage({ type: 'selection', id: get().localUser.id, nodeId } satisfies PresenceMessage);
  },

  addCollaborator: (collaborator) =>
    set((state) => ({
      collaborators: state.collaborators.some((c) => c.id === collaborator.id)
        ? state.collaborators.map((c) => (c.id === collaborator.id ? collaborator : c))
        : [...state.collaborators, collaborator],
    })),

  removeCollaborator: (id) =>
    set((state) => ({ collaborators: state.collaborators.filter((c) => c.id !== id) })),

  destroy: () => {
    if (jitterInterval) {
      clearInterval(jitterInterval);
      jitterInterval = null;
    }
    channel?.close();
    channel = null;
  },
}));

// ---------------------------------------------------------------------------
// Bot jitter simulation — every 2s move fake collaborators & change selection
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined' && !jitterInterval) {
  jitterInterval = setInterval(() => {
    const nodes = useQueryStore.getState().nodes;
    usePresenceStore.setState((state) => ({
      collaborators: state.collaborators.map((collaborator) => {
        if (!collaborator.isBot) return collaborator;
        const shouldMove = Math.random() > 0.2;
        const shouldSelect = Math.random() > 0.6 && nodes.length > 0;
        return {
          ...collaborator,
          cursor: shouldMove
            ? {
                x: Math.max(40, Math.min(1600, (collaborator.cursor?.x ?? 400) + (Math.random() - 0.5) * 260)),
                y: Math.max(40, Math.min(900, (collaborator.cursor?.y ?? 300) + (Math.random() - 0.5) * 200)),
              }
            : collaborator.cursor,
          selectedNodeId: shouldSelect
            ? nodes[Math.floor(Math.random() * nodes.length)]?.id ?? collaborator.selectedNodeId
            : collaborator.selectedNodeId,
          lastActiveAt: new Date().toISOString(),
        };
      }),
    }));
  }, 2000);
}

// ---------------------------------------------------------------------------
// Cross-tab BroadcastChannel wiring — real collaborators from other tabs
// ---------------------------------------------------------------------------

if (typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined' && !channel) {
  channel = new BroadcastChannel(CHANNEL_NAME);

  channel.onmessage = (event: MessageEvent<PresenceMessage>) => {
    const message = event.data;
    if (!message || message.id === localSiteId) return;

    if (message.type === 'cursor') {
      const existing = usePresenceStore.getState().collaborators.find((c) => c.id === message.id);
      usePresenceStore.getState().addCollaborator({
        id: message.id,
        name: message.name,
        color: message.color,
        avatarInitials: message.avatarInitials,
        cursor: { x: message.x, y: message.y },
        selectedNodeId: existing?.selectedNodeId ?? null,
        lastActiveAt: new Date().toISOString(),
      });
    } else if (message.type === 'selection') {
      usePresenceStore.setState((state) => ({
        collaborators: state.collaborators.map((c) =>
          c.id === message.id ? { ...c, selectedNodeId: message.nodeId, lastActiveAt: new Date().toISOString() } : c,
        ),
      }));
    } else if (message.type === 'leave') {
      usePresenceStore.getState().removeCollaborator(message.id);
    }
  };

  window.addEventListener('beforeunload', () => {
    channel?.postMessage({ type: 'leave', id: localSiteId } satisfies PresenceMessage);
  });
}
