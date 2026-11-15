export type OfflineUpdate = { activate: () => void };

/** Registers the local app shell and exposes waiting updates for user approval. */
export function registerOfflineApp(onUpdate: (update: OfflineUpdate) => void): () => void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return () => undefined;
  let disposed = false;
  let registration: ServiceWorkerRegistration | null = null;
  const announce = () => {
    if (disposed || !registration?.waiting) return;
    onUpdate({ activate: () => {
      const waiting = registration?.waiting;
      if (!waiting) return;
      navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
      waiting.postMessage({ type: 'SKIP_WAITING' });
    } });
  };
  void navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(reg => {
    if (disposed) return;
    registration = reg;
    void reg.update().catch(() => undefined);
    if (reg.waiting && navigator.serviceWorker.controller) announce();
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed') {
          if (navigator.serviceWorker.controller) announce();
          else worker.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    });
  }).catch(() => undefined);
  return () => { disposed = true; };
}
