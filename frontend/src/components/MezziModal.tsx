import type { MezzoRow } from "../types";

type Props = {
  open: boolean;
  label: string;
  loading: boolean;
  error: string | null;
  mezzi: MezzoRow[];
  onClose: () => void;
  onNew: () => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
  formatCurrency: (v: string | number) => string;
};

export function MezziModal({
  open,
  label,
  loading,
  error,
  mezzi,
  onClose,
  onNew,
  onEdit,
  onDelete,
  formatCurrency
}: Props) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="section-title">Mezzi - {label}</h2>
            <p className="text-sm text-muted">Gestisci i mezzi collegati alla pratica.</p>
          </div>
          <button className="btn btn-outline" onClick={onClose}>Chiudi</button>
        </div>
        <div className="modal-body modal-body-scroll">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="section-title">Elenco mezzi</h3>
            <button className="btn btn-primary" onClick={onNew}>
              Nuovo mezzo
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nr interno</th>
                  <th>Mezzo</th>
                  <th>Fornitore</th>
                  <th>Descrizione</th>
                  <th className="text-right">Imp. finanziato</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={6}>Caricamento mezzi...</td>
                  </tr>
                )}
                {!loading && mezzi.length === 0 && (
                  <tr>
                    <td colSpan={6}>Nessun mezzo collegato</td>
                  </tr>
                )}
                {!loading && mezzi.map((m) => (
                  <tr key={m.id}>
                    <td className="font-medium">{m.numero_interno}</td>
                    <td>{m.mezzo}</td>
                    <td>{m.fornitore || "-"}</td>
                    <td>{m.descrizione_bene || "-"}</td>
                    <td className="text-right">{formatCurrency(m.importo_finanziato)}</td>
                    <td>
                      <div className="flex flex-wrap gap-2">
                        <button className="btn btn-outline" onClick={() => onEdit(m.id)}>
                          Modifica
                        </button>
                        <button className="btn btn-outline" onClick={() => onDelete(m.id)}>
                          Elimina
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
