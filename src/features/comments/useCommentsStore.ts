import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CommentMessage {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  reactions: Record<string, number>;
}

export interface CommentThread {
  id: string;
  nodeId: string;
  resolved: boolean;
  messages: CommentMessage[];
}

interface CommentsState {
  threads: CommentThread[];
  addThread: (nodeId: string, text: string, author: string) => string;
  addReply: (threadId: string, text: string, author: string) => void;
  toggleReaction: (threadId: string, messageId: string, emoji: string) => void;
  resolveThread: (threadId: string) => void;
  reopenThread: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
}

function makeMessage(text: string, author: string): CommentMessage {
  return {
    id: crypto.randomUUID(),
    author,
    text,
    createdAt: new Date().toISOString(),
    reactions: {},
  };
}

export const useCommentsStore = create<CommentsState>()(
  persist(
    (set) => ({
      threads: [],

      addThread: (nodeId, text, author) => {
        const id = crypto.randomUUID();
        set((state) => ({
          threads: [...state.threads, { id, nodeId, resolved: false, messages: [makeMessage(text, author)] }],
        }));
        return id;
      },

      addReply: (threadId, text, author) =>
        set((state) => ({
          threads: state.threads.map((thread) =>
            thread.id === threadId ? { ...thread, messages: [...thread.messages, makeMessage(text, author)] } : thread,
          ),
        })),

      toggleReaction: (threadId, messageId, emoji) =>
        set((state) => ({
          threads: state.threads.map((thread) => {
            if (thread.id !== threadId) return thread;
            return {
              ...thread,
              messages: thread.messages.map((message) => {
                if (message.id !== messageId) return message;
                const count = message.reactions[emoji] ?? 0;
                return { ...message, reactions: { ...message.reactions, [emoji]: count + 1 } };
              }),
            };
          }),
        })),

      resolveThread: (threadId) =>
        set((state) => ({
          threads: state.threads.map((thread) => (thread.id === threadId ? { ...thread, resolved: true } : thread)),
        })),

      reopenThread: (threadId) =>
        set((state) => ({
          threads: state.threads.map((thread) => (thread.id === threadId ? { ...thread, resolved: false } : thread)),
        })),

      deleteThread: (threadId) =>
        set((state) => ({ threads: state.threads.filter((thread) => thread.id !== threadId) })),
    }),
    { name: 'mosaic-comments' },
  ),
);
