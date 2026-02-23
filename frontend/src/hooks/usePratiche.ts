import { useEffect, useState } from "react";
import { API_URL, buildAuthHeaders } from "../lib/api";
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
    setSearchTerm,
    setQuickFilter,
    setPraticaFilter,
    setLeasingFilter,
    setBrokerFilter,
    setPage,
    setPageSize,
    loadPratiche,
    deletePratica
  };
}
