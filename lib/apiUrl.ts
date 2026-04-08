/** Same-origin `/api` or `NEXT_PUBLIC_API_BASE` if the UI is hosted separately. */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
