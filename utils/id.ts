const randomSegment = () => Math.random().toString(16).slice(2, 10);

export const generateId = (): string => {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  return `id-${randomSegment()}${randomSegment()}${Date.now().toString(16)}`;
};
