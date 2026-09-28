import { useEffect, useRef } from 'react';

// Lets the phone's back button (or back swipe) close the top-most sheet or screen instead of
// leaving the app. Every open layer is backed by one history entry tagged with its depth.
// History is synced once after each render, so closing one layer and opening another in the same
// update (e.g. a sheet that opens a screen) reuses the entry instead of racing history.go().

interface Layer {
  close: () => void;
}

const layers: Layer[] = [];
/** Depth of the current history entry, as far as this module knows. */
let currentDepth = 0;
let syncScheduled = false;
let listening = false;

function syncHistory() {
  syncScheduled = false;
  const target = layers.length;
  while (currentDepth < target) {
    currentDepth++;
    window.history.pushState({ layerDepth: currentDepth }, '');
  }
  if (currentDepth > target) {
    window.history.go(target - currentDepth);
    currentDepth = target;
  }
}

function scheduleSync() {
  if (syncScheduled) return;
  syncScheduled = true;
  queueMicrotask(syncHistory);
}

function handlePopState(event: PopStateEvent) {
  const depth = event.state?.layerDepth;
  currentDepth = typeof depth === 'number' ? depth : 0;
  while (layers.length > currentDepth) {
    layers.pop()?.close();
  }
}

export function useBackClose(open: boolean, onClose: () => void) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    if (!listening) {
      window.addEventListener('popstate', handlePopState);
      listening = true;
      // After a reload nothing is open, whatever the restored entry says.
      if (window.history.state?.layerDepth) window.history.replaceState({ layerDepth: 0 }, '');
    }

    const layer: Layer = { close: () => closeRef.current() };
    layers.push(layer);
    scheduleSync();

    return () => {
      const index = layers.indexOf(layer);
      if (index === -1) return; // Already closed by the back button.
      layers.splice(index, 1);
      scheduleSync();
    };
  }, [open]);
}
