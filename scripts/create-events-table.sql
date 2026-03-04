-- Créer la table evenement si elle n'existe pas
CREATE TABLE IF NOT EXISTS `evenement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `phase_order` int(11) NOT NULL,
  `status` enum('future','active','terminee') NOT NULL DEFAULT 'future',
  `start_date` timestamp NULL DEFAULT NULL,
  `end_date` timestamp NULL DEFAULT NULL,
  `hashtag` varchar(100) DEFAULT NULL,
  `vote_actif` tinyint(1) DEFAULT 0,
  `periode_affichage` varchar(255) DEFAULT NULL,
  `sound_url` text DEFAULT NULL,
  `audio_rap_url` text DEFAULT NULL,
  `audio_slam_url` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- Insérer les événements
INSERT INTO `evenement` (`name`, `description`, `phase_order`, `status`, `start_date`, `end_date`, `hashtag`, `vote_actif`, `sound_url`, `audio_rap_url`, `created_at`) VALUES 
('Inscriptions', 'Phase d\'inscription et de soumission des candidatures', 1, 'active', '2026-02-27 23:00:00', '2026-03-07 23:00:00', '#FESTIRASInscription', 1, 'http://localhost:3001/uploads/audio/ccl_beats_instrumental.mp3', NULL, NOW());

INSERT INTO `evenement` (`name`, `description`, `phase_order`, `status`, `hashtag`, `vote_actif`, `created_at`) VALUES 
('Éliminatoires', 'Phase de sélection et votes du public', 2, 'terminee', '#FESTIRASEliminatoires', 0, NOW());

INSERT INTO `evenement` (`name`, `description`, `phase_order`, `status`, `hashtag`, `vote_actif`, `created_at`) VALUES 
('Grande Finale', 'Finale nationale avec jury et public', 3, 'future', '#FESTIRASFinale', 0, NOW());
