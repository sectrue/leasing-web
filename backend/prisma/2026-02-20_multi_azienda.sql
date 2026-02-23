CREATE TABLE IF NOT EXISTS aziende (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO aziende (id, nome)
VALUES (1, 'Azienda 1'), (2, 'Azienda 2')
ON DUPLICATE KEY UPDATE nome = VALUES(nome);

ALTER TABLE leasing_pratiche
  ADD COLUMN IF NOT EXISTS azienda_id INT NOT NULL DEFAULT 1 AFTER id;
CREATE INDEX IF NOT EXISTS idx_pratiche_azienda_id ON leasing_pratiche (azienda_id);

ALTER TABLE leasing_contracts
  ADD COLUMN IF NOT EXISTS azienda_id INT NOT NULL DEFAULT 1 AFTER id;
CREATE INDEX IF NOT EXISTS idx_leasing_contracts_azienda_id ON leasing_contracts (azienda_id);

ALTER TABLE leasing_pratiche_attachments
  ADD COLUMN IF NOT EXISTS azienda_id INT NOT NULL DEFAULT 1 AFTER id;
CREATE INDEX IF NOT EXISTS idx_pratica_attachments_azienda_id ON leasing_pratiche_attachments (azienda_id);

ALTER TABLE societa_leasing
  ADD COLUMN IF NOT EXISTS azienda_id INT NOT NULL DEFAULT 1 AFTER id;
CREATE INDEX IF NOT EXISTS idx_societa_leasing_azienda_id ON societa_leasing (azienda_id);

ALTER TABLE sabatini_erogazioni
  ADD COLUMN IF NOT EXISTS azienda_id INT NOT NULL DEFAULT 1 AFTER id;
CREATE INDEX IF NOT EXISTS idx_sabatini_erogazioni_azienda_id ON sabatini_erogazioni (azienda_id);

ALTER TABLE sabatini_eventi
  ADD COLUMN IF NOT EXISTS azienda_id INT NOT NULL DEFAULT 1 AFTER id;
CREATE INDEX IF NOT EXISTS idx_sabatini_eventi_azienda_id ON sabatini_eventi (azienda_id);

UPDATE leasing_pratiche SET azienda_id = 1 WHERE azienda_id IS NULL;
UPDATE leasing_contracts SET azienda_id = 1 WHERE azienda_id IS NULL;
UPDATE leasing_pratiche_attachments SET azienda_id = 1 WHERE azienda_id IS NULL;
UPDATE societa_leasing SET azienda_id = 1 WHERE azienda_id IS NULL;
UPDATE sabatini_erogazioni SET azienda_id = 1 WHERE azienda_id IS NULL;
UPDATE sabatini_eventi SET azienda_id = 1 WHERE azienda_id IS NULL;
