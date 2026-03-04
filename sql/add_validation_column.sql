-- Ajouter une colonne validation à la table artiste
-- Cette colonne permettra à l'organisateur de valider/rejeter les candidats

ALTER TABLE artiste 
ADD COLUMN validation ENUM('pending', 'validated', 'rejected') NOT NULL DEFAULT 'pending' 
AFTER statut;

-- Ajouter un index pour optimiser les requêtes sur cette colonne
CREATE INDEX idx_validation ON artiste(validation);

-- Mettre à jour les candidats existants selon leur statut actuel
-- Les candidats avec statut 'validee' sont considérés comme 'validated'
-- Les candidats avec statut 'rejetee' sont considérés comme 'rejected'  
-- Les autres restent 'pending'
UPDATE artiste SET validation = 
  CASE 
    WHEN statut = 'validee' THEN 'validated'
    WHEN statut = 'rejetee' THEN 'rejected'
    ELSE 'pending'
  END;

-- Afficher le résultat pour vérification
SELECT 
  id, 
  nom_artiste, 
  statut, 
  validation,
  created_at 
FROM artiste 
ORDER BY created_at DESC 
LIMIT 10;
