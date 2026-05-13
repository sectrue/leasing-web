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
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editPlafond, setEditPlafond] = useState("");
  const [editUtilizzatoPregresso, setEditUtilizzatoPregresso] = useState("");
  const [newNome, setNewNome] = useState("");
  const [newPlafond, setNewPlafond] = useState("");
  const [newUtilizzatoPregresso, setNewUtilizzatoPregresso] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  async function load(preferredAziendaId?: number | null) {
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

      const preferredId =
        preferredAziendaId && rows.some((r) => r.id === preferredAziendaId)
          ? preferredAziendaId
          : null;
      const validStored = storedId && rows.some((r) => r.id === storedId);
      if (preferredId) {
        setAziendaId(preferredId);
      } else if (validStored) {
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

  function startEdit(item: Azienda) {
    setEditingId(item.id);
    setEditNome(item.nome || "");
    setEditPlafond(item.plafond != null ? String(item.plafond) : "");
    setEditUtilizzatoPregresso(item.utilizzato_pregresso != null ? String(item.utilizzato_pregresso) : "");
    setSaveError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNome("");
    setEditPlafond("");
    setEditUtilizzatoPregresso("");
    setSaveError(null);
  }

  async function createItem(nomeOverride?: string) {
    if (!token) return false;
    const nomeSource = typeof nomeOverride === "string" ? nomeOverride : newNome;
    const nome = nomeSource.trim();
    if (!nome) {
      setCreateError("Nome azienda obbligatorio");
      return false;
    }

    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(`${API_URL}/aziende`, {
        method: "POST",
        headers: buildAuthHeaders(token, null, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          nome,
          plafond: newPlafond.trim() || 0,
          utilizzato_pregresso: newUtilizzatoPregresso.trim() || 0
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore creazione azienda");
      }
      const created: Azienda = await res.json();
      if (typeof nomeOverride !== "string") {
        setNewNome("");
        setNewPlafond("");
        setNewUtilizzatoPregresso("");
      }
      await load(created.id);
      return true;
    } catch (e: any) {
      setCreateError(e?.message || "Errore creazione azienda");
      return false;
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit() {
    if (!token || !editingId) return;
    const nome = editNome.trim();
    if (!nome) {
      setSaveError("Nome azienda obbligatorio");
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${API_URL}/aziende/${editingId}`, {
        method: "PUT",
        headers: buildAuthHeaders(token, null, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          nome,
          plafond: editPlafond.trim() || 0,
          utilizzato_pregresso: editUtilizzatoPregresso.trim() || 0
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore salvataggio azienda");
      }
      await load();
      cancelEdit();
    } catch (e: any) {
      setSaveError(e?.message || "Errore salvataggio azienda");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: Azienda) {
    if (!token) return false;
    const confirmed = window.confirm(
      `Eliminare l'azienda "${item.nome}" (ID ${item.id})?\nConsentito solo se non ha pratiche/mezzi/dati collegati.`
    );
    if (!confirmed) return false;

    setDeletingId(item.id);
    setDeleteError(null);
    try {
      const res = await fetch(`${API_URL}/aziende/${item.id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore eliminazione azienda");
      }
      if (editingId === item.id) cancelEdit();
      await load(aziendaId === item.id ? null : aziendaId);
      return true;
    } catch (e: any) {
      setDeleteError(e?.message || "Errore eliminazione azienda");
      return false;
    } finally {
      setDeletingId(null);
    }
  }

  return {
    items,
    loading,
    error,
    aziendaId,
    setAziendaId,
    refresh: load,
    editingId,
    editNome,
    editPlafond,
    editUtilizzatoPregresso,
    newNome,
    newPlafond,
    newUtilizzatoPregresso,
    createError,
    creating,
    setEditNome,
    setEditPlafond,
    setEditUtilizzatoPregresso,
    setNewNome,
    setNewPlafond,
    setNewUtilizzatoPregresso,
    saveError,
    saving,
    deleteError,
    deletingId,
    createItem,
    deleteItem,
    startEdit,
    cancelEdit,
    saveEdit
  };
}
