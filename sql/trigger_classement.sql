-- Trigger pour mettre à jour automatiquement le classement quand score_total change
DELIMITER $$

CREATE TRIGGER update_ranking_after_score_change
AFTER UPDATE ON scores
FOR EACH ROW
BEGIN
    -- Mettre à jour le classement pour toute la phase
    UPDATE scores s1 
    SET classement = (
        SELECT COUNT(*) + 1 
        FROM scores s2 
        WHERE s2.phase_id = s1.phase_id 
        AND CAST(s2.score_total AS DECIMAL(10,2)) > CAST(s1.score_total AS DECIMAL(10,2))
    )
    WHERE phase_id = NEW.phase_id;
END$$

CREATE TRIGGER update_ranking_after_insert
AFTER INSERT ON scores
FOR EACH ROW
BEGIN
    -- Mettre à jour le classement pour toute la phase
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
