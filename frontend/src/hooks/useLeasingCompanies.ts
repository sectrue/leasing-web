import { useEffect, useState } from "react";
import { API_URL, buildAuthHeaders } from "../lib/api";
import type { LeasingCompany } from "../types";

type UseLeasingCompaniesParams = {
  token: string | null;
  active: boolean;
  aziendaId: number | null;
};

type LeasingCompanyForm = {
  nome: string;
  referente: string;
  telefono: string;
  email: string;
  note: string;
};

function emptyForm(): LeasingCompanyForm {
  return {
    nome: "",
    referente: "",
    telefono: "",
    email: "",
    note: ""
  };
}

export function useLeasingCompanies({ token, active, aziendaId }: UseLeasingCompaniesParams) {
  const [items, setItems] = useState<LeasingCompany[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<LeasingCompanyForm>(emptyForm());

  useEffect(() => {
    if (!token || !active || !aziendaId) return;
    load();
  }, [token, active, aziendaId]);

  async function load() {
    if (!token || !aziendaId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/societa-leasing`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const rows: LeasingCompany[] = await res.json();
      setItems(rows);
    } catch {
      setError("Errore caricamento societa leasing");
    } finally {
      setLoading(false);
    }
  }

  function newItem() {
    setEditingId(null);
    setForm(emptyForm());
  }

  function editItem(item: LeasingCompany) {
    setEditingId(item.id);
    setForm({
      nome: item.nome || "",
      referente: item.referente || "",
      telefono: item.telefono || "",
      email: item.email || "",
      note: item.note || ""
    });
  }

  async function save() {
    if (!token || !aziendaId) return;
    if (!form.nome.trim()) {
      setError("Nome societa obbligatorio");
      return;
    }
    setError(null);
    try {
      const res = await fetch(
        editingId ? `${API_URL}/societa-leasing/${editingId}` : `${API_URL}/societa-leasing`,
        {
          method: editingId ? "PUT" : "POST",
          headers: buildAuthHeaders(token, aziendaId, {
            "Content-Type": "application/json"
          }),
          body: JSON.stringify({
            nome: form.nome,
            referente: form.referente || null,
            telefono: form.telefono || null,
            email: form.email || null,
            note: form.note || null
          })
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore salvataggio societa");
      }
      await load();
      newItem();
    } catch (e: any) {
      setError(e.message || "Errore salvataggio societa");
    }
  }

  async function remove(id: number) {
    if (!token || !aziendaId) return;
    if (!window.confirm("Eliminare questa societa leasing?")) return;
    setError(null);
    try {
      const res = await fetch(`${API_URL}/societa-leasing/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore eliminazione societa");
      }
      await load();
      if (editingId === id) newItem();
    } catch (e: any) {
      setError(e.message || "Errore eliminazione societa");
    }
  }

  return {
    items,
    loading,
    error,
    editingId,
    form,
    setForm,
    load,
    newItem,
    editItem,
    save,
    remove
  };
}
