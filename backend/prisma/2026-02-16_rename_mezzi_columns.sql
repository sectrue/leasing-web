ALTER TABLE leasing_contracts
  CHANGE COLUMN importo importo_mezzo DECIMAL(12,2) NULL,
  CHANGE COLUMN pratica_40 importo_pratica_40 VARCHAR(255) NULL,
  CHANGE COLUMN importo_contratto importo_totale_mezzo DECIMAL(12,2) NOT NULL DEFAULT 0.00;
