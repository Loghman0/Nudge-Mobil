export const LONG_BACKGROUND_MS = 15 * 60 * 1000;

export function shouldReplayOpening(backgroundedAt: number | null, now: number): boolean {
  return backgroundedAt !== null && now - backgroundedAt >= LONG_BACKGROUND_MS;
}
