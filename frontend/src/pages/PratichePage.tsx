import type { PraticaOption, PraticaRow } from "../types";
import { formatCurrency } from "../lib/format";

type Props = {
  searchTerm: string;
  quickFilter: "tutte" | "sabatini" | "attive";
  praticaFilter: string;
  leasingFilter: string;
  brokerFilter: string;
  praticaOptions: PraticaOption[];
  leasingOptions: string[];
  brokerOptions: string[];
  setSearchTerm: (v: string) => void;
  setQuickFilter: (v: "tutte" | "sabatini" | "attive") => void;
  setPraticaFilter: (v: string) => void;
  setLeasingFilter: (v: string) => void;
  setBrokerFilter: (v: string) => void;
  pratiche: PraticaRow[];
  praticheLoading: boolean;
  praticheError: string | null;
  page: number;
  totalPages: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
  onPageSize: (v: number) => void;
  onNewPratica: () => void;
  onEditPratica: (id: number) => void;
  onDeletePratica: (id: number, mezziCount: number) => void;
  onMezzi: (id: number, label: string) => void;
  statusBadgeClass: (s: string) => string;
};

export function PratichePage({
  searchTerm,
  quickFilter,
  praticaFilter,
  leasingFilter,
  brokerFilter,
  praticaOptions,
  leasingOptions,
  brokerOptions,
  setSearchTerm,
  setQuickFilter,
  setPraticaFilter,
  setLeasingFilter,
  setBrokerFilter,
  pratiche,
  praticheLoading,
  praticheError,
  page,
  totalPages,
  pageSize,
  onPrev,
  onNext,
  onPageSize,
  onNewPratica,
  onEditPratica,
  onDeletePratica,
  onMezzi,
  statusBadgeClass
}: Props) {
  return (
    <>
      <section className="card">
        <h2 className="section-title">Ricerca rapida</h2>
        <div className="mt-4 space-y-4">
          <input
            className="input"
            placeholder="Cerca (mezzo, nr interno, fornitore...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="grid grid-cols-4 gap-4 pt-2">
            <select
              className="select"
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value as "tutte" | "sabatini" | "attive")}
            >
              <option value="tutte">Tutte le pratiche</option>
              <option value="sabatini">Con Sabatini</option>
              <option value="attive">Solo attive</option>
            </select>
            <select
              className="select"
              value={praticaFilter}
              onChange={(e) => setPraticaFilter(e.target.value)}
            >
              <option value="">Tutte le pratiche</option>
              {praticaOptions.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nr_ctr || `Pratica #${p.id}`} {p.leasing ? `- ${p.leasing}` : ""}{" "}
                  {p.broker ? `(${p.broker})` : ""}
                </option>
              ))}
            </select>
            <select
              className="select"
              value={leasingFilter}
              onChange={(e) => setLeasingFilter(e.target.value)}
            >
              <option value="">Tutti i leasing</option>
              {leasingOptions.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select
              className="select"
              value={brokerFilter}
              onChange={(e) => setBrokerFilter(e.target.value)}
            >
              <option value="">Tutti i broker</option>
              {brokerOptions.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="section-gap card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Elenco pratiche</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn btn-primary" onClick={onNewPratica}>Nuova pratica</button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
          <span>Pagina {page} di {totalPages}</span>
          <div className="pagination">
            <button className="btn btn-outline" onClick={onPrev} disabled={page <= 1}>
              Prev
            </button>
            <button className="btn btn-outline" onClick={onNext} disabled={page >= totalPages}>
              Next
            </button>
            <select
              className="select"
              value={pageSize}
              onChange={(e) => onPageSize(Number(e.target.value))}
            >
              <option value={10}>10 / pagina</option>
              <option value={20}>20 / pagina</option>
              <option value={50}>50 / pagina</option>
            </select>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Pratica</th>
                <th>Leasing</th>
                <th>Broker</th>
                <th>Mezzi</th>
                <th className="text-right">Totale</th>
                <th>Sabatini</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {praticheLoading && (
                <tr>
                  <td colSpan={8}>Caricamento pratiche...</td>
                </tr>
              )}
              {!praticheLoading && praticheError && (
                <tr>
                  <td colSpan={8} className="text-sm text-red-600">{praticheError}</td>
                </tr>
              )}
              {!praticheLoading && !praticheError && pratiche.length === 0 && (
                <tr>
                  <td colSpan={8}>Nessuna pratica trovata</td>
                </tr>
              )}
              {!praticheLoading && !praticheError && pratiche.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.nr_ctr || `Pratica #${row.id}`}</td>
                  <td>{row.societa_leasing_nome || row.leasing || "-"}</td>
                  <td>{row.broker || "-"}</td>
                  <td>{row.mezzi_count}</td>
                  <td className="text-right">{formatCurrency(row.total_importo_finanziato)}</td>
                  <td>{row.sabatini ? row.sabatini_stato || "attiva" : "-"}</td>
                  <td><span className={statusBadgeClass(row.stato)}>{row.stato}</span></td>
                  <td className="flex flex-wrap gap-2">
                    <button className="btn btn-outline" onClick={() => onMezzi(row.id, row.nr_ctr || `Pratica #${row.id}`)}>
                      Mezzi
                    </button>
                    <button className="btn btn-outline" onClick={() => onEditPratica(row.id)}>
                      Modifica
                    </button>
                    <button className="btn btn-danger" onClick={() => onDeletePratica(row.id, row.mezzi_count)}>
                      Elimina
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
