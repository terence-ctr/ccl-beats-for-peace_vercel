-- Réinitialiser les IDs des votes à 1
-- Ne supprime pas les données, juste réinitialise l'auto-incrément

-- Réinitialiser l'auto-incrément à 1
ALTER TABLE scores AUTO_INCREMENT = 1;

-- Réinitialiser l'auto-incrément de la table scores si besoin
ALTER TABLE scores AUTO_INCREMENT = 1;

-- Afficher confirmation
SELECT 'IDs des votes réinitialisés à 1' AS message;
