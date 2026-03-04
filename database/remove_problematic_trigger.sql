-- Supprimer le trigger problématique qui cause l'erreur 500
DROP TRIGGER IF EXISTS `after_vote_insert_sync_scores`;

-- Afficher les triggers restants pour vérification
SHOW TRIGGERS LIKE '%vote%';
