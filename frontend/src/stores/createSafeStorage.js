import { createJSONStorage } from 'zustand/middleware';

const memoryState = new Map();

const safeStorageAdapter = {
  getItem: (name) => {
    if (typeof window === 'undefined') {
      return memoryState.get(name) ?? null;
    }

    try {
      return window.localStorage.getItem(name);
    } catch {
      return memoryState.get(name) ?? null;
    }
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') {
      memoryState.set(name, value);
      return;
    }

    try {
      window.localStorage.setItem(name, value);
      memoryState.set(name, value);
    } catch {
      memoryState.set(name, value);
    }
  },
  removeItem: (name) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(name);
      } catch {
        // Ignore browser storage failures and clear the in-memory fallback.
      }
    }

    memoryState.delete(name);
  },
};

export const createSafeStorage = () => createJSONStorage(() => safeStorageAdapter);
