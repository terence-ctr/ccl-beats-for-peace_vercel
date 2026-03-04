-- ==============================================
-- MIGRATION: UUID vers INT AUTO_INCREMENT
-- Exécuter après avoir sauvegardé vos données
-- ==============================================

-- ATTENTION: Cette migration supprime les données existantes
-- Sauvegardez d'abord vos données si nécessaire

-- Désactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 0;

-- ==============================================
-- SUPPRIMER LES VUES ET TRIGGERS EXISTANTS
-- ==============================================
DROP VIEW IF EXISTS artistes_with_scores;
DROP VIEW IF EXISTS vote_statistics;
DROP TRIGGER IF EXISTS after_user_insert;
DROP TRIGGER IF EXISTS after_user_insert_profile;
DROP TRIGGER IF EXISTS before_artiste_status_update;
DROP TRIGGER IF EXISTS after_artiste_status_update;
DROP TRIGGER IF EXISTS after_vote_insert;
DROP TRIGGER IF EXISTS after_note_jury_insert;
DROP FUNCTION IF EXISTS has_role;

-- ==============================================
-- SUPPRIMER LES TABLES EXISTANTES
-- ==============================================
DROP TABLE IF EXISTS scores;
DROP TABLE IF EXISTS notes_jury;
DROP TABLE IF EXISTS likes_tiktok;
DROP TABLE IF EXISTS videos;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS artiste;
DROP TABLE IF EXISTS jury_info;
DROP TABLE IF EXISTS evenement;
DROP TABLE IF EXISTS verification_codes;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS social_links;
DROP TABLE IF EXISTS users;

-- ==============================================
-- TABLE UTILISATEURS (INT AUTO_INCREMENT)
-- ==============================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    raw_user_meta_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    last_sign_in_at TIMESTAMP NULL,
    email_confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phone VARCHAR(20),
    phone_confirmed_at TIMESTAMP NULL
);

-- ==============================================
-- TABLE PROFILES
-- ==============================================
CREATE TABLE profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    avatar_url TEXT,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE USER_ROLES
-- ==============================================
CREATE TABLE user_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    role ENUM('visitor', 'candidate', 'jury', 'organizer', 'super_admin') NOT NULL DEFAULT 'visitor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY unique_user_role (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE VERIFICATION_CODES
-- ==============================================
CREATE TABLE verification_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type ENUM('email', 'phone') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_identifier_type (identifier, type),
    INDEX idx_expires (expires_at)
);

-- ==============================================
-- TABLE EVENEMENT
-- ==============================================
CREATE TABLE evenement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    phase_order INT NOT NULL,
    status ENUM('future', 'active', 'terminee') NOT NULL DEFAULT 'future',
    start_date TIMESTAMP NULL,
    end_date TIMESTAMP NULL,
    hashtag VARCHAR(100),
    vote_actif BOOLEAN DEFAULT FALSE,
    periode_affichage VARCHAR(255),
    sound_url TEXT,
    audio_rap_url TEXT,
    audio_slam_url TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==============================================
-- TABLE ARTISTE
-- ==============================================
CREATE TABLE artiste (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    nom_complet VARCHAR(255) NOT NULL,
    nom_artiste VARCHAR(255) NOT NULL,
    date_naissance DATE NOT NULL,
    sexe ENUM('masculin', 'feminin', 'autre') NOT NULL,
    discipline ENUM('rap', 'slam', 'chant', 'danse', 'theatre', 'autre') NOT NULL,
    adresse TEXT NOT NULL,
    quartier VARCHAR(255),
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    biographie TEXT,
    photo_url TEXT,
    video_url TEXT,
    piece_identite_url TEXT,
    statut ENUM('en_attente', 'validee', 'rejetee', 'en_competition', 'elimine', 'laureat') NOT NULL DEFAULT 'en_attente',
    festiras_id VARCHAR(50) UNIQUE,
    province VARCHAR(100),
    ville VARCHAR(100),
    pays VARCHAR(100) DEFAULT 'RDC',
    hashtag_officiel VARCHAR(100),
    total_votes INT DEFAULT 0,
    score_jury DECIMAL(5,2) DEFAULT 0,
    score_final DECIMAL(5,2) DEFAULT 0,
    phase_actuelle_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_actuelle_id) REFERENCES evenement(id)
);

-- ==============================================
-- TABLE VOTES
-- ==============================================
CREATE TABLE votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    voter_id INT NOT NULL,
    artiste_id INT NOT NULL,
    phase_id INT NOT NULL,
    vote_count INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY votes_unique_per_phase (voter_id, artiste_id, phase_id),
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (artiste_id) REFERENCES artiste(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE JURY_INFO
-- ==============================================
CREATE TABLE jury_info (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    instagram_url TEXT,
    competences TEXT,
    description TEXT,
    photo_url TEXT,
    nom_complet VARCHAR(255),
    specialite VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE NOTIFICATIONS
-- ==============================================
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50) DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE SOCIAL_LINKS
-- ==============================================
CREATE TABLE social_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    platform VARCHAR(50) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================
-- TABLE VIDEOS
-- ==============================================
CREATE TABLE videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artiste_id INT NOT NULL,
    phase_id INT NOT NULL,
    url_video TEXT NOT NULL,
    description TEXT,
    source ENUM('plateforme', 'tiktok') DEFAULT 'plateforme',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (artiste_id) REFERENCES artiste(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE LIKES_TIKTOK
-- ==============================================
CREATE TABLE likes_tiktok (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artiste_id INT NOT NULL,
    phase_id INT NOT NULL,
    hashtag VARCHAR(100),
    nombre_likes INT DEFAULT 0,
    date_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_artiste_phase (artiste_id, phase_id),
    FOREIGN KEY (artiste_id) REFERENCES artiste(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE NOTES_JURY
-- ==============================================
CREATE TABLE notes_jury (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jury_id INT NOT NULL,
    artiste_id INT NOT NULL,
    phase_id INT NOT NULL,
    note INT NOT NULL CHECK (note >= 0 AND note <= 50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY unique_jury_artiste_phase (jury_id, artiste_id, phase_id),
    FOREIGN KEY (artiste_id) REFERENCES artiste(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE SCORES
-- ==============================================
CREATE TABLE scores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artiste_id INT NOT NULL,
    phase_id INT NOT NULL,
    score_vote INT DEFAULT 0,
    score_like INT DEFAULT 0,
    score_jury INT DEFAULT 0,
    score_total INT GENERATED ALWAYS AS (score_vote + score_like + score_jury) STORED,
    classement INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY unique_artiste_phase_score (artiste_id, phase_id),
    FOREIGN KEY (artiste_id) REFERENCES artiste(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ==============================================
-- INDEX
-- ==============================================
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_artiste_user_id ON artiste(user_id);
CREATE INDEX idx_artiste_statut ON artiste(statut);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_votes_artiste_id ON votes(artiste_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_videos_artiste_id ON videos(artiste_id);
CREATE INDEX idx_scores_artiste_id ON scores(artiste_id);

-- ==============================================
-- DONNÉES INITIALES
-- ==============================================
INSERT INTO evenement (name, description, phase_order, status, hashtag) VALUES
    ('Inscriptions', 'Phase d''inscription et de soumission des candidatures', 1, 'active', '#FESTIRASInscription'),
    ('Éliminatoires', 'Phase de sélection et votes du public', 2, 'future', '#FESTIRASEliminatoires'),
    ('Grande Finale', 'Finale nationale avec jury et public', 3, 'future', '#FESTIRASFinale');

INSERT INTO social_links (platform, url) VALUES
    ('instagram', 'https://www.instagram.com/festiras_officiel/'),
    ('facebook', 'https://www.facebook.com/festirasbukavu'),
    ('twitter', 'https://twitter.com/festiras'),
    ('youtube', 'https://www.youtube.com/festiras'),
    ('google', 'https://accounts.google.com/');

-- ==============================================
-- TRIGGERS
-- ==============================================
DELIMITER //

CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_roles (user_id, role) VALUES (NEW.id, 'visitor');
END//

CREATE TRIGGER after_user_insert_profile
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO profiles (user_id, username, email) VALUES (NEW.id, NEW.username, NEW.email);
END//

CREATE TRIGGER before_artiste_status_update
BEFORE UPDATE ON artiste
FOR EACH ROW
BEGIN
    DECLARE artist_count INT;
    IF NEW.statut = 'validee' AND OLD.statut = 'en_attente' THEN
        SELECT COUNT(*) + 1 INTO artist_count FROM artiste WHERE statut != 'en_attente';
        SET NEW.festiras_id = CONCAT('FTR-2026-', LPAD(artist_count, 4, '0'));
    END IF;
END//

CREATE TRIGGER after_artiste_status_update
AFTER UPDATE ON artiste
FOR EACH ROW
BEGIN
    IF NEW.statut = 'validee' AND OLD.statut = 'en_attente' THEN
        INSERT IGNORE INTO user_roles (user_id, role) VALUES (NEW.user_id, 'candidate');
    END IF;
END//

CREATE TRIGGER after_vote_insert
AFTER INSERT ON votes
FOR EACH ROW
BEGIN
    UPDATE artiste SET total_votes = (
        SELECT COALESCE(SUM(vote_count), 0) FROM votes WHERE artiste_id = NEW.artiste_id
    ) WHERE id = NEW.artiste_id;
END//

CREATE TRIGGER after_note_jury_insert
AFTER INSERT ON notes_jury
FOR EACH ROW
BEGIN
    UPDATE artiste SET score_jury = (
        SELECT COALESCE(AVG(note), 0) FROM notes_jury WHERE artiste_id = NEW.artiste_id
    ) WHERE id = NEW.artiste_id;
END//

DELIMITER ;

-- Réactiver les vérifications de clés étrangères
SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================
-- FIN DE LA MIGRATION
-- ==============================================
