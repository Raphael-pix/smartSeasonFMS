import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CropStage } from "@/types/api.types";

export interface QueuedUpdate {
  id: string;
  fieldId: string;
  stage: CropStage;
  notes?: string;
  imageUrl?: string;
  observedAt: string;
  retries: number;
  createdAt: string;
}

interface OfflineQueueState {
  queue: QueuedUpdate[];
  addToQueue: (u: Omit<QueuedUpdate, "id" | "retries" | "createdAt">) => void;
  removeFromQueue: (id: string) => void;
  bumpRetry: (id: string) => void;
  clear: () => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set) => ({
      queue: [],
      addToQueue: (u) =>
        set((s) => ({
          queue: [
            ...s.queue,
            {
              ...u,
              id:
                typeof crypto !== "undefined" && "randomUUID" in crypto
                  ? crypto.randomUUID()
                  : `q-${Date.now()}-${Math.random()}`,
              retries: 0,
              createdAt: new Date().toISOString(),
            },
          ],
        })),
      removeFromQueue: (id) =>
        set((s) => ({ queue: s.queue.filter((q) => q.id !== id) })),
      bumpRetry: (id) =>
        set((s) => ({
          queue: s.queue.map((q) =>
            q.id === id ? { ...q, retries: q.retries + 1 } : q,
          ),
        })),
      clear: () => set({ queue: [] }),
    }),
    { name: "smartseason-offline-queue" },
  ),
);
