-- Réinitialiser tous les votes à 1
-- Conserve la structure mais réinitialise les IDs

-- Supprimer tous les votes existants
DELETE FROM votes;

-- Réinitialiser l'auto-incrément à 1
ALTER TABLE votes AUTO_INCREMENT = 1;

-- Insérer un vote de test pour le jury (ID: 10) votant pour l'artiste MKA (ID: 2) en phase 1
INSERT INTO votes (id, voter_id, user_id, artiste_id, phase_id, vote_count, created_at) VALUES 
('vote_1_abc123', 10, 10, 2, 1, NOW());

-- Réinitialiser les scores pour cette phase
DELETE FROM scores WHERE phase_id = 1 AND artiste_id = 2;

-- Insérer le score correspondant
INSERT INTO scores (artiste_id, phase_id, score_vote, score_like, score_jury, score_total, created_at) VALUES 
(2, 1, 1, 0, 0, 1.0, NOW());

-- Vérifier les résultats
SELECT 'Votes réinitialisés avec succès' as message;
SELECT * FROM votes;
SELECT * FROM scores WHERE artiste_id = 2 AND phase_id = 1;
