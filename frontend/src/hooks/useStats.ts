import { useEffect, useState } from "react";
import { API_URL, buildAuthHeaders } from "../lib/api";
import type { KpiData, MonthlyStat } from "../types";

type UseStatsParams = {
  token: string | null;
  active: boolean;
  aziendaId: number | null;
};

export function useStats({ token, active, aziendaId }: UseStatsParams) {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [kpiError, setKpiError] = useState<string | null>(null);
  const [monthly, setMonthly] = useState<MonthlyStat[]>([]);
  const [monthlyError, setMonthlyError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !aziendaId) return;
    fetchKpi();
  }, [token, aziendaId]);

  useEffect(() => {
    if (!token || !active || !aziendaId) return;
    fetchMonthly();
  }, [token, active, aziendaId]);

  async function fetchKpi() {
    if (!token || !aziendaId) return;
    setKpiError(null);
    try {
      const res = await fetch(`${API_URL}/kpi`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setKpi(data);
    } catch {
      setKpiError("Errore nel caricamento KPI");
    }
  }

  async function fetchMonthly() {
    if (!token || !aziendaId) return;
    setMonthlyError(null);
    try {
      const res = await fetch(`${API_URL}/stats/monthly`, {
        headers: buildAuthHeaders(token, aziendaId)
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMonthly(data);
    } catch {
      setMonthlyError("Errore nel caricamento statistiche mensili");
    }
  }

  return {
    kpi,
    kpiError,
    monthly,
    monthlyError,
    refreshKpi: fetchKpi
  };
}
