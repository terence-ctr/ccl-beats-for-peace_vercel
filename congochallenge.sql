-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mar. 24 fév. 2026 à 10:44
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `congochallenge`
--

-- --------------------------------------------------------

--
-- Structure de la table `artiste`
--

CREATE TABLE `artiste` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `nom_complet` varchar(255) NOT NULL,
  `nom_artiste` varchar(255) NOT NULL,
  `date_naissance` date NOT NULL,
  `sexe` enum('masculin','feminin','autre') NOT NULL,
  `discipline` enum('rap','slam','chant','danse','theatre','autre') NOT NULL,
  `adresse` text NOT NULL,
  `quartier` varchar(255) DEFAULT NULL,
  `telephone` varchar(20) NOT NULL,
  `email` varchar(255) NOT NULL,
  `biographie` text DEFAULT NULL,
  `photo_url` text DEFAULT NULL,
  `video_url` text DEFAULT NULL,
  `piece_identite_url` text DEFAULT NULL,
  `statut` enum('en_attente','validee','rejetee','en_competition','elimine','laureat') NOT NULL DEFAULT 'en_attente',
  `festiras_id` varchar(50) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `ville` varchar(100) DEFAULT NULL,
  `pays` varchar(100) DEFAULT 'RDC',
  `hashtag_officiel` varchar(100) DEFAULT NULL,
  `total_votes` int(11) DEFAULT 0,
  `score_jury` decimal(5,2) DEFAULT 0.00,
  `score_final` decimal(5,2) DEFAULT 0.00,
  `phase_actuelle_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Déchargement des données de la table `artiste`
--

INSERT INTO `artiste` (`id`, `user_id`, `nom_complet`, `nom_artiste`, `date_naissance`, `sexe`, `discipline`, `adresse`, `quartier`, `telephone`, `email`, `biographie`, `photo_url`, `video_url`, `piece_identite_url`, `statut`, `festiras_id`, `province`, `ville`, `pays`, `hashtag_officiel`, `total_votes`, `score_jury`, `score_final`, `phase_actuelle_id`, `created_at`, `updated_at`) VALUES
(1, 7, 'Terence', 'MC', '1998-02-23', 'masculin', 'rap', 'sagesse N°7', NULL, '+243849585067', 'terencemusimbi1@gmail.com', 'efezfezgezgezezfez', '/uploads/photos/photo-bc4f862f-a98f-4dd9-8c2e-21244d811c68.png', '/uploads/videos/video-72eeb19e-1154-4516-b227-94ea54046fce.mpeg', '/uploads/documents/piece-1fd1fc92-a506-4e46-861b-9c7fd0bed497.png', 'validee', 'FTR-2026-0002', 'Sud kivu', 'Bukavu', 'RDC', NULL, 0, 0.00, 0.00, NULL, '2026-02-23 15:08:38', '2026-02-23 15:41:33'),
(2, 8, 'Musimbi', 'MKA', '1997-02-23', 'masculin', 'rap', 'sagesse N°7', NULL, '+24398762571', 'terencemusimbi002@gmail.com', 'ZAEGREHTHGEFZAEFZEFEZFDSFEZ', '/uploads/photos/photo-849032b5-bd41-4101-abba-e79be14026e9.png', '/uploads/videos/video-72eeb19e-1154-4516-b227-94ea54046fce.mpeg', '/uploads/documents/piece-90d0a429-c258-40c7-bb3c-fdd9a761e756.png', 'validee', 'FTR-2026-0001', 'KOngo central', 'Kinshasa', 'RDC', NULL, 0, 0.00, 0.00, NULL, '2026-02-23 15:17:53', '2026-02-23 15:41:31');

--
-- Déclencheurs `artiste`
--
DELIMITER $$
CREATE TRIGGER `after_artiste_status_update` AFTER UPDATE ON `artiste` FOR EACH ROW BEGIN
    IF NEW.statut = 'validee' AND OLD.statut = 'en_attente' THEN
        INSERT IGNORE INTO user_roles (user_id, role) VALUES (NEW.user_id, 'candidate');
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `before_artiste_status_update` BEFORE UPDATE ON `artiste` FOR EACH ROW BEGIN
    DECLARE artist_count INT;
    IF NEW.statut = 'validee' AND OLD.statut = 'en_attente' THEN
        SELECT COUNT(*) + 1 INTO artist_count FROM artiste WHERE statut != 'en_attente';
        SET NEW.festiras_id = CONCAT('FTR-2026-', LPAD(artist_count, 4, '0'));
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `evenement`
--

CREATE TABLE `evenement` (
  `id` int(11) NOT NULL,
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
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Déchargement des données de la table `evenement`
--

INSERT INTO `evenement` (`id`, `name`, `description`, `phase_order`, `status`, `start_date`, `end_date`, `hashtag`, `vote_actif`, `periode_affichage`, `sound_url`, `audio_rap_url`, `audio_slam_url`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 'Inscriptions', 'Phase d\'inscription et de soumission des candidatures', 1, 'active', NULL, NULL, '#FESTIRASInscription', 0, NULL, NULL, NULL, NULL, NULL, '2026-02-23 14:15:29', '2026-02-23 16:01:37'),
(2, 'Éliminatoires', 'Phase de sélection et votes du public', 2, 'future', NULL, NULL, '#FESTIRASEliminatoires', 0, NULL, NULL, NULL, NULL, NULL, '2026-02-23 14:15:29', '2026-02-23 14:15:29'),
(3, 'Grande Finale', 'Finale nationale avec jury et public', 3, 'future', NULL, NULL, '#FESTIRASFinale', 0, NULL, NULL, NULL, NULL, NULL, '2026-02-23 14:15:29', '2026-02-23 14:15:29');

-- --------------------------------------------------------

--
-- Structure de la table `jury_info`
--

CREATE TABLE `jury_info` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `instagram_url` text DEFAULT NULL,
  `competences` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `photo_url` text DEFAULT NULL,
  `nom_complet` varchar(255) DEFAULT NULL,
  `specialite` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `likes_tiktok`
--

CREATE TABLE `likes_tiktok` (
  `id` int(11) NOT NULL,
  `artiste_id` int(11) NOT NULL,
  `phase_id` int(11) NOT NULL,
  `hashtag` varchar(100) DEFAULT NULL,
  `nombre_likes` int(11) DEFAULT 0,
  `date_sync` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notes_jury`
--

CREATE TABLE `notes_jury` (
  `id` int(11) NOT NULL,
  `jury_id` int(11) NOT NULL,
  `artiste_id` int(11) NOT NULL,
  `phase_id` int(11) NOT NULL,
  `note` int(11) NOT NULL CHECK (`note` >= 0 and `note` <= 50),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Déclencheurs `notes_jury`
--
DELIMITER $$
CREATE TRIGGER `after_note_jury_insert` AFTER INSERT ON `notes_jury` FOR EACH ROW BEGIN
    UPDATE artiste SET score_jury = (
        SELECT COALESCE(AVG(note), 0) FROM notes_jury WHERE artiste_id = NEW.artiste_id
    ) WHERE id = NEW.artiste_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `type` varchar(50) DEFAULT 'info',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `profiles`
--

CREATE TABLE `profiles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `phone_verified` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Déchargement des données de la table `profiles`
--

INSERT INTO `profiles` (`id`, `user_id`, `username`, `email`, `telephone`, `avatar_url`, `nom`, `prenom`, `email_verified`, `phone_verified`, `created_at`, `updated_at`) VALUES
(10, 7, 'Terence', 'terencemusimbi1@gmail.com', NULL, NULL, NULL, NULL, 1, 0, '2026-02-23 14:59:00', '2026-02-23 14:59:18'),
(12, 8, 'Raphael', 'terencemusimbi002@gmail.com', NULL, NULL, NULL, NULL, 1, 0, '2026-02-23 15:15:41', '2026-02-23 15:16:39'),
(14, 9, 'vote', 'bagwind883@gmail.com', NULL, NULL, NULL, NULL, 1, 0, '2026-02-23 15:37:47', '2026-02-23 15:38:30');

-- --------------------------------------------------------

--
-- Structure de la table `scores`
--

CREATE TABLE `scores` (
  `id` int(11) NOT NULL,
  `artiste_id` int(11) NOT NULL,
  `phase_id` int(11) NOT NULL,
  `score_vote` int(11) DEFAULT 0,
  `score_like` int(11) DEFAULT 0,
  `score_jury` int(11) DEFAULT 0,
  `score_total` int(11) GENERATED ALWAYS AS (`score_vote` + `score_like` + `score_jury`) STORED,
  `classement` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `social_links`
--

CREATE TABLE `social_links` (
  `id` int(11) NOT NULL,
  `platform` varchar(50) NOT NULL,
  `url` text NOT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Déchargement des données de la table `social_links`
--

INSERT INTO `social_links` (`id`, `platform`, `url`, `is_active`, `updated_at`) VALUES
(1, 'instagram', 'https://www.instagram.com/festiras_officiel/', 1, '2026-02-23 14:15:29'),
(2, 'facebook', 'https://www.facebook.com/festirasbukavu', 1, '2026-02-23 14:15:29'),
(3, 'twitter', 'https://twitter.com/festiras', 1, '2026-02-23 14:15:29'),
(4, 'youtube', 'https://www.youtube.com/festiras', 1, '2026-02-23 14:15:29'),
(5, 'google', 'https://accounts.google.com/', 1, '2026-02-23 14:15:29');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `raw_user_meta_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`raw_user_meta_data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_sign_in_at` timestamp NULL DEFAULT NULL,
  `email_confirmed_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `phone` varchar(20) DEFAULT NULL,
  `phone_confirmed_at` timestamp NULL DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `email`, `password_hash`, `username`, `raw_user_meta_data`, `created_at`, `updated_at`, `last_sign_in_at`, `email_confirmed_at`, `phone`, `phone_confirmed_at`, `email_verified`) VALUES
(7, 'terencemusimbi1@gmail.com', '$2a$12$PAT5ZR9fig/pqFZb9kPD5.AFSe/x79mnsB12mdkdOgokg0SJNjDl2', 'Terence', '{\"username\":\"Terence\"}', '2026-02-23 14:59:00', '2026-02-24 09:42:57', '2026-02-24 09:42:57', '2026-02-23 14:59:00', NULL, NULL, 1),
(8, 'terencemusimbi002@gmail.com', '$2a$12$5p4V5MLQhjdj/0NEfaapLO6NKvRIBplSJeEKU0N.TZX0Ln9SX8Ub6', 'Raphael', '{\"username\":\"Raphael\"}', '2026-02-23 15:15:41', '2026-02-23 16:01:07', '2026-02-23 16:01:07', '2026-02-23 15:15:41', NULL, NULL, 1),
(9, 'bagwind883@gmail.com', '$2a$12$DGLVo/rA6qrrMZEiK13LMOZsxlgS0e8beiAzL7rssORWvZZhJ4nyi', 'vote', '{\"username\":\"vote\"}', '2026-02-23 15:37:47', '2026-02-23 15:54:07', '2026-02-23 15:54:07', '2026-02-23 15:37:47', NULL, NULL, 1);

--
-- Déclencheurs `users`
--
DELIMITER $$
CREATE TRIGGER `after_user_insert` AFTER INSERT ON `users` FOR EACH ROW BEGIN
    INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'visitor');
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `after_user_insert_profile` AFTER INSERT ON `users` FOR EACH ROW BEGIN
    INSERT INTO profiles (user_id, username, email) VALUES (NEW.id, NEW.username, NEW.email);
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('visitor','candidate','jury','organizer','super_admin') NOT NULL DEFAULT 'visitor',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Déchargement des données de la table `user_roles`
--

INSERT INTO `user_roles` (`id`, `user_id`, `role`, `created_at`) VALUES
(8, 7, 'organizer', '2026-02-23 14:59:00'),
(10, 8, 'visitor', '2026-02-23 15:15:41'),
(12, 9, 'visitor', '2026-02-23 15:37:47'),
(14, 8, 'candidate', '2026-02-23 15:41:31'),
(16, 7, 'candidate', '2026-02-23 15:41:33');

-- --------------------------------------------------------

--
-- Structure de la table `verification_codes`
--

CREATE TABLE `verification_codes` (
  `id` int(11) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `code` varchar(10) NOT NULL,
  `type` enum('email','phone') NOT NULL DEFAULT 'email',
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email` varchar(255) DEFAULT NULL,
  `email_code` varchar(10) DEFAULT NULL,
  `telephone_code` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Déchargement des données de la table `verification_codes`
--

INSERT INTO `verification_codes` (`id`, `identifier`, `code`, `type`, `expires_at`, `created_at`, `email`, `email_code`, `telephone_code`) VALUES
(7, '+243849585067', '', 'phone', '2026-02-23 15:09:03', '2026-02-23 14:59:03', NULL, NULL, '742817'),
(9, '243849910980', '', 'phone', '2026-02-23 15:25:45', '2026-02-23 15:15:45', NULL, NULL, '309564'),
(11, '098773282679', '', 'phone', '2026-02-23 15:47:51', '2026-02-23 15:37:51', NULL, NULL, '503971');

-- --------------------------------------------------------

--
-- Structure de la table `videos`
--

CREATE TABLE `videos` (
  `id` int(11) NOT NULL,
  `artiste_id` int(11) NOT NULL,
  `phase_id` int(11) NOT NULL,
  `url_video` text NOT NULL,
  `description` text DEFAULT NULL,
  `source` enum('plateforme','tiktok') DEFAULT 'plateforme',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `votes`
--

CREATE TABLE `votes` (
  `id` int(11) NOT NULL,
  `voter_id` int(11) NOT NULL,
  `artiste_id` int(11) NOT NULL,
  `phase_id` int(11) NOT NULL,
  `vote_count` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- Déclencheurs `votes`
--
DELIMITER $$
CREATE TRIGGER `after_vote_insert` AFTER INSERT ON `votes` FOR EACH ROW BEGIN
    UPDATE artiste SET total_votes = (
        SELECT COALESCE(SUM(vote_count), 0) FROM votes WHERE artiste_id = NEW.artiste_id
    ) WHERE id = NEW.artiste_id;
END
$$
DELIMITER ;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `artiste`
--
ALTER TABLE `artiste`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `festiras_id` (`festiras_id`),
  ADD KEY `phase_actuelle_id` (`phase_actuelle_id`),
  ADD KEY `idx_artiste_user_id` (`user_id`),
  ADD KEY `idx_artiste_statut` (`statut`);

--
-- Index pour la table `evenement`
--
ALTER TABLE `evenement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `created_by` (`created_by`);

--
-- Index pour la table `jury_info`
--
ALTER TABLE `jury_info`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`);

--
-- Index pour la table `likes_tiktok`
--
ALTER TABLE `likes_tiktok`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_artiste_phase` (`artiste_id`,`phase_id`),
  ADD KEY `phase_id` (`phase_id`);

--
-- Index pour la table `notes_jury`
--
ALTER TABLE `notes_jury`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_jury_artiste_phase` (`jury_id`,`artiste_id`,`phase_id`),
  ADD KEY `artiste_id` (`artiste_id`),
  ADD KEY `phase_id` (`phase_id`);

--
-- Index pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_user_id` (`user_id`);

--
-- Index pour la table `profiles`
--
ALTER TABLE `profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `idx_profiles_user_id` (`user_id`);

--
-- Index pour la table `scores`
--
ALTER TABLE `scores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_artiste_phase_score` (`artiste_id`,`phase_id`),
  ADD KEY `phase_id` (`phase_id`),
  ADD KEY `idx_scores_artiste_id` (`artiste_id`);

--
-- Index pour la table `social_links`
--
ALTER TABLE `social_links`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `platform` (`platform`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Index pour la table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_role` (`user_id`,`role`),
  ADD KEY `idx_user_roles_user_id` (`user_id`);

--
-- Index pour la table `verification_codes`
--
ALTER TABLE `verification_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_identifier_type` (`identifier`,`type`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Index pour la table `videos`
--
ALTER TABLE `videos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `phase_id` (`phase_id`),
  ADD KEY `idx_videos_artiste_id` (`artiste_id`);

--
-- Index pour la table `votes`
--
ALTER TABLE `votes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `votes_unique_per_phase` (`voter_id`,`artiste_id`,`phase_id`),
  ADD KEY `phase_id` (`phase_id`),
  ADD KEY `idx_votes_voter_id` (`voter_id`),
  ADD KEY `idx_votes_artiste_id` (`artiste_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `artiste`
--
ALTER TABLE `artiste`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `evenement`
--
ALTER TABLE `evenement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `jury_info`
--
ALTER TABLE `jury_info`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `likes_tiktok`
--
ALTER TABLE `likes_tiktok`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notes_jury`
--
ALTER TABLE `notes_jury`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notifications`
--
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `profiles`
--
ALTER TABLE `profiles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `scores`
--
ALTER TABLE `scores`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `social_links`
--
ALTER TABLE `social_links`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT pour la table `user_roles`
--
ALTER TABLE `user_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT pour la table `verification_codes`
--
ALTER TABLE `verification_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT pour la table `videos`
--
ALTER TABLE `videos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `votes`
--
ALTER TABLE `votes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `artiste`
--
ALTER TABLE `artiste`
  ADD CONSTRAINT `artiste_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `artiste_ibfk_2` FOREIGN KEY (`phase_actuelle_id`) REFERENCES `evenement` (`id`);

--
-- Contraintes pour la table `evenement`
--
ALTER TABLE `evenement`
  ADD CONSTRAINT `evenement_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);

--
-- Contraintes pour la table `jury_info`
--
ALTER TABLE `jury_info`
  ADD CONSTRAINT `jury_info_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `likes_tiktok`
--
ALTER TABLE `likes_tiktok`
  ADD CONSTRAINT `likes_tiktok_ibfk_1` FOREIGN KEY (`artiste_id`) REFERENCES `artiste` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `likes_tiktok_ibfk_2` FOREIGN KEY (`phase_id`) REFERENCES `evenement` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notes_jury`
--
ALTER TABLE `notes_jury`
  ADD CONSTRAINT `notes_jury_ibfk_1` FOREIGN KEY (`artiste_id`) REFERENCES `artiste` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notes_jury_ibfk_2` FOREIGN KEY (`phase_id`) REFERENCES `evenement` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `profiles`
--
ALTER TABLE `profiles`
  ADD CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `scores`
--
ALTER TABLE `scores`
  ADD CONSTRAINT `scores_ibfk_1` FOREIGN KEY (`artiste_id`) REFERENCES `artiste` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `scores_ibfk_2` FOREIGN KEY (`phase_id`) REFERENCES `evenement` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `videos`
--
ALTER TABLE `videos`
  ADD CONSTRAINT `videos_ibfk_1` FOREIGN KEY (`artiste_id`) REFERENCES `artiste` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `videos_ibfk_2` FOREIGN KEY (`phase_id`) REFERENCES `evenement` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `votes`
--
ALTER TABLE `votes`
  ADD CONSTRAINT `votes_ibfk_1` FOREIGN KEY (`voter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `votes_ibfk_2` FOREIGN KEY (`artiste_id`) REFERENCES `artiste` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `votes_ibfk_3` FOREIGN KEY (`phase_id`) REFERENCES `evenement` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
