-- Installation du trigger de mise à jour automatique du classement
-- Exécuter ce script dans phpMyAdmin ou directement en MySQL

-- Supprimer les anciens triggers s'ils existent
DROP TRIGGER IF EXISTS update_ranking_after_score_change;
DROP TRIGGER IF EXISTS update_ranking_after_insert;

-- Créer le trigger pour les mises à jour
DELIMITER $$
CREATE TRIGGER update_ranking_after_score_change
AFTER UPDATE ON scores
FOR EACH ROW
BEGIN
    -- Mettre à jour le classement pour toute la phase quand un score change
    UPDATE scores s1 
    SET classement = (
        SELECT COUNT(*) + 1 
        FROM scores s2 
        WHERE s2.phase_id = s1.phase_id 
        AND CAST(s2.score_total AS DECIMAL(10,2)) > CAST(s1.score_total AS DECIMAL(10,2))
    )
    WHERE phase_id = NEW.phase_id;
END$$
DELIMITER ;

-- Créer le trigger pour les insertions
DELIMITER $$
CREATE TRIGGER update_ranking_after_insert
AFTER INSERT ON scores
FOR EACH ROW
BEGIN
    -- Mettre à jour le classement pour toute la phase quand un nouveau score est ajouté
    UPDATE scores s1 
    SET classement = (
        SELECT COUNT(*) + 1 
        FROM scores s2 
        WHERE s2.phase_id = s1.phase_id 
        AND CAST(s2.score_total AS DECIMAL(10,2)) > CAST(s1.score_total AS DECIMAL(10,2))
    )
    WHERE phase_id = NEW.phase_id;
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
