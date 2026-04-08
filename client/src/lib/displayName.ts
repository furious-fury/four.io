/** Match server `normalizeName` in [server/src/index.ts](server/src/index.ts). */
export function normalizeDisplayName(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export const LAST_SUBMITTED_NAME_KEY = "four.io:lastSubmittedName";
