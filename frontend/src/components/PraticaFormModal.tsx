import type {
  LeasingCompany,
  PraticaAttachment,
  PraticaFormState,
  SabatiniErogazione,
  SabatiniEvento
} from "../types";

type ErogazioneFormState = {
  numero_rata: string;
  importo: string;
  data_pagata: string;
  note: string;
};

type EventoFormState = {
  data_evento: string;
  tipo: string;
  descrizione: string;
};

type Props = {
  open: boolean;
  mode: "new" | "edit";
  form: PraticaFormState;
  error: string | null;
  leasingCompanies: LeasingCompany[];
  attachments: PraticaAttachment[];
  attachmentPreviews: Record<number, string>;
  attachmentsError: string | null;
  sabatiniErogazioni: SabatiniErogazione[];
  sabatiniEventi: SabatiniEvento[];
  sabatiniError: string | null;
  erogazioneForm: ErogazioneFormState;
  eventoForm: EventoFormState;
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (next: PraticaFormState) => void;
  onUpload: (file: File) => void;
  onDeleteAttachment: (id: number) => void;
  onOpenAttachment: (att: PraticaAttachment) => void;
  onErogazioneFormChange: (next: ErogazioneFormState) => void;
  onAddErogazione: () => void;
  onDeleteErogazione: (id: number) => void;
  onEventoFormChange: (next: EventoFormState) => void;
  onAddEvento: () => void;
  onDeleteEvento: (id: number) => void;
};

const SABATINI_STATI = [
  "bozza",
  "inviata",
  "ammessa",
  "respinta",
  "in_rendicontazione",
  "liquidata",
  "chiusa"
];

const EVENTI_TIPI = [
  "invio_domanda",
  "richiesta_integrazione",
  "ammissione",
  "stipula",
  "consegna",
  "rendicontazione_inviata",
  "erogazione",
  "chiusura"
];

const REQUIRED_BY_STATO: Record<string, string[]> = {
  inviata: ["protocollo_domanda", "data_domanda"],
  ammessa: [
    "protocollo_domanda",
    "data_domanda",
    "decreto_numero",
    "decreto_data"
  ],
  respinta: ["data_domanda", "note_sabatini"],
  liquidata: [">=1 erogazione registrata"]
};

export function PraticaFormModal({
  open,
  mode,
  form,
  error,
  leasingCompanies,
  attachments,
  attachmentPreviews,
  attachmentsError,
  sabatiniErogazioni,
  sabatiniEventi,
  sabatiniError,
  erogazioneForm,
  eventoForm,
  dragOver,
  setDragOver,
  onClose,
  onSave,
  onFormChange,
  onUpload,
  onDeleteAttachment,
  onOpenAttachment,
  onErogazioneFormChange,
  onAddErogazione,
  onDeleteErogazione,
  onEventoFormChange,
  onAddEvento,
  onDeleteEvento
}: Props) {
  if (!open) return null;
  const requiredFields = REQUIRED_BY_STATO[form.sabatini_stato] || [];
  const parseAmount = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return 0;
    const n = Number(String(value).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };
  const importoPrevisto = parseAmount(form.importo_sabatini);
  const totaleErogato = sabatiniErogazioni.reduce((sum, item) => sum + parseAmount(item.importo), 0);
  const residuoDaRicevere = Math.max(importoPrevisto - totaleErogato, 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="section-title">{mode === "new" ? "Nuova pratica" : "Modifica pratica"}</h2>
            <p className="text-sm text-muted">Compila i dati principali della pratica.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-outline" onClick={onClose}>Annulla</button>
            <button className="btn btn-primary" onClick={onSave}>Salva pratica</button>
          </div>
        </div>
        <div className="modal-body">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <h3 className="section-title">Dati base</h3>
            <div className="mt-3 form-grid">
              <div>
                <label className="field-label">Societa leasing</label>
                <select
                  className="select"
                  value={form.societa_leasing_id}
                  onChange={(e) => {
                    const id = e.target.value;
                    const company = leasingCompanies.find((x) => String(x.id) === id);
                    onFormChange({
                      ...form,
                      societa_leasing_id: id,
                      leasing: company ? company.nome : form.leasing
                    });
                  }}
                >
                  <option value="">Societa leasing (opzionale)</option>
                  {leasingCompanies.map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="field-label">Leasing (testo libero)</label>
                <input className="input" value={form.leasing} onChange={(e) => onFormChange({ ...form, leasing: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Broker</label>
                <input className="input" value={form.broker} onChange={(e) => onFormChange({ ...form, broker: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Nr Contratto</label>
                <input className="input" value={form.nr_ctr} onChange={(e) => onFormChange({ ...form, nr_ctr: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="section-gap">
            <h3 className="section-title">Date e durata</h3>
            <div className="mt-3 form-grid">
              <div>
                <label className="field-label">Data inizio contratto</label>
                <input className="input" type="date" value={form.data_inizio} onChange={(e) => onFormChange({ ...form, data_inizio: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Data fine contratto</label>
                <input className="input" type="date" value={form.data_fine} onChange={(e) => onFormChange({ ...form, data_fine: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Durata (mesi)</label>
                <input className="input" placeholder="Durata (mesi)" value={form.durata} onChange={(e) => onFormChange({ ...form, durata: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Importo rata</label>
                <input className="input" placeholder="Importo rata" value={form.importo_rata} onChange={(e) => onFormChange({ ...form, importo_rata: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Importo anticipo</label>
                <input className="input" placeholder="Importo anticipo" value={form.importo_anticipo} onChange={(e) => onFormChange({ ...form, importo_anticipo: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Importo riscatto</label>
                <input className="input" placeholder="Importo riscatto" value={form.importo_riscatto} onChange={(e) => onFormChange({ ...form, importo_riscatto: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="section-gap">
            <h3 className="section-title">Sabatini</h3>
            <div className="mt-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={form.sabatini}
                onChange={(e) => onFormChange({ ...form, sabatini: e.target.checked })}
              />
              <span className="text-sm">Sabatini attiva</span>
            </div>
            <div className="mt-3 form-grid">
              <div>
                <label className="field-label">Stato pratica Sabatini</label>
                <select className="select" value={form.sabatini_stato} disabled={!form.sabatini} onChange={(e) => onFormChange({ ...form, sabatini_stato: e.target.value })}>
                  <option value="">Stato Sabatini</option>
                  {SABATINI_STATI.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="field-label">Protocollo domanda</label>
                <input className="input" placeholder="Protocollo domanda" value={form.protocollo_domanda} disabled={!form.sabatini} onChange={(e) => onFormChange({ ...form, protocollo_domanda: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Data domanda</label>
                <input className="input" type="date" value={form.data_domanda} disabled={!form.sabatini} onChange={(e) => onFormChange({ ...form, data_domanda: e.target.value })} />
              </div>
              <div>
                <label className="field-label">CUP</label>
                <input className="input" placeholder="CUP" value={form.cup} disabled={!form.sabatini} onChange={(e) => onFormChange({ ...form, cup: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Decreto numero</label>
                <input className="input" placeholder="Decreto numero" value={form.decreto_numero} disabled={!form.sabatini} onChange={(e) => onFormChange({ ...form, decreto_numero: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Data decreto</label>
                <input className="input" type="date" value={form.decreto_data} disabled={!form.sabatini} onChange={(e) => onFormChange({ ...form, decreto_data: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Importo erogazione prevista</label>
                <input className="input" placeholder="Importo erogazione prevista" value={form.importo_sabatini} disabled={!form.sabatini} onChange={(e) => onFormChange({ ...form, importo_sabatini: e.target.value })} />
              </div>
              <div>
                <label className="field-label">Data Sabatini</label>
                <input className="input" type="date" value={form.sabatini_data} disabled={!form.sabatini} onChange={(e) => onFormChange({ ...form, sabatini_data: e.target.value })} />
              </div>
            </div>
            {form.sabatini && requiredFields.length > 0 && (
              <p className="text-sm text-muted mt-3">
                Obbligatori per stato <strong>{form.sabatini_stato}</strong>: {requiredFields.join(", ")}
              </p>
            )}
            <div className="mt-3">
              <label className="field-label">Note Sabatini</label>
              <textarea
                className="input"
                value={form.note_sabatini}
                disabled={!form.sabatini}
                onChange={(e) => onFormChange({ ...form, note_sabatini: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          {mode === "edit" && form.sabatini && (
            <div className="section-gap">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="section-title">Erogazioni Sabatini</h3>
                <div className="text-sm text-muted flex flex-wrap items-center gap-4">
                  <span>
                    Totale erogato: <strong>{totaleErogato.toFixed(2)}</strong>
                  </span>
                  <span>
                    Residuo da ricevere: <strong>{residuoDaRicevere.toFixed(2)}</strong>
                  </span>
                </div>
              </div>
              {sabatiniError && <p className="text-sm text-red-600">{sabatiniError}</p>}
              <div className="mt-3 form-grid">
                <div>
                  <label className="field-label">N rata</label>
                  <input className="input" value={erogazioneForm.numero_rata} onChange={(e) => onErogazioneFormChange({ ...erogazioneForm, numero_rata: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Importo</label>
                  <input className="input" value={erogazioneForm.importo} onChange={(e) => onErogazioneFormChange({ ...erogazioneForm, importo: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Data pagata</label>
                  <input className="input" type="date" value={erogazioneForm.data_pagata} onChange={(e) => onErogazioneFormChange({ ...erogazioneForm, data_pagata: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Note</label>
                  <input className="input" value={erogazioneForm.note} onChange={(e) => onErogazioneFormChange({ ...erogazioneForm, note: e.target.value })} />
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-outline" onClick={onAddErogazione}>Aggiungi erogazione</button>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Rata</th><th>Importo</th><th>Pagata</th><th>Azioni</th></tr></thead>
                  <tbody>
                    {sabatiniErogazioni.length === 0 && <tr><td colSpan={4}>Nessuna erogazione</td></tr>}
                    {sabatiniErogazioni.map((r) => (
                      <tr key={r.id}>
                        <td>{r.numero_rata ?? "-"}</td>
                        <td>{r.importo ?? "-"}</td>
                        <td>{r.data_pagata ? r.data_pagata.slice(0, 10) : "-"}</td>
                        <td><button className="btn btn-danger" onClick={() => onDeleteErogazione(r.id)}>Elimina</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {mode === "edit" && form.sabatini && (
            <div className="section-gap">
              <h3 className="section-title">Eventi Sabatini</h3>
              <div className="mt-3 form-grid">
                <div>
                  <label className="field-label">Data evento</label>
                  <input className="input" type="date" value={eventoForm.data_evento} onChange={(e) => onEventoFormChange({ ...eventoForm, data_evento: e.target.value })} />
                </div>
                <div>
                  <label className="field-label">Tipo</label>
                  <select className="select" value={eventoForm.tipo} onChange={(e) => onEventoFormChange({ ...eventoForm, tipo: e.target.value })}>
                    {EVENTI_TIPI.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label">Descrizione</label>
                  <input className="input" value={eventoForm.descrizione} onChange={(e) => onEventoFormChange({ ...eventoForm, descrizione: e.target.value })} />
                </div>
              </div>
              <div className="mt-3">
                <button className="btn btn-outline" onClick={onAddEvento}>Aggiungi evento</button>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="table">
                  <thead><tr><th>Data</th><th>Tipo</th><th>Descrizione</th><th>Azioni</th></tr></thead>
                  <tbody>
                    {sabatiniEventi.length === 0 && <tr><td colSpan={4}>Nessun evento</td></tr>}
                    {sabatiniEventi.map((r) => (
                      <tr key={r.id}>
                        <td>{r.data_evento ? r.data_evento.slice(0, 10) : "-"}</td>
                        <td>{r.tipo}</td>
                        <td>{r.descrizione || "-"}</td>
                        <td><button className="btn btn-danger" onClick={() => onDeleteEvento(r.id)}>Elimina</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="section-gap">
            <h3 className="section-title">Allegati</h3>
            {mode === "new" && <p className="text-sm text-muted">Salva prima la pratica per poter caricare allegati.</p>}
            {mode === "edit" && (
              <div className="mt-3">
                {attachmentsError && <p className="text-sm text-red-600">{attachmentsError}</p>}
                <div
                  className={`dropzone ${dragOver ? "dragover" : ""}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) onUpload(file);
                  }}
                >
                  Trascina qui un file oppure clicca per selezionarlo
                  <div className="mt-2">
                    <input
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUpload(file);
                      }}
                    />
                  </div>
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="table">
                    <thead><tr><th>File</th><th>Preview</th><th>Caricato</th><th>Azioni</th></tr></thead>
                    <tbody>
                      {attachments.length === 0 && <tr><td colSpan={4}>Nessun allegato</td></tr>}
                      {attachments.map((att) => (
                        <tr key={att.id}>
                          <td>{att.original_name}</td>
                          <td>
                            {att.original_name.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                              attachmentPreviews[att.id] ? (
                                <img
                                  className="attachment-thumb"
                                  src={attachmentPreviews[att.id]}
                                  alt={att.original_name}
                                />
                              ) : (
                                <span className="text-muted">Anteprima non disponibile</span>
                              )
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td>{att.uploaded_at ? new Date(att.uploaded_at).toLocaleDateString("it-IT") : "-"}</td>
                          <td className="flex flex-wrap gap-2">
                            <button className="btn btn-outline" onClick={() => onOpenAttachment(att)}>Apri</button>
                            <button className="btn btn-outline" onClick={() => onDeleteAttachment(att.id)}>Elimina</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
