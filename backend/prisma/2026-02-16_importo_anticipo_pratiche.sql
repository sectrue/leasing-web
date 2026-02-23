ALTER TABLE leasing_pratiche
  ADD COLUMN IF NOT EXISTS importo_anticipo DECIMAL(18,2) NULL
  AFTER importo_rata;
