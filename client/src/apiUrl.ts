/** Same-origin `/api` in Vite dev (proxy) or set `VITE_API_URL` when the API is on another origin. */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
