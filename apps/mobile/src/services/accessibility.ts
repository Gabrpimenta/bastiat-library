import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

let reducedMotion = true;
const listeners = new Set<() => void>();
let nativeListener: { remove(): void } | undefined;
let generation = 0;
function update(value: boolean) {
  if (reducedMotion === value) return;
  reducedMotion = value;
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!nativeListener) {
    const ownGeneration = ++generation;
    nativeListener = AccessibilityInfo.addEventListener('reduceMotionChanged', (enabled) => {
      generation++;
      update(enabled);
    });
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (generation === ownGeneration) update(enabled);
      })
      .catch(() => {});
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      generation++;
      nativeListener?.remove();
      nativeListener = undefined;
    }
  };
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, () => reducedMotion);
}
