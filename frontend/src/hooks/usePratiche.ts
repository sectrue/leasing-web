import { useEffect, useState } from "react";
import { API_URL, buildAuthHeaders } from "../lib/api";
import { formatCurrency, formatPraticaRef } from "../lib/format";
import type { PraticaOption, PraticaRow, PraticheResponse } from "../types";

type UsePraticheParams = {
  token: string | null;
  active: boolean;
  aziendaId: number | null;
};

export function usePratiche({ token, active, aziendaId }: UsePraticheParams) {
  const [pratiche, setPratiche] = useState<PraticaRow[]>([]);
  const [praticheLoading, setPraticheLoading] = useState(false);
  const [praticheError, setPraticheError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState<"tutte" | "sabatini" | "attive">("tutte");
  const [praticaFilter, setPraticaFilter] = useState<string>("");
  const [leasingFilter, setLeasingFilter] = useState<string>("");
  const [brokerFilter, setBrokerFilter] = useState<string>("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalRows, setTotalRows] = useState(0);

  const [praticaOptions, setPraticaOptions] = useState<PraticaOption[]>([]);
  const [leasingOptions, setLeasingOptions] = useState<string[]>([]);
  const [brokerOptions, setBrokerOptions] = useState<string[]>([]);
  const [pratichePrintLoading, setPratichePrintLoading] = useState(false);

  useEffect(() => {
    if (!token || !active || !aziendaId) return;
    loadPratiche();
  }, [token, active, aziendaId, page, pageSize]);

  useEffect(() => {
    if (!token || !active || !aziendaId) return;
    const handle = setTimeout(() => {
      setPage(1);
      loadPratiche(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchTerm, quickFilter, praticaFilter, leasingFilter, brokerFilter, token, active, aziendaId]);

  useEffect(() => {
    if (!token || !aziendaId) return;
    loadFilterOptions();
  }, [token, aziendaId]);

  async function loadPratiche(forcedPage?: number) {
    if (!token || !aziendaId) return;
    setPraticheLoading(true);
    setPraticheError(null);

    const params = new URLSearchParams();
    params.set("page", String(forcedPage || page));
    params.set("pageSize", String(pageSize));
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (quickFilter === "sabatini") params.set("sabatini", "true");
    if (quickFilter === "attive") params.set("status", "attiva");
    if (praticaFilter) params.set("praticaId", praticaFilter);
    if (leasingFilter) params.set("leasing", leasingFilter);
    if (brokerFilter) params.set("broker", brokerFilter);

    try {
      const res = await fetch(`${API_URL}/pratiche?${params.toString()}`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const payload: PraticheResponse = await res.json();
      setPratiche(payload.items);
      setTotalRows(payload.total || 0);
    } catch {
      setPraticheError("Errore nel caricamento pratiche");
    } finally {
      setPraticheLoading(false);
    }
  }

  function buildPrintParams() {
    const params = new URLSearchParams();
    if (searchTerm.trim()) params.set("q", searchTerm.trim());
    if (quickFilter === "sabatini") params.set("sabatini", "true");
    if (quickFilter === "attive") params.set("status", "attiva");
    if (praticaFilter) params.set("praticaId", praticaFilter);
    if (leasingFilter) params.set("leasing", leasingFilter);
    if (brokerFilter) params.set("broker", brokerFilter);
    return params;
  }

  function buildFiltersSummary() {
    const parts: string[] = [];
    if (searchTerm.trim()) parts.push(`Ricerca: ${searchTerm.trim()}`);
    if (quickFilter === "sabatini") parts.push("Filtro: Solo Sabatini");
    if (quickFilter === "attive") parts.push("Filtro: Solo attive");
    if (praticaFilter) parts.push(`Pratica ID: ${praticaFilter}`);
    if (leasingFilter) parts.push(`Leasing: ${leasingFilter}`);
    if (brokerFilter) parts.push(`Broker: ${brokerFilter}`);
    return parts.join(" · ");
  }

  function escapeHtml(value: string) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function labelForKey(key: string) {
    const praticheLabels: Record<string, string> = {
      societa_leasing_nome: "Societa leasing",
      nr_pratica: "Numero pratica",
      nr_ctr: "Numero contratto",
      leasing: "Leasing (testo libero)",
      broker: "Broker",
      data_inizio: "Data inizio",
      data_fine: "Data fine",
      durata: "Durata (mesi)",
      importo_rata: "Importo rata",
      importo_anticipo: "Importo anticipo",
      importo_riscatto: "Importo riscatto",
      sabatini: "Sabatini",
      importo_sabatini: "Importo Sabatini",
      sabatini_data: "Data Sabatini",
      sabatini_stato: "Stato Sabatini",
      protocollo_domanda: "Protocollo domanda",
      data_domanda: "Data domanda",
      cup: "CUP",
      decreto_numero: "Decreto numero",
      decreto_data: "Decreto data",
      note_sabatini: "Note Sabatini"
    };
    const mezziLabels: Record<string, string> = {
      numero_interno: "Numero interno",
      mezzo: "Mezzo",
      fornitore: "Fornitore",
      descrizione_bene: "Descrizione bene",
      allestimento: "Allestimento",
      importo_mezzo: "Importo mezzo",
      importo_allestimento_materiale: "Importo allestimento materiale",
      importo_pratica_40: "Importo pratica 40",
      note: "Note"
    };
    return praticheLabels[key] || mezziLabels[key] || key.replace(/_/g, " ");
  }

  function formatValue(key: string, value: any) {
    if (value === null || value === undefined || value === "") return "-";
    if (typeof value === "boolean") return value ? "Si" : "No";
    if (key.includes("importo") || key.includes("contributo") || key.includes("plafond")) {
      return formatCurrency(value);
    }
    if (
      key.startsWith("data_") ||
      key.endsWith("_data") ||
      key.endsWith("_at")
    ) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        return d.toLocaleDateString("it-IT");
      }
    }
    return String(value);
  }

  function pickKeys(obj: Record<string, any>, keys: string[]) {
    const set = new Set(Object.keys(obj || {}));
    return keys.filter((k) => set.has(k));
  }

  function computeStato(data_inizio?: string | null, data_fine?: string | null) {
    const today = new Date();
    const start = data_inizio ? new Date(data_inizio) : null;
    const end = data_fine ? new Date(data_fine) : null;
    if (end) {
      const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
      const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      return endDay <= todayDay ? "Chiusa" : "Attiva";
    }
    if (start) return "Attiva";
    return "In lavorazione";
  }

  async function fetchAllPraticheForPrint() {
    if (!token || !aziendaId) return [];
    const paramsBase = buildPrintParams();
    const all: PraticaRow[] = [];
    let page = 1;
    const pageSize = 200;
    while (true) {
      const params = new URLSearchParams(paramsBase.toString());
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`${API_URL}/pratiche?${params.toString()}`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error("Errore nel caricamento pratiche");
      const payload: PraticheResponse = await res.json();
      const items = payload.items || [];
      all.push(...items);
      if (items.length < pageSize) break;
      page += 1;
      if (page > 100) break;
    }
    return all;
  }

  function openPrintWindow(payload: {
    title: string;
    azienda?: { id: number; nome: string } | null;
    items: Array<{
      pratica: Record<string, any>;
      mezzi: Array<Record<string, any>>;
    }>;
    filters?: string;
  }) {
    const now = new Date();
    const stampatoIl = `${now.toLocaleDateString("it-IT")} ${now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}`;
    const aziendaLabel = payload.azienda?.nome ? `Azienda: ${payload.azienda.nome}` : "";
    const filters = payload.filters ? `Filtri: ${payload.filters}` : "";

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(payload.title)}</title>
    <style>
      :root { color-scheme: light; }
      * { box-sizing: border-box; }
      body { margin: 24px; font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; color: #0f172a; }
      h1 { font-size: 20px; margin: 0 0 6px; }
      .meta { font-size: 12px; color: #475569; margin-bottom: 16px; }
      .meta div { margin: 2px 0; }
      .pratica { border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; margin-bottom: 14px; }
      .pratica-header { display: flex; justify-content: space-between; gap: 16px; align-items: baseline; flex-wrap: wrap; }
      .pratica-title { font-size: 15px; font-weight: 700; }
      .pratica-sub { font-size: 12px; color: #475569; margin-top: 4px; }
      .pratica-stats { font-size: 12px; color: #0f172a; }
      .section-title { font-size: 13px; font-weight: 700; margin-top: 10px; }
      .section-gap { margin-top: 12px; }
      .kv th { width: 34%; background: #f8fafc; }
      .table-mezzi { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
      .table-mezzi th, .table-mezzi td { border: 1px solid #e2e8f0; padding: 5px 6px; }
      .table-mezzi th { background: #f1f5f9; text-align: left; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
      th, td { border: 1px solid #e2e8f0; padding: 6px 8px; vertical-align: top; }
      th { background: #f8fafc; text-align: left; }
      .text-right { text-align: right; }
      .muted { color: #64748b; }
      .badge { display: inline-block; padding: 2px 6px; border-radius: 8px; background: #e2e8f0; font-size: 11px; }
      @media print {
        @page { margin: 10mm; }
        body { margin: 0; }
      }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(payload.title)}</h1>
    <div class="meta">
      ${aziendaLabel ? `<div>${escapeHtml(aziendaLabel)}</div>` : ""}
      <div>Stampato il: ${escapeHtml(stampatoIl)}</div>
      ${filters ? `<div>${escapeHtml(filters)}</div>` : ""}
      <div>Totale pratiche: ${payload.items.length}</div>
    </div>
    ${payload.items.map((item) => {
      const pratica = item.pratica || {};
      const praticaLabel = formatPraticaRef(pratica.id, pratica.nr_pratica);
      const praticaKeys = pickKeys(pratica, [
        "societa_leasing_nome",
        "leasing",
        "broker",
        "nr_pratica",
        "nr_ctr",
        "durata",
        "importo_rata",
        "importo_anticipo",
        "importo_riscatto",
        "sabatini",
        "importo_sabatini",
        "sabatini_data",
        "sabatini_stato",
        "protocollo_domanda",
        "data_domanda",
        "cup",
        "note_sabatini"
      ]);

      const praticaRows = praticaKeys.map((key) => `
        <tr>
          <th>${escapeHtml(labelForKey(key))}</th>
          <td>${escapeHtml(formatValue(key, pratica[key]))}</td>
        </tr>
      `).join("");

      const mezziBlocks = item.mezzi.length
        ? (() => {
          const preferredKeys = [
            "numero_interno",
            "mezzo",
            "fornitore",
            "descrizione_bene",
            "allestimento",
            "importo_mezzo",
            "importo_allestimento_materiale",
            "importo_pratica_40",
            "note"
          ];
          const mezzoKeys = preferredKeys;
          const header = mezzoKeys.map((key) => `<th>${escapeHtml(labelForKey(key))}</th>`).join("");
          const rows = item.mezzi.map((m) => {
            const cells = mezzoKeys.map((key) => `<td>${escapeHtml(formatValue(key, m[key]))}</td>`).join("");
              return `<tr>${cells}</tr>`;
            }).join("");
            return `
              <table class="table-mezzi">
                <thead>
                  <tr>${header}</tr>
                </thead>
                <tbody>
                  ${rows}
                </tbody>
              </table>
            `;
          })()
        : `<div class="muted">Nessun mezzo collegato</div>`;

      return `
        <section class="pratica">
          <div class="pratica-header">
            <div>
              <div class="pratica-title">${escapeHtml(praticaLabel)}</div>
            </div>
          </div>
          <div class="section-title">Dati pratica</div>
          <table class="kv">
            <tbody>
              ${praticaRows}
            </tbody>
          </table>
          <div class="section-title section-gap">Mezzi</div>
          ${mezziBlocks}
        </section>
      `;
    }).join("")}
    <script>
      window.onload = () => { setTimeout(() => { window.focus(); window.print(); }, 200); };
    </script>
  </body>
</html>`;

    const win = window.open("", "_blank");
    if (!win) {
      alert("Popup bloccato. Abilita i popup per stampare.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  async function printPraticheAll() {
    if (!token || !aziendaId) return;
    setPratichePrintLoading(true);
    setPraticheError(null);
    try {
      const societaRes = await fetch(`${API_URL}/societa-leasing`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      const societaList = societaRes.ok ? await societaRes.json() : [];
      const societaById = new Map<number, string>(
        (societaList || []).map((s: any) => [s.id, s.nome])
      );

      const praticheAll = await fetchAllPraticheForPrint();
      const items = [];
      for (const p of praticheAll) {
        const praticaRes = await fetch(`${API_URL}/pratiche/${p.id}`, {
          headers: buildAuthHeaders(token, aziendaId)
        });
        if (!praticaRes.ok) throw new Error();
        const praticaData = await praticaRes.json();
        const mezziRes = await fetch(`${API_URL}/pratiche/${p.id}/mezzi`, {
          headers: buildAuthHeaders(token, aziendaId)
        });
        if (!mezziRes.ok) throw new Error();
        const mezzi = await mezziRes.json();
        const total = (mezzi || []).reduce((sum: number, m: any) => sum + Number(m?.importo_finanziato || 0), 0);
        const stato = computeStato(praticaData?.data_inizio, praticaData?.data_fine);
        items.push({
          pratica: {
            ...praticaData,
            societa_leasing_nome: praticaData?.societa_leasing_id
              ? societaById.get(praticaData.societa_leasing_id) || null
              : null,
            stato,
            mezzi_count: Array.isArray(mezzi) ? mezzi.length : 0,
            total_importo_finanziato: total.toString()
          },
          mezzi: Array.isArray(mezzi) ? mezzi : []
        });
      }

      openPrintWindow({
        title: "Stampa pratiche",
        items,
        filters: buildFiltersSummary()
      });
    } catch {
      setPraticheError("Errore durante la stampa pratiche");
    } finally {
      setPratichePrintLoading(false);
    }
  }

  async function printPratica(praticaId: number) {
    if (!token || !aziendaId) return;
    setPratichePrintLoading(true);
    setPraticheError(null);
    try {
      const societaRes = await fetch(`${API_URL}/societa-leasing`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      const societaList = societaRes.ok ? await societaRes.json() : [];
      const societaById = new Map<number, string>(
        (societaList || []).map((s: any) => [s.id, s.nome])
      );

      const praticaRes = await fetch(`${API_URL}/pratiche/${praticaId}`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!praticaRes.ok) throw new Error();
      const praticaData = await praticaRes.json();
      const mezziRes = await fetch(`${API_URL}/pratiche/${praticaId}/mezzi`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!mezziRes.ok) throw new Error();
      const mezzi = await mezziRes.json();
      const total = (mezzi || []).reduce((sum: number, m: any) => sum + Number(m?.importo_finanziato || 0), 0);
      const stato = computeStato(praticaData?.data_inizio, praticaData?.data_fine);
      openPrintWindow({
        title: "Stampa pratica",
        items: [
          {
            pratica: {
              ...praticaData,
              societa_leasing_nome: praticaData?.societa_leasing_id
                ? societaById.get(praticaData.societa_leasing_id) || null
                : null,
              stato,
              mezzi_count: Array.isArray(mezzi) ? mezzi.length : 0,
              total_importo_finanziato: total.toString()
            },
            mezzi: Array.isArray(mezzi) ? mezzi : []
          }
        ]
      });
    } catch {
      setPraticheError("Errore durante la stampa pratica");
    } finally {
      setPratichePrintLoading(false);
    }
  }

  async function loadFilterOptions() {
    if (!token || !aziendaId) return;
    try {
      const [praticheRes, leasingRes, brokerRes] = await Promise.all([
        fetch(`${API_URL}/filters/pratiche`, { headers: buildAuthHeaders(token, aziendaId) }),
        fetch(`${API_URL}/filters/leasing`, { headers: buildAuthHeaders(token, aziendaId) }),
        fetch(`${API_URL}/filters/brokers`, { headers: buildAuthHeaders(token, aziendaId) })
      ]);
      if (praticheRes.ok) setPraticaOptions(await praticheRes.json());
      if (leasingRes.ok) setLeasingOptions(await leasingRes.json());
      if (brokerRes.ok) setBrokerOptions(await brokerRes.json());
    } catch {
      // ignore
    }
  }

  async function deletePratica(praticaId: number, mezziCount: number) {
    if (!token || !aziendaId) return;
    const confirmDelete = window.confirm("Vuoi eliminare questa pratica?");
    if (!confirmDelete) return;

    let deleteMezzi = false;
    if (mezziCount > 0) {
      deleteMezzi = window.confirm(
        `La pratica ha ${mezziCount} mezzi collegati.\n\nOK: elimina anche i mezzi.\nAnnulla: elimina la pratica e lascia i mezzi senza pratica.`
      );
    }

    setPraticheError(null);
    try {
      const params = new URLSearchParams();
      params.set("deleteMezzi", deleteMezzi ? "true" : "false");
      const res = await fetch(`${API_URL}/pratiche/${praticaId}?${params.toString()}`, {
        method: "DELETE",
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Errore eliminazione pratica");
      }
      await loadPratiche();
      await loadFilterOptions();
    } catch (e: any) {
      setPraticheError(e.message || "Errore eliminazione pratica");
    }
  }

  return {
    pratiche,
    praticheLoading,
    praticheError,
    searchTerm,
    quickFilter,
    praticaFilter,
    leasingFilter,
    brokerFilter,
    page,
    pageSize,
    totalRows,
    praticaOptions,
    leasingOptions,
    brokerOptions,
    pratichePrintLoading,
    setSearchTerm,
    setQuickFilter,
    setPraticaFilter,
    setLeasingFilter,
    setBrokerFilter,
    setPage,
    setPageSize,
    loadPratiche,
    deletePratica,
    printPraticheAll,
    printPratica
  };
}
