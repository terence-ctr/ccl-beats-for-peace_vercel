-- Script simple pour créer les événements un par un

-- Événement 1: Inscriptions
INSERT INTO `evenement` 
(`name`, `description`, `phase_order`, `status`, `start_date`, `end_date`, `hashtag`, `vote_actif`, `sound_url`, `audio_rap_url`, `created_at`) 
VALUES 
('Inscriptions', 'Phase d\'inscription et de soumission des candidatures', 1, 'active', '2026-02-27 23:00:00', '2026-03-07 23:00:00', '#FESTIRASInscription', 1, 'http://localhost:3001/uploads/audio/ccl_beats_instrumental.mp3', NULL, NOW());

-- Événement 2: Éliminatoires
INSERT INTO `evenement` 
(`name`, `description`, `phase_order`, `status`, `hashtag`, `vote_actif`, `created_at`) 
VALUES 
('Éliminatoires', 'Phase de sélection et votes du public', 2, 'terminee', '#FESTIRASEliminatoires', 0, NOW());

-- Événement 3: Grande Finale
INSERT INTO `evenement` 
(`name`, `description`, `phase_order`, `status`, `hashtag`, `vote_actif`, `created_at`) 
VALUES 
('Grande Finale', 'Finale nationale avec jury et public', 3, 'future', '#FESTIRASFinale', 0, NOW());
