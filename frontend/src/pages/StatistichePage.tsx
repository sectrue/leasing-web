import { formatCurrency } from "../lib/format";
import type { KpiData, MonthlyStat } from "../types";

type Props = {
  kpi: KpiData | null;
  kpiError: string | null;
  monthly: MonthlyStat[];
  monthlyError: string | null;
};

export function StatistichePage({ kpi, kpiError, monthly, monthlyError }: Props) {
  return (
    <section className="section-gap">
      <div className="card">
        <h2 className="section-title">KPI avanzati</h2>
        {kpiError && <p className="text-sm text-red-600">{kpiError}</p>}
        <div className="mt-4 dashboard-grid">
          <div className="card">
            <p className="kpi-title">Importo medio</p>
            <p className="kpi-value">{kpi ? formatCurrency(kpi.importo_medio) : "-"}</p>
            <p className="kpi-sub">Importo complessivo {kpi ? formatCurrency(kpi.importo_totale) : "-"}</p>
            <p className="kpi-trend">Dati aggregati</p>
          </div>
          <div className="card">
            <p className="kpi-title">Sabatini</p>
            <p className="kpi-value">{kpi ? `${kpi.sabatini_percent}%` : "-"}</p>
            <p className="kpi-sub">Quota su totale</p>
            <p className="kpi-trend">Stabile</p>
          </div>
          <div className="card">
            <p className="kpi-title">In scadenza 30g</p>
            <p className="kpi-value">{kpi ? kpi.pratiche_in_scadenza_30g : "-"}</p>
            <p className="kpi-sub">Attenzione alle chiusure</p>
            <p className="kpi-trend">Ultimi 30 giorni</p>
          </div>
        </div>
      </div>
      <div className="section-gap card">
        <h2 className="section-title">Importi mensili (ultimi 12 mesi)</h2>
        <div className="mt-4">
          {monthlyError && <p className="text-sm text-red-600">{monthlyError}</p>}
          {!monthlyError && monthly.length === 0 && (
            <p className="text-sm text-muted">Nessun dato mensile disponibile.</p>
          )}
          {!monthlyError && monthly.length > 0 && (
            <div className="chart">
              {(() => {
                const totals = monthly.map((m) => Number(m.total || 0));
                const max = Math.max(...totals, 1);
                return monthly.map((m) => {
                  const value = Number(m.total || 0);
                  const height = Math.max((value / max) * 140, 6);
                  const label = m.ym.slice(2);
                  return (
                    <div className="chart-bar" key={m.ym}>
                      <span style={{ height }} />
                      <div className="chart-label">{label}</div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
