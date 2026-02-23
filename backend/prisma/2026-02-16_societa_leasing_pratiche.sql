CREATE TABLE IF NOT EXISTS societa_leasing (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  referente VARCHAR(255) NULL,
  telefono VARCHAR(50) NULL,
  email VARCHAR(255) NULL,
  note TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE leasing_pratiche
  ADD COLUMN IF NOT EXISTS societa_leasing_id INT NULL AFTER leasing;

CREATE INDEX IF NOT EXISTS idx_pratiche_societa_leasing_id
  ON leasing_pratiche (societa_leasing_id);
