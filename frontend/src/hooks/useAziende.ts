import { useEffect, useState } from "react";
import { API_URL, AZIENDA_STORAGE_KEY, buildAuthHeaders } from "../lib/api";
import type { Azienda } from "../types";

type UseAziendeParams = {
  token: string | null;
};

export function useAziende({ token }: UseAziendeParams) {
  const [items, setItems] = useState<Azienda[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aziendaId, setAziendaId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    load();
  }, [token]);

  useEffect(() => {
    if (!aziendaId) return;
    try {
      localStorage.setItem(AZIENDA_STORAGE_KEY, String(aziendaId));
    } catch {
      // ignore storage errors
    }
  }, [aziendaId]);

  async function load() {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/aziende`, {
        headers: buildAuthHeaders(token)
      });
      if (!res.ok) throw new Error();
      const rows: Azienda[] = await res.json();
      setItems(rows);

      let storedId: number | null = null;
      try {
        const raw = localStorage.getItem(AZIENDA_STORAGE_KEY);
        if (raw) storedId = Number(raw);
      } catch {
        // ignore
      }

      const validStored = storedId && rows.some((r) => r.id === storedId);
      if (validStored) {
        setAziendaId(storedId as number);
      } else if (rows.length > 0) {
        setAziendaId(rows[0].id);
      } else {
        setAziendaId(null);
      }
    } catch {
      setError("Errore caricamento aziende");
    } finally {
      setLoading(false);
    }
  }

  return {
    items,
    loading,
    error,
    aziendaId,
    setAziendaId,
    refresh: load
  };
}
