import type { Azienda } from "../types";

type Props = {
  items: Azienda[];
  loading: boolean;
  error: string | null;
  editingId: number | null;
  editNome: string;
  saveError: string | null;
  saving: boolean;
  onEditNomeChange: (v: string) => void;
  onEdit: (item: Azienda) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function AziendePage({
  items,
  loading,
  error,
  editingId,
  editNome,
  saveError,
  saving,
  onEditNomeChange,
  onEdit,
  onCancel,
  onSave
}: Props) {
  return (
    <>
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">
            {editingId ? `Modifica azienda #${editingId}` : "Gestione aziende"}
          </h2>
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={onCancel} disabled={!editingId || saving}>
              Annulla
            </button>
            <button className="btn btn-primary" onClick={onSave} disabled={!editingId || saving}>
              {saving ? "Salvataggio..." : "Salva nome"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <input
            className="input"
            placeholder="Seleziona un'azienda dalla tabella per modificare il nome"
            value={editNome}
            onChange={(e) => onEditNomeChange(e.target.value)}
            disabled={!editingId || saving}
          />
        </div>

        {(error || saveError) && (
          <p className="mt-3 text-sm text-red-600">{saveError || error}</p>
        )}
      </section>

      <section className="section-gap card">
        <h2 className="section-title">Elenco aziende</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Creata il</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4}>Caricamento aziende...</td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={4}>Nessuna azienda trovata</td>
                </tr>
              )}
              {!loading &&
                items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.nome}</td>
                    <td>{row.created_at ? new Date(row.created_at).toLocaleDateString("it-IT") : "-"}</td>
                    <td className="flex flex-wrap gap-2">
                      <button className="btn btn-outline" onClick={() => onEdit(row)}>
                        Modifica nome
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
