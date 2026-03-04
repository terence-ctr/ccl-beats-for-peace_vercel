-- Vérifier tous les triggers sur la base de données
SHOW TRIGGERS;

-- Vérifier spécifiquement les triggers sur la table votes
SHOW TRIGGERS WHERE `Table` = 'votes';

-- Vérifier les contraintes sur la table votes
SHOW CREATE TABLE votes;
