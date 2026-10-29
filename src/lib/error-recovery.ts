'use client';

const RELOAD_FLAG_KEY = 'ud_clinic_chunk_reload_at';
const RELOAD_COOLDOWN_MS = 30_000;

/**
 * Detects errors caused by a stale page requesting JS chunks from a
 * previous deploy (or a flaky mobile network dropping a chunk request).
 */
export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const { name, message } = error as { name?: string; message?: string };
  const text = `${name || ''} ${message || ''}`;
  return /ChunkLoadError|Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    text
  );
}

/**
 * True if no fresh-assets reload was attempted recently, so we never loop.
 */
export function canReloadForFreshAssets(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_FLAG_KEY) || 0);
    return Date.now() - last >= RELOAD_COOLDOWN_MS;
  } catch {
    // sessionStorage unavailable (private/in-app browser) - allow one try
    return true;
  }
}

/**
 * Reloads the page to pick up the latest deploy, recording the attempt.
 */
export function reloadForFreshAssets(): void {
  try {
    sessionStorage.setItem(RELOAD_FLAG_KEY, String(Date.now()));
  } catch {}
  window.location.reload();
}
