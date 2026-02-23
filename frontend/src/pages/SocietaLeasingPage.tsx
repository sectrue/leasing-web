import type { LeasingCompany } from "../types";

type FormState = {
  nome: string;
  referente: string;
  telefono: string;
  email: string;
  note: string;
};

type Props = {
  items: LeasingCompany[];
  loading: boolean;
  error: string | null;
  editingId: number | null;
  form: FormState;
  setForm: (v: FormState) => void;
  onNew: () => void;
  onSave: () => void;
  onEdit: (item: LeasingCompany) => void;
  onDelete: (id: number) => void;
};

export function SocietaLeasingPage({
  items,
  loading,
  error,
  editingId,
  form,
  setForm,
  onNew,
  onSave,
  onEdit,
  onDelete
}: Props) {
  return (
    <>
      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="section-title">
            {editingId ? `Modifica societa #${editingId}` : "Nuova societa leasing"}
          </h2>
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={onNew}>Nuovo</button>
            <button className="btn btn-primary" onClick={onSave}>Salva societa</button>
          </div>
        </div>
        <div className="mt-4 form-grid">
          <input
            className="input"
            placeholder="Nome societa *"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
          <input
            className="input"
            placeholder="Referente"
            value={form.referente}
            onChange={(e) => setForm({ ...form, referente: e.target.value })}
          />
          <input
            className="input"
            placeholder="Telefono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />
          <input
            className="input"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="mt-3">
          <textarea
            className="input"
            rows={3}
            placeholder="Note"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </section>

      <section className="section-gap card">
        <h2 className="section-title">Elenco societa leasing</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Referente</th>
                <th>Telefono</th>
                <th>Email</th>
                <th>Azioni</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5}>Caricamento societa...</td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={5}>Nessuna societa trovata</td>
                </tr>
              )}
              {!loading && items.map((row) => (
                <tr key={row.id}>
                  <td>{row.nome}</td>
                  <td>{row.referente || "-"}</td>
                  <td>{row.telefono || "-"}</td>
                  <td>{row.email || "-"}</td>
                  <td className="flex flex-wrap gap-2">
                    <button className="btn btn-outline" onClick={() => onEdit(row)}>Modifica</button>
                    <button className="btn btn-danger" onClick={() => onDelete(row.id)}>Elimina</button>
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
