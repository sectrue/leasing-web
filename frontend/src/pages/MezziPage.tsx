import type { MezzoRow, PraticaOption } from "../types";
import { formatCurrency } from "../lib/format";

type Props = {
  mezziSearch: string;
  mezziPraticaFilter: string;
  praticaOptions: PraticaOption[];
  setMezziSearch: (v: string) => void;
  setMezziPraticaFilter: (v: string) => void;
  mezziList: MezzoRow[];
  mezziListLoading: boolean;
  mezziListError: string | null;
  page: number;
  totalPages: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
  onPageSize: (v: number) => void;
  onNewMezzo: () => void;
  onEditMezzo: (id: number) => void;
  onDeleteMezzo: (id: number) => void;
};

export function MezziPage({
  mezziSearch,
  mezziPraticaFilter,
  praticaOptions,
  setMezziSearch,
  setMezziPraticaFilter,
  mezziList,
  mezziListLoading,
  mezziListError,
  page,
  totalPages,
  pageSize,
  onPrev,
  onNext,
  onPageSize,
  onNewMezzo,
  onEditMezzo,
  onDeleteMezzo
}: Props) {
  return (
    <>
      <section className="card">
        <h2 className="section-title">Ricerca mezzi</h2>
        <div className="mt-4 space-y-4">
          <input
            className="input"
            placeholder="Cerca (nr interno, mezzo, fornitore...)"
            value={mezziSearch}
            onChange={(e) => setMezziSearch(e.target.value)}
          />
          <div className="grid grid-cols-4 gap-4 pt-2">
            <select
              className="select"
              value={mezziPraticaFilter}
              onChange={(e) => setMezziPraticaFilter(e.target.value)}
            >
              <option value="">Tutte le pratiche</option>
              {praticaOptions.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nr_ctr || `Pratica #${p.id}`} {p.leasing ? `- ${p.leasing}` : ""}{" "}
                  {p.broker ? `(${p.broker})` : ""}
                </option>
              ))}
            </select>
            <div />
            <div />
            <div />
          </div>
        </div>
      </section>

      <section className="section-gap card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Elenco mezzi</h2>
          <button className="btn btn-primary" onClick={onNewMezzo}>Nuovo mezzo</button>
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
                <th>Nr interno</th>
                <th>Mezzo</th>
                <th>Fornitore</th>
                <th>Descrizione</th>
                <th>Pratica</th>
                <th className="text-right">Imp. finanziato</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
                  {mezziListLoading && (
                    <tr>
                      <td colSpan={7}>Caricamento mezzi...</td>
                    </tr>
                  )}
                  {!mezziListLoading && mezziListError && (
                    <tr>
                      <td colSpan={7} className="text-sm text-red-600">{mezziListError}</td>
                    </tr>
                  )}
                  {!mezziListLoading && !mezziListError && mezziList.length === 0 && (
                    <tr>
                      <td colSpan={7}>Nessun mezzo trovato</td>
                    </tr>
                  )}
              {!mezziListLoading && !mezziListError && mezziList.map((m) => (
                <tr key={m.id}>
                  <td className="font-medium">{m.numero_interno}</td>
                  <td>{m.mezzo}</td>
                  <td>{m.fornitore || "-"}</td>
                  <td>{m.descrizione_bene || "-"}</td>
                  <td>{m.pratica_id ? `Pratica #${m.pratica_id}` : "-"}</td>
                  <td className="text-right">{formatCurrency(m.importo_finanziato)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline" onClick={() => onEditMezzo(m.id)}>
                        Modifica
                      </button>
                      <button className="btn btn-danger" onClick={() => onDeleteMezzo(m.id)}>
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
