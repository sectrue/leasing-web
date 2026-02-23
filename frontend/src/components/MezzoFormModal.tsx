type MezzoForm = {
  numero_interno: string;
  mezzo: string;
  fornitore: string;
  descrizione_bene: string;
  allestimento: string;
  importo_mezzo: string;
  importo_allestimento_materiale: string;
  importo_pratica_40: string;
  note: string;
};

type Props = {
  open: boolean;
  mode: "new" | "edit";
  error: string | null;
  form: MezzoForm;
  praticaId: number | null;
  praticaOptions: { id: number; nr_ctr: string | null; leasing: string | null; broker: string | null }[];
  onPraticaChange: (id: number | null) => void;
  onClose: () => void;
  onChange: (next: MezzoForm) => void;
  onSave: () => void;
  formatCurrency: (v: string | number) => string;
  calcImportoFinanziato: () => number;
};

export function MezzoFormModal({
  open,
  mode,
  error,
  form,
  praticaId,
  praticaOptions,
  onPraticaChange,
  onClose,
  onChange,
  onSave,
  formatCurrency,
  calcImportoFinanziato
}: Props) {
  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="section-title">{mode === "new" ? "Nuovo mezzo" : "Modifica mezzo"}</h2>
            <p className="text-sm text-muted">Compila i campi principali del mezzo.</p>
          </div>
          <button className="btn btn-outline" onClick={onClose}>Chiudi</button>
        </div>
        <div className="modal-body">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="mb-3">
            <label className="field-label">Pratica</label>
            <select
              className="select"
              value={praticaId ? String(praticaId) : ""}
              onChange={(e) => onPraticaChange(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">Seleziona pratica</option>
              {praticaOptions.map((p) => (
                <option key={p.id} value={String(p.id)}>
                  {p.nr_ctr || `Pratica #${p.id}`} {p.leasing ? `- ${p.leasing}` : ""}{" "}
                  {p.broker ? `(${p.broker})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="form-grid">
            <div>
              <label className="field-label">Numero interno *</label>
              <input
                className="input"
                value={form.numero_interno}
                onChange={(e) => onChange({ ...form, numero_interno: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Mezzo *</label>
              <input
                className="input"
                value={form.mezzo}
                onChange={(e) => onChange({ ...form, mezzo: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Fornitore</label>
              <input
                className="input"
                value={form.fornitore}
                onChange={(e) => onChange({ ...form, fornitore: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Descrizione bene</label>
              <input
                className="input"
                value={form.descrizione_bene}
                onChange={(e) => onChange({ ...form, descrizione_bene: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Allestimento</label>
              <input
                className="input"
                value={form.allestimento}
                onChange={(e) => onChange({ ...form, allestimento: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Importo mezzo</label>
              <input
                className="input"
                value={form.importo_mezzo}
                onChange={(e) => onChange({ ...form, importo_mezzo: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Importo allestimento materiale</label>
              <input
                className="input"
                value={form.importo_allestimento_materiale}
                onChange={(e) => onChange({ ...form, importo_allestimento_materiale: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Importo pratica 4.0</label>
              <input
                className="input"
                value={form.importo_pratica_40}
                onChange={(e) => onChange({ ...form, importo_pratica_40: e.target.value })}
              />
            </div>
            <div>
              <label className="field-label">Importo finanziato</label>
              <input
                className="input"
                value={formatCurrency(calcImportoFinanziato())}
                readOnly
              />
            </div>
            <div>
              <label className="field-label">Importo totale mezzo</label>
              <input
                className="input"
                value={formatCurrency(calcImportoFinanziato())}
                readOnly
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="field-label">Note</label>
            <textarea
              className="input"
              value={form.note}
              onChange={(e) => onChange({ ...form, note: e.target.value })}
              rows={3}
            />
          </div>
          <div className="mt-4 flex gap-2">
            <button className="btn btn-primary" onClick={onSave}>
              {mode === "new" ? "Salva mezzo" : "Aggiorna mezzo"}
            </button>
            <button className="btn btn-outline" onClick={onClose}>
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
