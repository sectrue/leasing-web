export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
export const AZIENDA_STORAGE_KEY = "leasing_app_azienda_id";

export function buildAuthHeaders(
  token?: string | null,
  aziendaId?: number | string | null,
  extra?: HeadersInit
) {
  const headers = new Headers(extra || undefined);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (aziendaId) headers.set("X-Azienda-Id", String(aziendaId));
  return headers;
}
