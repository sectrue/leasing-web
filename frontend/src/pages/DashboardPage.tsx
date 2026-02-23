import type { KpiData } from "../types";
import { formatCurrency } from "../lib/format";

type Props = {
  kpi: KpiData | null;
  kpiError: string | null;
};

export function DashboardPage({ kpi, kpiError }: Props) {
  if (kpiError) {
    return (
      <section className="section-gap">
        <div className="card text-sm text-red-600">{kpiError}</div>
      </section>
    );
  }

  if (!kpi) {
    return (
      <section className="section-gap">
        <div className="card text-sm">Caricamento KPI...</div>
      </section>
    );
  }

  return (
    <section className="section-gap">
      <div className="dashboard-grid">
        <div className="card">
          <p className="kpi-title">Pratiche attive</p>
          <p className="kpi-value">{kpi.pratiche_attive}</p>
          <p className="kpi-sub">Su {kpi.pratiche_totali} totali</p>
          <p className="kpi-trend">Trend positivo</p>
        </div>
        <div className="card">
          <p className="kpi-title">In lavorazione</p>
          <p className="kpi-value">{kpi.pratiche_in_lavorazione}</p>
          <p className="kpi-sub">Pratiche senza avvio</p>
          <p className="kpi-trend">Priorita alta</p>
        </div>
        <div className="card">
          <p className="kpi-title">Chiuse</p>
          <p className="kpi-value">{kpi.pratiche_chiuse}</p>
          <p className="kpi-sub">Completate</p>
          <p className="kpi-trend">Ultimi 12 mesi</p>
        </div>
        <div className="card">
          <p className="kpi-title">Importo medio</p>
          <p className="kpi-value">{formatCurrency(kpi.importo_medio)}</p>
          <p className="kpi-sub">Importo complessivo {formatCurrency(kpi.importo_totale)}</p>
          <p className="kpi-trend">Dati aggregati</p>
        </div>
        <div className="card">
          <p className="kpi-title">Sabatini</p>
          <p className="kpi-value">{kpi.sabatini_percent}%</p>
          <p className="kpi-sub">Quota su totale</p>
          <p className="kpi-trend">Stabile</p>
        </div>
        <div className="card">
          <p className="kpi-title">In scadenza 30g</p>
          <p className="kpi-value">{kpi.pratiche_in_scadenza_30g}</p>
          <p className="kpi-sub">Attenzione alle chiusure</p>
          <p className="kpi-trend">Ultimi 30 giorni</p>
        </div>
      </div>
      <div className="section-gap">
        <div className="alert">
          <span className="alert-icon">i</span>
          <div>
            <strong>Promemoria</strong>
            <div>Pianifica la revisione dei contratti in scadenza entro 30 giorni.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
