ALTER TABLE leasing_pratiche
  ADD COLUMN sabatini_stato VARCHAR(50) NULL,
  ADD COLUMN protocollo_domanda VARCHAR(100) NULL,
  ADD COLUMN data_domanda DATE NULL,
  ADD COLUMN cup VARCHAR(100) NULL,
  ADD COLUMN decreto_numero VARCHAR(100) NULL,
  ADD COLUMN decreto_data DATE NULL,
  ADD COLUMN cor_id VARCHAR(100) NULL,
  ADD COLUMN contributo_tipo VARCHAR(50) NULL,
  ADD COLUMN contributo_teorico_tot DECIMAL(12,2) NULL,
  ADD COLUMN contributo_ammesso_tot DECIMAL(12,2) NULL,
  ADD COLUMN note_sabatini TEXT NULL,
  ADD COLUMN data_stipula_prevista DATE NULL,
  ADD COLUMN data_stipula_effettiva DATE NULL,
  ADD COLUMN data_consegna_prevista DATE NULL,
  ADD COLUMN data_consegna_effettiva DATE NULL,
  ADD COLUMN data_rendicontazione_scadenza DATE NULL,
  ADD COLUMN data_rendicontazione_inviata DATE NULL,
  ADD COLUMN data_erogazione_prevista DATE NULL,
  ADD COLUMN data_erogazione_effettiva DATE NULL;

CREATE INDEX idx_pratiche_sabatini_stato ON leasing_pratiche (sabatini_stato);
CREATE INDEX idx_pratiche_rendicontazione_scadenza ON leasing_pratiche (data_rendicontazione_scadenza);

CREATE TABLE sabatini_erogazioni (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pratica_id INT NOT NULL,
  numero_rata INT NULL,
  importo DECIMAL(12,2) NULL,
  data_prevista DATE NULL,
  data_pagata DATE NULL,
  stato VARCHAR(30) NOT NULL DEFAULT 'prevista',
  note TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_sabatini_erogazioni_pratica (pratica_id),
  INDEX idx_sabatini_erogazioni_stato (stato)
);

CREATE TABLE sabatini_eventi (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pratica_id INT NOT NULL,
  data_evento DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tipo VARCHAR(50) NOT NULL,
  descrizione TEXT NULL,
  utente_id INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sabatini_eventi_pratica (pratica_id),
  INDEX idx_sabatini_eventi_data (data_evento)
);
