-- ==============================================
-- CCL BEATS FOR PEACE - SCHÉMA MYSQL/MARIADB
-- Backend Express.js Alternative à Supabase
-- ==============================================

-- Créer la base de données
CREATE DATABASE IF NOT EXISTS ccl_beats CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ccl_beats;

-- ==============================================
-- TABLE UTILISATEURS
-- ==============================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
-- TABLE PROFILES (informations utilisateur)
-- ==============================================
CREATE TABLE profiles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL UNIQUE,
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
-- TABLE USER_ROLES (rôles séparés - sécurité)
-- ==============================================
CREATE TABLE user_roles (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    role ENUM('visitor', 'candidate', 'jury', 'organizer', 'super_admin') NOT NULL DEFAULT 'visitor',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY unique_user_role (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE VERIFICATION_CODES (codes de vérification email/SMS)
-- ==============================================
CREATE TABLE verification_codes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    identifier VARCHAR(255) NOT NULL,
    code VARCHAR(10) NOT NULL,
    type ENUM('email', 'phone') NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    INDEX idx_identifier_type (identifier, type),
    INDEX idx_expires (expires_at)
);

-- ==============================================
-- TABLE EVENEMENT (phases de compétition)
-- ==============================================
CREATE TABLE evenement (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
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
    created_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ==============================================
-- TABLE ARTISTE (candidatures)
-- ==============================================
CREATE TABLE artiste (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL UNIQUE,
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
    pays VARCHAR(100) DEFAULT 'Congo',
    hashtag_officiel VARCHAR(100),
    total_votes INT DEFAULT 0,
    score_jury DECIMAL(5,2) DEFAULT 0,
    score_final DECIMAL(5,2) DEFAULT 0,
    phase_actuelle_id VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_actuelle_id) REFERENCES evenement(id)
);

-- ==============================================
-- TABLE VOTES
-- ==============================================
CREATE TABLE votes (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    voter_id VARCHAR(36) NOT NULL,
    artiste_id VARCHAR(36) NOT NULL,
    phase_id VARCHAR(36) NOT NULL,
    vote_count INT DEFAULT 1 NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY votes_unique_per_phase (voter_id, artiste_id, phase_id),
    FOREIGN KEY (voter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (artiste_id) REFERENCES artiste(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE JURY (informations supplémentaires jury)
-- ==============================================
CREATE TABLE jury_info (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL UNIQUE,
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
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    type VARCHAR(50) DEFAULT 'info',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE SOCIAL_LINKS (URLs dynamiques réseaux sociaux)
-- ==============================================
CREATE TABLE social_links (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    platform VARCHAR(50) NOT NULL UNIQUE,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);

-- ==============================================
-- TABLE VIDEOS (soumissions vidéo)
-- ==============================================
CREATE TABLE videos (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    artiste_id VARCHAR(36) NOT NULL,
    phase_id VARCHAR(36) NOT NULL,
    url_video TEXT NOT NULL,
    description TEXT,
    source ENUM('plateforme', 'tiktok') DEFAULT 'plateforme',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (artiste_id) REFERENCES artiste(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE LIKES_TIKTOK (intégration TikTok)
-- ==============================================
CREATE TABLE likes_tiktok (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    artiste_id VARCHAR(36) NOT NULL,
    phase_id VARCHAR(36) NOT NULL,
    hashtag VARCHAR(100),
    nombre_likes INT DEFAULT 0,
    date_sync TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_artiste_phase (artiste_id, phase_id),
    FOREIGN KEY (artiste_id) REFERENCES artiste(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE NOTES_JURY (évaluations du jury)
-- ==============================================
CREATE TABLE notes_jury (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    jury_id VARCHAR(36) NOT NULL,
    artiste_id VARCHAR(36) NOT NULL,
    phase_id VARCHAR(36) NOT NULL,
    note INT NOT NULL CHECK (note >= 0 AND note <= 50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE KEY unique_jury_artiste_phase (jury_id, artiste_id, phase_id),
    FOREIGN KEY (artiste_id) REFERENCES artiste(id) ON DELETE CASCADE,
    FOREIGN KEY (phase_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ==============================================
-- TABLE SCORES (calculs des scores)
-- ==============================================
CREATE TABLE scores (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    artiste_id VARCHAR(36) NOT NULL,
    phase_id VARCHAR(36) NOT NULL,
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
-- INDEX POUR OPTIMISATION
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
CREATE INDEX idx_votes_phase_voter ON votes(phase_id, voter_id);
CREATE INDEX idx_artiste_phase ON artiste(phase_actuelle_id, statut);

-- ==============================================
-- DONNÉES INITIALES
-- ==============================================

-- Phases de compétition par défaut
INSERT INTO evenement (id, name, description, phase_order, status, hashtag) VALUES
    (UUID(), 'Inscriptions', 'Phase d''inscription et de soumission des candidatures', 1, 'active', '#FESTIRASInscription'),
    (UUID(), 'Éliminatoires', 'Phase de sélection et votes du public', 2, 'future', '#FESTIRASEliminatoires'),
    (UUID(), 'Grande Finale', 'Finale nationale avec jury et public', 3, 'future', '#FESTIRASFinale');

-- Liens sociaux par défaut
INSERT INTO social_links (id, platform, url) VALUES
    (UUID(), 'instagram', 'https://www.instagram.com/festiras_officiel/'),
    (UUID(), 'facebook', 'https://www.facebook.com/festirasbukavu'),
    (UUID(), 'twitter', 'https://twitter.com/festiras'),
    (UUID(), 'youtube', 'https://www.youtube.com/festiras'),
    (UUID(), 'google', 'https://accounts.google.com/');

-- ==============================================
-- TRIGGERS: Attribution automatique des rôles
-- ==============================================

-- Délimiteur pour les triggers
DELIMITER //

-- Trigger: Attribuer le rôle 'visitor' à la création d'un utilisateur
CREATE TRIGGER after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO user_roles (id, user_id, role)
    VALUES (UUID(), NEW.id, 'visitor');
END//

-- Trigger: Créer le profil automatiquement à l'inscription
CREATE TRIGGER after_user_insert_profile
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO profiles (id, user_id, username, email)
    VALUES (UUID(), NEW.id, NEW.username, NEW.email);
END//

-- Trigger: Générer FESTIRAS ID et attribuer rôle 'candidate' quand artiste validé
CREATE TRIGGER before_artiste_status_update
BEFORE UPDATE ON artiste
FOR EACH ROW
BEGIN
    DECLARE artist_count INT;
    
    -- Si le statut passe de 'en_attente' à 'validee'
    IF NEW.statut = 'validee' AND OLD.statut = 'en_attente' THEN
        -- Générer le FESTIRAS ID
        SELECT COUNT(*) + 1 INTO artist_count FROM artiste WHERE statut != 'en_attente';
        SET NEW.festiras_id = CONCAT('FTR-2026-', LPAD(artist_count, 4, '0'));
    END IF;
END//

-- Trigger séparé pour ajouter le rôle candidate (AFTER UPDATE)
CREATE TRIGGER after_artiste_status_update
AFTER UPDATE ON artiste
FOR EACH ROW
BEGIN
    -- Si le statut passe de 'en_attente' à 'validee', ajouter le rôle candidate
    IF NEW.statut = 'validee' AND OLD.statut = 'en_attente' THEN
        INSERT IGNORE INTO user_roles (id, user_id, role)
        VALUES (UUID(), NEW.user_id, 'candidate');
    END IF;
END//

-- Trigger: Mettre à jour le total des votes d'un artiste
CREATE TRIGGER after_vote_insert
AFTER INSERT ON votes
FOR EACH ROW
BEGIN
    UPDATE artiste 
    SET total_votes = (
        SELECT COALESCE(SUM(vote_count), 0) 
        FROM votes 
        WHERE artiste_id = NEW.artiste_id
    )
    WHERE id = NEW.artiste_id;
END//

-- Trigger: Recalculer le score jury d'un artiste
CREATE TRIGGER after_note_jury_insert
AFTER INSERT ON notes_jury
FOR EACH ROW
BEGIN
    UPDATE artiste 
    SET score_jury = (
        SELECT COALESCE(AVG(note), 0) 
        FROM notes_jury 
        WHERE artiste_id = NEW.artiste_id
    )
    WHERE id = NEW.artiste_id;
END//

DELIMITER ;

-- ==============================================
-- FONCTIONS UTILITAIRES
-- ==============================================

-- Fonction: Vérifier si un utilisateur a un rôle spécifique
DELIMITER //
CREATE FUNCTION has_role(p_user_id VARCHAR(36), p_role VARCHAR(20))
RETURNS BOOLEAN
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE role_exists BOOLEAN DEFAULT FALSE;
    SELECT EXISTS(
        SELECT 1 FROM user_roles 
        WHERE user_id = p_user_id AND role = p_role
    ) INTO role_exists;
    RETURN role_exists;
END//
DELIMITER ;

-- ==============================================
-- VUES UTILITAIRES
-- ==============================================

-- Vue pour les artistes avec leurs scores
CREATE VIEW artistes_with_scores AS
SELECT 
    a.*,
    COALESCE(s.score_total, 0) as total_score,
    COALESCE(s.classement, 0) as ranking,
    e.name as current_phase_name
FROM artiste a
LEFT JOIN scores s ON a.id = s.artiste_id AND a.phase_actuelle_id = s.phase_id
LEFT JOIN evenement e ON a.phase_actuelle_id = e.id;

-- Vue pour les statistiques de vote
CREATE VIEW vote_statistics AS
SELECT 
    v.artiste_id,
    a.nom_artiste,
    COUNT(*) as total_votes,
    e.name as phase_name
FROM votes v
JOIN artiste a ON v.artiste_id = a.id
JOIN evenement e ON v.phase_id = e.id
GROUP BY v.artiste_id, a.nom_artiste, e.name;
