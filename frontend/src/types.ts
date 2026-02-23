export type User = { id: number; username: string; role: string };

export type Azienda = { id: number; nome: string; created_at: string };

export type PraticaRow = {
  id: number;
  nr_ctr: string | null;
  leasing: string | null;
  societa_leasing_id: number | null;
  societa_leasing_nome: string | null;
  broker: string | null;
  data_inizio: string | null;
  data_fine: string | null;
  sabatini: boolean;
  sabatini_stato: string | null;
  mezzi_count: number;
  total_importo_finanziato: string;
  stato: string;
};

export type PraticheResponse = {
  items: PraticaRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type KpiData = {
  pratiche_totali: number;
  pratiche_attive: number;
  pratiche_in_lavorazione: number;
  pratiche_chiuse: number;
  pratiche_in_scadenza_30g: number;
  contratti_ultimi_30g: number;
  sabatini_percent: number;
  importo_totale: string;
  importo_medio: string;
};

export type MonthlyStat = {
  ym: string;
  total: string;
  count: number;
};

export type MezzoRow = {
  id: number;
  pratica_id?: number | null;
  numero_interno: string;
  mezzo: string;
  fornitore: string | null;
  descrizione_bene: string | null;
  allestimento: string | null;
  importo_mezzo: number | string | null;
  importo_allestimento_materiale: number | string | null;
  importo_pratica_40: string | null;
  importo_finanziato: number | string;
  importo_totale_mezzo: number | string;
  note: string | null;
};

export type MezziResponse = {
  items: MezzoRow[];
  total: number;
  page: number;
  pageSize: number;
};

export type PraticaFormState = {
  leasing: string;
  societa_leasing_id: string;
  broker: string;
  nr_ctr: string;
  data_inizio: string;
  data_fine: string;
  durata: string;
  importo_rata: string;
  importo_anticipo: string;
  importo_riscatto: string;
  sabatini: boolean;
  importo_sabatini: string;
  sabatini_data: string;
  sabatini_stato: string;
  protocollo_domanda: string;
  data_domanda: string;
  cup: string;
  decreto_numero: string;
  decreto_data: string;
  note_sabatini: string;
};

export type PraticaAttachment = {
  id: number;
  original_name: string;
  stored_name: string;
  stored_path: string;
  uploaded_at: string;
};

export type PraticaOption = {
  id: number;
  nr_ctr: string | null;
  leasing: string | null;
  societa_leasing_id?: number | null;
  broker: string | null;
};

export type LeasingCompany = {
  id: number;
  nome: string;
  referente: string | null;
  telefono: string | null;
  email: string | null;
  note: string | null;
  created_at: string;
};

export type SabatiniErogazione = {
  id: number;
  pratica_id: number;
  numero_rata: number | null;
  importo: string | number | null;
  data_prevista: string | null;
  data_pagata: string | null;
  stato: string;
  note: string | null;
};

export type SabatiniEvento = {
  id: number;
  pratica_id: number;
  data_evento: string;
  tipo: string;
  descrizione: string | null;
  utente_id: number | null;
};
