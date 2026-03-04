-- Insérer les scores de l'artiste MKA (id: 2) dans la table scores
-- Phase 1 (Inscriptions) = id: 1

INSERT INTO `scores` (
  `artiste_id`, 
  `phase_id`, 
  `score_vote`, 
  `score_like`, 
  `score_jury`, 
  `classement`, 
  `score_total`,
  `created_at`
) VALUES (
  2, -- artiste_id (MKA)
  1, -- phase_id (Phase 1 - Inscriptions)
  1, -- score_vote (total_votes de la table artiste)
  99, -- score_like (total_likes de la table artiste)
  0.00, -- score_jury de la table artiste
  NULL, -- classement (calculé plus tard avec RANK())
  1.00, -- score_final de la table artiste
  NOW() -- created_at
);

-- Vérifier l'insertion
SELECT * FROM `scores` WHERE `artiste_id` = 2;
