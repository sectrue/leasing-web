import { useEffect, useMemo, useState } from "react";
import { API_URL, buildAuthHeaders } from "../lib/api";
import type { MezzoRow, MezziResponse } from "../types";

type UseMezziParams = {
  token: string | null;
  onPraticheChanged: () => void;
  active: boolean;
  aziendaId: number | null;
};

export function useMezzi({ token, onPraticheChanged, active, aziendaId }: UseMezziParams) {
  const [mezziOpen, setMezziOpen] = useState(false);
  const [mezziLoading, setMezziLoading] = useState(false);
  const [mezziError, setMezziError] = useState<string | null>(null);
  const [mezzi, setMezzi] = useState<MezzoRow[]>([]);
  const [mezziPraticaId, setMezziPraticaId] = useState<number | null>(null);
  const [mezziPraticaLabel, setMezziPraticaLabel] = useState<string>("");

  const [mezzoFormOpen, setMezzoFormOpen] = useState(false);
  const [mezzoFormMode, setMezzoFormMode] = useState<"new" | "edit">("new");
  const [mezzoFormId, setMezzoFormId] = useState<number | null>(null);
  const [mezzoFormError, setMezzoFormError] = useState<string | null>(null);
  const [mezzoForm, setMezzoForm] = useState({
    numero_interno: "",
    mezzo: "",
    fornitore: "",
    descrizione_bene: "",
    allestimento: "",
    importo_mezzo: "",
    importo_allestimento_materiale: "",
    importo_pratica_40: "",
    note: ""
  });

  const [mezziPage, setMezziPage] = useState(1);
  const [mezziPageSize, setMezziPageSize] = useState(20);
  const [mezziTotalRows, setMezziTotalRows] = useState(0);
  const [mezziList, setMezziList] = useState<MezzoRow[]>([]);
  const [mezziListLoading, setMezziListLoading] = useState(false);
  const [mezziListError, setMezziListError] = useState<string | null>(null);
  const [mezziSearch, setMezziSearch] = useState("");
  const [mezziPraticaFilter, setMezziPraticaFilter] = useState<string>("");

  useEffect(() => {
    if (!token || !active || !aziendaId) return;
    loadMezziList();
  }, [token, active, aziendaId, mezziPage, mezziPageSize]);

  useEffect(() => {
    if (!token || !active || !aziendaId) return;
    const handle = setTimeout(() => {
      setMezziPage(1);
      loadMezziList(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [mezziSearch, mezziPraticaFilter, token, active, aziendaId]);

  async function loadMezziList(forcedPage?: number) {
    if (!token || !aziendaId) return;
    setMezziListLoading(true);
    setMezziListError(null);

    const params = new URLSearchParams();
    params.set("page", String(forcedPage || mezziPage));
    params.set("pageSize", String(mezziPageSize));
    if (mezziSearch.trim()) params.set("q", mezziSearch.trim());
    if (mezziPraticaFilter) params.set("praticaId", mezziPraticaFilter);

    try {
      const res = await fetch(`${API_URL}/mezzi?${params.toString()}`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const payload: MezziResponse = await res.json();
      setMezziList(payload.items);
      setMezziTotalRows(payload.total || 0);
    } catch {
      setMezziListError("Errore nel caricamento mezzi");
    } finally {
      setMezziListLoading(false);
    }
  }

  async function loadMezzi(praticaId: number, praticaLabel: string) {
    if (!token || !aziendaId) return;
    setMezziOpen(true);
    setMezziPraticaId(praticaId);
    setMezziPraticaLabel(praticaLabel);
    setMezziLoading(true);
    setMezziError(null);

    try {
      const res = await fetch(`${API_URL}/pratiche/${praticaId}/mezzi`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMezzi(data);
    } catch {
      setMezziError("Errore nel caricamento mezzi");
    } finally {
      setMezziLoading(false);
    }
  }

  function openMezzoForm() {
    setMezzoFormMode("new");
    setMezzoFormId(null);
    setMezzoFormError(null);
    setMezzoForm({
      numero_interno: "",
      mezzo: "",
      fornitore: "",
      descrizione_bene: "",
      allestimento: "",
      importo_mezzo: "",
      importo_allestimento_materiale: "",
      importo_pratica_40: "",
      note: ""
    });
    setMezzoFormOpen(true);
  }

  function openMezzoFormWithPratica(praticaId: number | null) {
    setMezziPraticaId(praticaId);
    openMezzoForm();
  }

  function closeMezzoForm() {
    setMezzoFormOpen(false);
    setMezzoFormError(null);
  }

  async function openEditMezzo(mezzoId: number) {
    if (!token || !aziendaId) return;
    setMezzoFormMode("edit");
    setMezzoFormId(mezzoId);
    setMezzoFormOpen(true);
    setMezzoFormError(null);

    try {
      const res = await fetch(`${API_URL}/mezzi/${mezzoId}`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMezziPraticaId(data.pratica_id ?? null);
      setMezzoForm({
        numero_interno: data.numero_interno || "",
        mezzo: data.mezzo || "",
        fornitore: data.fornitore || "",
        descrizione_bene: data.descrizione_bene || "",
        allestimento: data.allestimento || "",
        importo_mezzo: data.importo_mezzo ? String(data.importo_mezzo) : data.importo ? String(data.importo) : "",
        importo_allestimento_materiale: data.importo_allestimento_materiale ? String(data.importo_allestimento_materiale) : "",
        importo_pratica_40: data.importo_pratica_40 || data.pratica_40 || "",
        note: data.note || ""
      });
    } catch {
      setMezzoFormError("Errore nel caricamento mezzo");
    }
  }

  async function saveMezzo() {
    if (!token || !aziendaId) return;
    if (mezzoFormMode === "new" && !mezziPraticaId) {
      setMezzoFormError("Seleziona una pratica per creare il mezzo.");
      return;
    }
    setMezzoFormError(null);

    try {
      const url = mezzoFormMode === "new"
        ? `${API_URL}/pratiche/${mezziPraticaId}/mezzi`
        : `${API_URL}/mezzi/${mezzoFormId}`;
      const method = mezzoFormMode === "new" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: buildAuthHeaders(token, aziendaId, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          ...mezzoForm,
          // Compatibility payload for endpoints/instances still expecting legacy names.
          importo: mezzoForm.importo_mezzo,
          pratica_40: mezzoForm.importo_pratica_40,
          pratica_id: mezziPraticaId
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore salvataggio mezzo");
      }
      setMezzoFormOpen(false);
      setMezzoFormMode("new");
      setMezzoFormId(null);
      if (mezziPraticaId !== null) {
        await loadMezzi(mezziPraticaId, mezziPraticaLabel);
      }
      onPraticheChanged();
    } catch (e: any) {
      setMezzoFormError(e.message || "Errore salvataggio mezzo");
    }
  }

  async function deleteMezzo(mezzoId: number) {
    if (!token || !aziendaId) return;
    const ok = window.confirm("Vuoi eliminare il mezzo?");
    if (!ok) return;
    try {
      const res = await fetch(`${API_URL}/mezzi/${mezzoId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore eliminazione mezzo");
      }
      if (mezziPraticaId) {
        await loadMezzi(mezziPraticaId, mezziPraticaLabel);
      }
      await loadMezziList();
      onPraticheChanged();
    } catch (e: any) {
      setMezziError(e.message || "Errore eliminazione mezzo");
    }
  }

  const mezziTotalPages = useMemo(
    () => Math.max(1, Math.ceil(mezziTotalRows / mezziPageSize)),
    [mezziTotalRows, mezziPageSize]
  );

  return {
    mezziOpen,
    setMezziOpen,
    mezziLoading,
    mezziError,
    mezzi,
    mezziPraticaLabel,
    mezziPraticaId,
    mezzoFormOpen,
    mezzoFormMode,
    mezzoFormError,
    mezzoForm,
    mezziPraticaFilter,
    mezziSearch,
    mezziList,
    mezziListLoading,
    mezziListError,
    mezziPage,
    mezziPageSize,
    mezziTotalPages,
    setMezziPage,
    setMezziPageSize,
    setMezziSearch,
    setMezziPraticaFilter,
    openMezzoForm,
    openMezzoFormWithPratica,
    closeMezzoForm,
    openEditMezzo,
    saveMezzo,
    deleteMezzo,
    loadMezzi,
    loadMezziList,
    setMezziPraticaId,
    setMezzoForm
  };
}
