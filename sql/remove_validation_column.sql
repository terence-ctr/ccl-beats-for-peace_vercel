-- Supprimer la colonne validation et utiliser statut à la place
-- La colonne statut existe déjà avec les valeurs nécessaires

-- Supprimer la colonne validation
ALTER TABLE artiste DROP COLUMN validation;

-- Supprimer l'index sur validation (s'il existe)
DROP INDEX IF EXISTS idx_validation ON artiste;

-- Mettre à jour les données pour utiliser statut au lieu de validation
-- Les candidats avec validation = 'validated' auront statut = 'validee'
-- Les candidats avec validation = 'rejected' auront statut = 'rejetee'  
-- Les candidats avec validation = 'pending' garderont leur statut actuel

-- Vérifier le résultat
SELECT 
  id, 
  nom_artiste, 
  statut,
  created_at 
FROM artiste 
ORDER BY created_at DESC 
LIMIT 10;
