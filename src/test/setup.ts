import '@testing-library/jest-dom/vitest';

// Node-backed jsdom builds expose window.localStorage only when the process
// runs with the experimental --localstorage-file flag. Provide a deterministic
// in-memory replacement so persistence tests run on any environment.
if (typeof window.localStorage === 'undefined') {
  const store = new Map<string, string>();
  const memoryStorage: Storage = {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key) => (store.has(key) ? store.get(key)! : null),
    key: (index) => Array.from(store.keys())[index] ?? null,
    removeItem: (key) => {
      store.delete(key);
    },
    setItem: (key, value) => {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(window, 'localStorage', {
    value: memoryStorage,
    configurable: true,
  });
}
