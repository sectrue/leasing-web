import { useEffect, useState } from "react";
import { API_URL, buildAuthHeaders } from "../lib/api";
import type {
  PraticaAttachment,
  PraticaFormState,
  SabatiniErogazione,
  SabatiniEvento
} from "../types";

type UsePraticaFormParams = {
  token: string | null;
  onSaved: () => void;
  aziendaId: number | null;
};

type SabatiniErogazioneForm = {
  numero_rata: string;
  importo: string;
  data_pagata: string;
  note: string;
};

type SabatiniEventoForm = {
  data_evento: string;
  tipo: string;
  descrizione: string;
};

function emptyPraticaForm(): PraticaFormState {
  return {
    leasing: "",
    societa_leasing_id: "",
    broker: "",
    nr_pratica: "",
    nr_ctr: "",
    data_inizio: "",
    data_fine: "",
    durata: "",
    importo_rata: "",
    importo_anticipo: "",
    importo_riscatto: "",
    sabatini: false,
    importo_sabatini: "",
    sabatini_data: "",
    sabatini_stato: "",
    protocollo_domanda: "",
    data_domanda: "",
    cup: "",
    decreto_numero: "",
    decreto_data: "",
    note_sabatini: ""
  };
}

function emptyErogazioneForm(): SabatiniErogazioneForm {
  return {
    numero_rata: "",
    importo: "",
    data_pagata: "",
    note: ""
  };
}

function emptyEventoForm(): SabatiniEventoForm {
  return {
    data_evento: "",
    tipo: "invio_domanda",
    descrizione: ""
  };
}

function hasText(v: string) {
  return v.trim().length > 0;
}

function hasDate(v: string) {
  return !!v && !Number.isNaN(new Date(v).getTime());
}

function parseMaybeNum(v: string) {
  if (!v || !v.trim()) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export function usePraticaForm({ token, onSaved, aziendaId }: UsePraticaFormParams) {
  const [praticaFormOpen, setPraticaFormOpen] = useState(false);
  const [praticaFormMode, setPraticaFormMode] = useState<"new" | "edit">("new");
  const [praticaFormId, setPraticaFormId] = useState<number | null>(null);
  const [praticaFormError, setPraticaFormError] = useState<string | null>(null);
  const [praticaAttachments, setPraticaAttachments] = useState<PraticaAttachment[]>([]);
  const [praticaAttachmentsError, setPraticaAttachmentsError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [attachmentPreviews, setAttachmentPreviews] = useState<Record<number, string>>({});

  const [sabatiniErogazioni, setSabatiniErogazioni] = useState<SabatiniErogazione[]>([]);
  const [sabatiniEventi, setSabatiniEventi] = useState<SabatiniEvento[]>([]);
  const [sabatiniError, setSabatiniError] = useState<string | null>(null);
  const [erogazioneForm, setErogazioneForm] = useState<SabatiniErogazioneForm>(emptyErogazioneForm());
  const [eventoForm, setEventoForm] = useState<SabatiniEventoForm>(emptyEventoForm());

  const [praticaForm, setPraticaForm] = useState<PraticaFormState>(emptyPraticaForm());

  useEffect(() => {
    let cancelled = false;
    const previousUrls = Object.values(attachmentPreviews);

    async function loadPreviews() {
      if (!token || !aziendaId || praticaAttachments.length === 0) {
        if (!cancelled) setAttachmentPreviews({});
        return;
      }

      const next: Record<number, string> = {};
      for (const att of praticaAttachments) {
        if (!att.original_name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) continue;
        try {
          const res = await fetch(`${API_URL}/pratiche/attachments/${att.id}/download`, {
            headers: buildAuthHeaders(token, aziendaId)
          });
          if (!res.ok) continue;
          const blob = await res.blob();
          next[att.id] = URL.createObjectURL(blob);
        } catch {
          // ignore preview errors
        }
      }
      if (!cancelled) {
        previousUrls.forEach((url) => URL.revokeObjectURL(url));
        setAttachmentPreviews(next);
      } else {
        Object.values(next).forEach((url) => URL.revokeObjectURL(url));
      }
    }

    loadPreviews();
    return () => {
      cancelled = true;
      previousUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [praticaAttachments, token, aziendaId]);

  function resetPraticaForm() {
    setPraticaForm(emptyPraticaForm());
    setSabatiniErogazioni([]);
    setSabatiniEventi([]);
    setSabatiniError(null);
    setErogazioneForm(emptyErogazioneForm());
    setEventoForm(emptyEventoForm());
  }

  async function openNewPratica() {
    resetPraticaForm();
    setPraticaFormMode("new");
    setPraticaFormId(null);
    setPraticaFormError(null);
    setPraticaAttachments([]);
    setPraticaAttachmentsError(null);
    setPraticaFormOpen(true);
  }

  async function openEditPratica(praticaId: number) {
    if (!token || !aziendaId) return;
    setPraticaFormMode("edit");
    setPraticaFormId(praticaId);
    setPraticaFormError(null);
    setSabatiniError(null);
    setPraticaFormOpen(true);

    try {
      const res = await fetch(`${API_URL}/pratiche/${praticaId}`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPraticaForm({
        leasing: data.leasing || "",
        societa_leasing_id: data.societa_leasing_id ? String(data.societa_leasing_id) : "",
        broker: data.broker || "",
        nr_pratica: data.nr_pratica || "",
        nr_ctr: data.nr_ctr || "",
        data_inizio: data.data_inizio ? data.data_inizio.slice(0, 10) : "",
        data_fine: data.data_fine ? data.data_fine.slice(0, 10) : "",
        durata: data.durata ? String(data.durata) : "",
        importo_rata: data.importo_rata ? String(data.importo_rata) : "",
        importo_anticipo: data.importo_anticipo ? String(data.importo_anticipo) : "",
        importo_riscatto: data.importo_riscatto ? String(data.importo_riscatto) : "",
        sabatini: Boolean(data.sabatini),
        importo_sabatini: data.importo_sabatini ? String(data.importo_sabatini) : "",
        sabatini_data: data.sabatini_data ? data.sabatini_data.slice(0, 10) : "",
        sabatini_stato: data.sabatini_stato || "",
        protocollo_domanda: data.protocollo_domanda || "",
        data_domanda: data.data_domanda ? data.data_domanda.slice(0, 10) : "",
        cup: data.cup || "",
        decreto_numero: data.decreto_numero || "",
        decreto_data: data.decreto_data ? data.decreto_data.slice(0, 10) : "",
        note_sabatini: data.note_sabatini || ""
      });
      await Promise.all([
        loadPraticaAttachments(praticaId),
        loadSabatiniErogazioni(praticaId),
        loadSabatiniEventi(praticaId)
      ]);
    } catch {
      setPraticaFormError("Errore nel caricamento pratica");
    }
  }

  function closePraticaForm() {
    setPraticaFormOpen(false);
  }

  function validateBeforeSave() {
    if (!praticaForm.sabatini) return null;
    const stato = praticaForm.sabatini_stato.trim().toLowerCase();
    if (!stato) return "Stato Sabatini obbligatorio quando Sabatini e' attiva.";

    const missing: string[] = [];
    const require = (ok: boolean, label: string) => {
      if (!ok) missing.push(label);
    };

    if (stato === "inviata") {
      require(hasText(praticaForm.protocollo_domanda), "protocollo_domanda");
      require(hasDate(praticaForm.data_domanda), "data_domanda");
    }
    if (stato === "ammessa") {
      require(hasText(praticaForm.protocollo_domanda), "protocollo_domanda");
      require(hasDate(praticaForm.data_domanda), "data_domanda");
      require(hasText(praticaForm.decreto_numero), "decreto_numero");
      require(hasDate(praticaForm.decreto_data), "decreto_data");
    }
    if (stato === "respinta") {
      require(hasDate(praticaForm.data_domanda), "data_domanda");
      require(hasText(praticaForm.note_sabatini), "note_sabatini");
    }
    if (stato === "liquidata") {
      const hasPaid = sabatiniErogazioni.length > 0;
      if (praticaFormMode === "edit" && !hasPaid) {
        return "Per stato 'liquidata' serve almeno una erogazione registrata.";
      }
    }

    for (const [label, val] of [["importo_sabatini", praticaForm.importo_sabatini]] as Array<
      [string, string]
    >) {
      const n = parseMaybeNum(val);
      if (n !== null && n < 0) return `${label} non puo' essere negativo`;
    }

    if (missing.length) {
      return `Campi obbligatori mancanti per stato '${stato}': ${missing.join(", ")}`;
    }
    return null;
  }

  async function savePratica() {
    if (!token || !aziendaId) return;
    setPraticaFormError(null);
    const validationError = validateBeforeSave();
    if (validationError) {
      setPraticaFormError(validationError);
      return;
    }

      const payload = {
        leasing: praticaForm.leasing,
        societa_leasing_id: praticaForm.societa_leasing_id || null,
        broker: praticaForm.broker,
        nr_pratica: praticaForm.nr_pratica,
        nr_ctr: praticaForm.nr_ctr,
        data_inizio: praticaForm.data_inizio || null,
      data_fine: praticaForm.data_fine || null,
      durata: praticaForm.durata || null,
      importo_rata: praticaForm.importo_rata || null,
      importo_anticipo: praticaForm.importo_anticipo || null,
      importo_riscatto: praticaForm.importo_riscatto || null,
      sabatini: praticaForm.sabatini,
      importo_sabatini: praticaForm.sabatini ? praticaForm.importo_sabatini || null : null,
      sabatini_data: praticaForm.sabatini ? praticaForm.sabatini_data || null : null,
      sabatini_stato: praticaForm.sabatini ? praticaForm.sabatini_stato || null : null,
      protocollo_domanda: praticaForm.sabatini ? praticaForm.protocollo_domanda || null : null,
      data_domanda: praticaForm.sabatini ? praticaForm.data_domanda || null : null,
      cup: praticaForm.sabatini ? praticaForm.cup || null : null,
      decreto_numero: praticaForm.sabatini ? praticaForm.decreto_numero || null : null,
      decreto_data: praticaForm.sabatini ? praticaForm.decreto_data || null : null,
      note_sabatini: praticaForm.sabatini ? praticaForm.note_sabatini || null : null
    };

    try {
      const url = praticaFormMode === "new" ? `${API_URL}/pratiche` : `${API_URL}/pratiche/${praticaFormId}`;
      const method = praticaFormMode === "new" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: buildAuthHeaders(token, aziendaId, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore salvataggio pratica");
      }
      const saved = await res.json();
      setPraticaFormId(saved.id);
      if (praticaFormMode === "new") {
        setPraticaFormMode("edit");
      }
      await Promise.all([
        loadPraticaAttachments(saved.id),
        loadSabatiniErogazioni(saved.id),
        loadSabatiniEventi(saved.id)
      ]);
      onSaved();
      setPraticaFormOpen(false);
    } catch (e: any) {
      setPraticaFormError(e.message || "Errore salvataggio pratica");
    }
  }

  async function loadPraticaAttachments(praticaId: number) {
    if (!token || !aziendaId) return;
    setPraticaAttachmentsError(null);
    try {
      const res = await fetch(`${API_URL}/pratiche/${praticaId}/attachments`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPraticaAttachments(data);
    } catch {
      setPraticaAttachmentsError("Errore nel caricamento allegati");
    }
  }

  async function uploadPraticaAttachment(file: File) {
    if (!token || !aziendaId || !praticaFormId) return;
    setPraticaAttachmentsError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/pratiche/${praticaFormId}/attachments`, {
        method: "POST",
        headers: buildAuthHeaders(token, aziendaId),
        body: formData
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore upload allegato");
      }
      await loadPraticaAttachments(praticaFormId);
    } catch (e: any) {
      setPraticaAttachmentsError(e.message || "Errore upload allegato");
    }
  }

  async function deletePraticaAttachment(attId: number) {
    if (!token || !aziendaId) return;
    const ok = window.confirm("Vuoi eliminare l'allegato?");
    if (!ok) return;
    try {
      await fetch(`${API_URL}/pratiche/attachments/${attId}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (praticaFormId) await loadPraticaAttachments(praticaFormId);
    } catch {
      setPraticaAttachmentsError("Errore eliminazione allegato");
    }
  }

  async function openPraticaAttachment(att: PraticaAttachment) {
    if (!token || !aziendaId) return;
    try {
      const res = await fetch(`${API_URL}/pratiche/attachments/${att.id}/download`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch {
      setPraticaAttachmentsError("Errore apertura allegato");
    }
  }

  async function loadSabatiniErogazioni(praticaId: number) {
    if (!token || !aziendaId) return;
    try {
      const res = await fetch(`${API_URL}/pratiche/${praticaId}/sabatini/erogazioni`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const rows: SabatiniErogazione[] = await res.json();
      setSabatiniErogazioni(rows);
    } catch {
      setSabatiniError("Errore nel caricamento dati Sabatini");
    }
  }

  async function loadSabatiniEventi(praticaId: number) {
    if (!token || !aziendaId) return;
    try {
      const res = await fetch(`${API_URL}/pratiche/${praticaId}/sabatini/eventi`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const rows: SabatiniEvento[] = await res.json();
      setSabatiniEventi(rows);
    } catch {
      setSabatiniError("Errore nel caricamento dati Sabatini");
    }
  }

  async function addSabatiniErogazione() {
    if (!token || !aziendaId || !praticaFormId) return;
    setSabatiniError(null);
    try {
      const res = await fetch(`${API_URL}/pratiche/${praticaFormId}/sabatini/erogazioni`, {
        method: "POST",
        headers: buildAuthHeaders(token, aziendaId, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          numero_rata: erogazioneForm.numero_rata || null,
          importo: erogazioneForm.importo || null,
          data_pagata: erogazioneForm.data_pagata || null,
          note: erogazioneForm.note || null
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore salvataggio erogazione");
      }
      setErogazioneForm(emptyErogazioneForm());
      await loadSabatiniErogazioni(praticaFormId);
    } catch (e: any) {
      setSabatiniError(e.message || "Errore salvataggio erogazione");
    }
  }

  async function deleteSabatiniErogazione(id: number) {
    if (!token || !aziendaId || !praticaFormId) return;
    if (!window.confirm("Eliminare questa erogazione?")) return;
    setSabatiniError(null);
    try {
      const res = await fetch(`${API_URL}/sabatini/erogazioni/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      await loadSabatiniErogazioni(praticaFormId);
    } catch {
      setSabatiniError("Errore eliminazione erogazione");
    }
  }

  async function addSabatiniEvento() {
    if (!token || !aziendaId || !praticaFormId) return;
    setSabatiniError(null);
    try {
      const res = await fetch(`${API_URL}/pratiche/${praticaFormId}/sabatini/eventi`, {
        method: "POST",
        headers: buildAuthHeaders(token, aziendaId, {
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          data_evento: eventoForm.data_evento || null,
          tipo: eventoForm.tipo,
          descrizione: eventoForm.descrizione || null
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore salvataggio evento");
      }
      setEventoForm(emptyEventoForm());
      await loadSabatiniEventi(praticaFormId);
    } catch (e: any) {
      setSabatiniError(e.message || "Errore salvataggio evento");
    }
  }

  async function deleteSabatiniEvento(id: number) {
    if (!token || !aziendaId || !praticaFormId) return;
    if (!window.confirm("Eliminare questo evento?")) return;
    setSabatiniError(null);
    try {
      const res = await fetch(`${API_URL}/sabatini/eventi/${id}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      await loadSabatiniEventi(praticaFormId);
    } catch {
      setSabatiniError("Errore eliminazione evento");
    }
  }

  return {
    praticaFormOpen,
    praticaFormMode,
    praticaForm,
    praticaFormError,
    praticaAttachments,
    attachmentPreviews,
    praticaAttachmentsError,
    sabatiniErogazioni,
    sabatiniEventi,
    sabatiniError,
    erogazioneForm,
    eventoForm,
    dragOver,
    setDragOver,
    setPraticaForm,
    setErogazioneForm,
    setEventoForm,
    openNewPratica,
    openEditPratica,
    closePraticaForm,
    savePratica,
    uploadPraticaAttachment,
    deletePraticaAttachment,
    openPraticaAttachment,
    addSabatiniErogazione,
    deleteSabatiniErogazione,
    addSabatiniEvento,
    deleteSabatiniEvento
  };
}
