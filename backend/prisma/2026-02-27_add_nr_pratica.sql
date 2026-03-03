-- Add nr_pratica to leasing_pratiche and backfill sequence (oldest -> newest).
-- Runs per azienda_id, ordered by created_at then id.

ALTER TABLE leasing_pratiche
  ADD COLUMN nr_pratica VARCHAR(100) NULL AFTER azienda_id;

SET @row_num := 0;
SET @cur_azienda := 0;

UPDATE leasing_pratiche p
JOIN (
  SELECT id,
         @row_num := IF(@cur_azienda = azienda_id, @row_num + 1, 1) AS nr_pratica,
         @cur_azienda := azienda_id AS azienda_id
  FROM leasing_pratiche
  ORDER BY azienda_id ASC, created_at ASC, id ASC
) seq ON seq.id = p.id
SET p.nr_pratica = seq.nr_pratica
WHERE p.nr_pratica IS NULL;
