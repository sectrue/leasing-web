import type { PraticaOption, PraticaRow } from "../types";
import { formatCurrency, formatPraticaOptionLabel, formatPraticaRef } from "../lib/format";

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
  totalRows: number;
  onPrev: () => void;
  onNext: () => void;
  onPageSize: (v: number) => void;
  onNewPratica: () => void;
  onEditPratica: (id: number) => void;
  onDeletePratica: (id: number, mezziCount: number) => void;
  onMezzi: (id: number, label: string) => void;
  onPrintAll: () => void;
  onPrintPratica: (id: number) => void;
  printing: boolean;
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
  totalRows,
  onPrev,
  onNext,
  onPageSize,
  onNewPratica,
  onEditPratica,
  onDeletePratica,
  onMezzi,
  onPrintAll,
  onPrintPratica,
  printing,
  statusBadgeClass
}: Props) {
  const hasActiveFilters =
    !!searchTerm.trim() ||
    quickFilter !== "tutte" ||
    !!praticaFilter ||
    !!leasingFilter ||
    !!brokerFilter;

  return (
    <>
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Ricerca rapida</h2>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => {
              setSearchTerm("");
              setQuickFilter("tutte");
              setPraticaFilter("");
              setLeasingFilter("");
              setBrokerFilter("");
            }}
            disabled={!hasActiveFilters}
          >
            Reset filtri
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <input
            className="input"
            placeholder="Cerca (mezzo, nr interno, fornitore...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="grid grid-cols-4 gap-4 pt-2 pratiche-filters-grid">
            <label className="filter-field">
              <span className="filter-label">Vista</span>
              <select
                className="select"
                value={quickFilter}
                onChange={(e) => setQuickFilter(e.target.value as "tutte" | "sabatini" | "attive")}
              >
                <option value="tutte">Tutte le pratiche</option>
                <option value="sabatini">Con Sabatini</option>
                <option value="attive">Solo attive</option>
              </select>
            </label>
            <label className="filter-field">
              <span className="filter-label">Numero pratica</span>
              <select
                className="select"
                value={praticaFilter}
                onChange={(e) => setPraticaFilter(e.target.value)}
              >
                <option value="">Tutte le pratiche</option>
                {praticaOptions.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {formatPraticaOptionLabel(p)}
                  </option>
                ))}
              </select>
            </label>
            <label className="filter-field">
              <span className="filter-label">Leasing</span>
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
            </label>
            <label className="filter-field">
              <span className="filter-label">Broker</span>
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
            </label>
          </div>
        </div>
      </section>

      <section className="section-gap card">
        <div className="pratiche-toolbar">
          <div className="pratiche-toolbar-meta">
            <h2 className="section-title">Elenco pratiche</h2>
            <p className="mt-1 text-sm text-muted">
              {totalRows} {totalRows === 1 ? "risultato" : "risultati"} · Pagina {page} di {totalPages}
            </p>
          </div>
          <div className="pratiche-toolbar-actions">
            <div className="pagination pratiche-pagination-panel">
              <button className="btn btn-outline btn-sm" onClick={onPrev} disabled={page <= 1}>
                Prev
              </button>
              <button className="btn btn-outline btn-sm" onClick={onNext} disabled={page >= totalPages}>
                Next
              </button>
              <select
                className="select select-sm"
                value={pageSize}
                onChange={(e) => onPageSize(Number(e.target.value))}
              >
                <option value={10}>10 / pagina</option>
                <option value={20}>20 / pagina</option>
                <option value={50}>50 / pagina</option>
              </select>
            </div>
            <button className="btn btn-outline pratiche-new-btn" onClick={onPrintAll} disabled={printing}>
              {printing ? "Stampa..." : "Stampa tutte"}
            </button>
            <button className="btn btn-primary pratiche-new-btn" onClick={onNewPratica}>Nuova pratica</button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto pratiche-table-wrap">
          <table className="table table-pratiche">
            <thead>
              <tr>
                <th>Numero pratica</th>
                <th>Numero contratto</th>
                <th>Leasing</th>
                <th>Broker</th>
                <th className="text-right">Mezzi</th>
                <th className="text-right">Totale</th>
                <th>Sabatini</th>
                <th>Stato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {praticheLoading && (
                <tr>
                  <td colSpan={9}>Caricamento pratiche...</td>
                </tr>
              )}
              {!praticheLoading && praticheError && (
                <tr>
                  <td colSpan={9} className="text-sm text-red-600">{praticheError}</td>
                </tr>
              )}
              {!praticheLoading && !praticheError && pratiche.length === 0 && (
                <tr>
                  <td colSpan={9}>Nessuna pratica trovata</td>
                </tr>
              )}
              {!praticheLoading && !praticheError && pratiche.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{formatPraticaRef(row.id, row.nr_pratica)}</td>
                  <td className="font-medium">{row.nr_ctr || "-"}</td>
                  <td>{row.societa_leasing_nome || row.leasing || "-"}</td>
                  <td>{row.broker || "-"}</td>
                  <td className="text-right font-medium tabular-nums">{row.mezzi_count}</td>
                  <td className="text-right font-semibold tabular-nums">{formatCurrency(row.total_importo_finanziato)}</td>
                  <td>{row.sabatini ? <span className="badge badge-blue">{row.sabatini_stato || "attiva"}</span> : "-"}</td>
                  <td><span className={statusBadgeClass(row.stato)}>{row.stato}</span></td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-outline btn-xs" onClick={() => onMezzi(row.id, formatPraticaRef(row.id, row.nr_pratica))}>
                        Mezzi
                      </button>
                      <button className="btn btn-outline btn-xs" onClick={() => onPrintPratica(row.id)} disabled={printing}>
                        Stampa
                      </button>
                      <button className="btn btn-outline btn-xs" onClick={() => onEditPratica(row.id)}>
                        Modifica
                      </button>
                      <button className="btn btn-danger btn-xs" onClick={() => onDeletePratica(row.id, row.mezzi_count)}>
                        Elimina
                      </button>
                    </div>
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
