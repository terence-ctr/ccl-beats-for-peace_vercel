-- Solution alternative pour le trigger de classement
-- Supprimer les anciens triggers
DROP TRIGGER IF EXISTS update_ranking_after_score_change;
DROP TRIGGER IF EXISTS update_ranking_after_insert;

-- Créer une table temporaire pour stocker les mises à jour de classement
CREATE TABLE IF NOT EXISTS ranking_updates (
    phase_id INT NOT NULL,
    needs_update BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (phase_id)
);

-- Trigger BEFORE UPDATE pour marquer la phase comme needing update
DELIMITER $$
CREATE TRIGGER mark_ranking_update_before_score_change
BEFORE UPDATE ON scores
FOR EACH ROW
BEGIN
    IF NEW.score_total != OLD.score_total THEN
        INSERT INTO ranking_updates (phase_id, needs_update, last_updated)
        VALUES (NEW.phase_id, TRUE, NOW())
        ON DUPLICATE KEY UPDATE 
            needs_update = TRUE, 
            last_updated = NOW();
    END IF;
END$$

-- Trigger BEFORE INSERT pour marquer la phase comme needing update  
DELIMITER $$
CREATE TRIGGER mark_ranking_update_before_insert
BEFORE INSERT ON scores
FOR EACH ROW
BEGIN
    INSERT INTO ranking_updates (phase_id, needs_update, last_updated)
    VALUES (NEW.phase_id, TRUE, NOW())
    ON DUPLICATE KEY UPDATE 
        needs_update = TRUE, 
        last_updated = NOW();
END$$
DELIMITER ;

-- Mettre à jour le classement existant
UPDATE scores s1 
SET classement = (
    SELECT COUNT(*) + 1 
    FROM scores s2 
    WHERE s2.phase_id = s1.phase_id 
    AND CAST(s2.score_total AS DECIMAL(10,2)) > CAST(s1.score_total AS DECIMAL(10,2))
);

-- Vérifier le résultat
SELECT artiste_id, score_vote, score_jury, score_total, classement 
FROM scores 
ORDER BY classement;
