-- Ajouter la colonne token à la table users
ALTER TABLE users ADD COLUMN token TEXT NULL;

-- Ajouter un index pour optimiser les recherches par token
CREATE INDEX idx_users_token ON users(token);

-- Mettre à jour la structure pour inclure la colonne token dans les futures insertions
-- La colonne est ajoutée comme NULLABLE pour ne pas casser les données existantes
