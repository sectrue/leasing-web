import { useState } from "react";
import type { Azienda } from "../types";
import { formatCurrency } from "../lib/format";

type Props = {
  items: Azienda[];
  loading: boolean;
  error: string | null;
  editingId: number | null;
  editNome: string;
  editPlafond: string;
  editUtilizzatoPregresso: string;
  newNome: string;
  newPlafond: string;
  newUtilizzatoPregresso: string;
  createError: string | null;
  saveError: string | null;
  deleteError: string | null;
  creating: boolean;
  saving: boolean;
  deletingId: number | null;
  onEditNomeChange: (v: string) => void;
  onEditPlafondChange: (v: string) => void;
  onEditUtilizzatoPregressoChange: (v: string) => void;
  onNewNomeChange: (v: string) => void;
  onNewPlafondChange: (v: string) => void;
  onNewUtilizzatoPregressoChange: (v: string) => void;
  onEdit: (item: Azienda) => void;
  onCreate: () => void | Promise<boolean>;
  onDelete: (item: Azienda) => void;
  onCancel: () => void;
  onSave: () => void;
};

export function AziendePage({
  items,
  loading,
  error,
  editingId,
  editNome,
  editPlafond,
  editUtilizzatoPregresso,
  newNome,
  newPlafond,
  newUtilizzatoPregresso,
  createError,
  saveError,
  deleteError,
  creating,
  saving,
  deletingId,
  onEditNomeChange,
  onEditPlafondChange,
  onEditUtilizzatoPregressoChange,
  onNewNomeChange,
  onNewPlafondChange,
  onNewUtilizzatoPregressoChange,
  onEdit,
  onCreate,
  onDelete,
  onCancel,
  onSave
}: Props) {
  const [showNewForm, setShowNewForm] = useState(false);

  async function handleCreate() {
    const ok = await onCreate();
    if (ok) setShowNewForm(false);
  }

  return (
    <>
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Azioni</h2>
          <button className="btn btn-primary" onClick={() => setShowNewForm((v) => !v)}>
            {showNewForm ? "Chiudi form" : "Nuova azienda"}
          </button>
        </div>
      </section>

      <section className="section-gap card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">Elenco aziende</h2>
          <p className="text-sm text-muted">Usa i pulsanti della tabella per aprire i modali.</p>
        </div>
        {(error || saveError || deleteError) && (
          <p className="mt-3 text-sm text-red-600">{saveError || deleteError || error}</p>
        )}
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th className="text-right">Plafond</th>
                <th className="text-right">Util. pregresso</th>
                <th className="text-right">Util. Sabatini</th>
                <th className="text-right">Rimanente</th>
                <th>Creata il</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8}>Caricamento aziende...</td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={8}>Nessuna azienda trovata</td>
                </tr>
              )}
              {!loading &&
                items.map((row) => (
                  <tr key={row.id}>
                    <td>{row.id}</td>
                    <td>{row.nome}</td>
                    <td className="text-right tabular-nums">{formatCurrency(row.plafond || 0)}</td>
                    <td className="text-right tabular-nums">{formatCurrency(row.utilizzato_pregresso || 0)}</td>
                    <td className="text-right tabular-nums">{formatCurrency(row.utilizzato_sabatini || 0)}</td>
                    <td className="text-right tabular-nums font-semibold">{formatCurrency(row.plafond_rimanente || 0)}</td>
                    <td>{row.created_at ? new Date(row.created_at).toLocaleDateString("it-IT") : "-"}</td>
                    <td className="flex flex-wrap gap-2">
                      <button className="btn btn-outline" onClick={() => onEdit(row)}>
                        Modifica
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => onDelete(row)}
                        disabled={deletingId === row.id}
                      >
                        {deletingId === row.id ? "Eliminazione..." : "Elimina"}
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {showNewForm && (
        <div className="modal-backdrop" onClick={() => !creating && setShowNewForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="section-title">Nuova azienda</h2>
                <p className="text-sm text-muted">Inserisci dati anagrafici e plafond.</p>
              </div>
              <button className="btn btn-outline" onClick={() => setShowNewForm(false)} disabled={creating}>
                Chiudi
              </button>
            </div>
            <div className="modal-body">
              {(error || createError) && (
                <p className="text-sm text-red-600">{createError || error}</p>
              )}
              <div className="space-y-3">
                <label className="filter-field">
                  <span className="filter-label">Nome azienda</span>
                  <input
                    className="input"
                    placeholder="Inserisci il nome della nuova azienda"
                    value={newNome}
                    onChange={(e) => onNewNomeChange(e.target.value)}
                    disabled={creating}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="filter-field">
                    <span className="filter-label">Plafond</span>
                    <input
                      className="input"
                      placeholder="Plafond (es. 100000)"
                      value={newPlafond}
                      onChange={(e) => onNewPlafondChange(e.target.value)}
                      disabled={creating}
                    />
                  </label>
                  <label className="filter-field">
                    <span className="filter-label">Utilizzato pratiche precedenti</span>
                    <input
                      className="input"
                      placeholder="Utilizzato pratiche precedenti"
                      value={newUtilizzatoPregresso}
                      onChange={(e) => onNewUtilizzatoPregressoChange(e.target.value)}
                      disabled={creating}
                    />
                  </label>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                  {creating ? "Creazione..." : "Aggiungi azienda"}
                </button>
                <button className="btn btn-outline" onClick={() => setShowNewForm(false)} disabled={creating}>
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingId && (
        <div className="modal-backdrop" onClick={() => !saving && onCancel()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 className="section-title">Modifica azienda #{editingId}</h2>
                <p className="text-sm text-muted">Aggiorna nome, plafond e utilizzato pregresso.</p>
              </div>
              <button className="btn btn-outline" onClick={onCancel} disabled={saving}>
                Chiudi
              </button>
            </div>
            <div className="modal-body">
              {(error || saveError || deleteError) && (
                <p className="text-sm text-red-600">{saveError || deleteError || error}</p>
              )}
              <div className="space-y-3">
                <label className="filter-field">
                  <span className="filter-label">Nome azienda</span>
                  <input
                    className="input"
                    placeholder="Nome azienda"
                    value={editNome}
                    onChange={(e) => onEditNomeChange(e.target.value)}
                    disabled={saving}
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="filter-field">
                    <span className="filter-label">Plafond</span>
                    <input
                      className="input"
                      placeholder="Plafond"
                      value={editPlafond}
                      onChange={(e) => onEditPlafondChange(e.target.value)}
                      disabled={saving}
                    />
                  </label>
                  <label className="filter-field">
                    <span className="filter-label">Utilizzato pratiche precedenti</span>
                    <input
                      className="input"
                      placeholder="Utilizzato pratiche precedenti"
                      value={editUtilizzatoPregresso}
                      onChange={(e) => onEditUtilizzatoPregressoChange(e.target.value)}
                      disabled={saving}
                    />
                  </label>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="btn btn-primary" onClick={onSave} disabled={saving}>
                  {saving ? "Salvataggio..." : "Salva azienda"}
                </button>
                <button className="btn btn-outline" onClick={onCancel} disabled={saving}>
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
