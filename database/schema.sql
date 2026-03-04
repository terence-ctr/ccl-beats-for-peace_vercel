-- ==============================================
-- CCL BEATS FOR PEACE - SCHÉMA POSTGRESQL COMPLET
-- Backend Express.js Alternative à Supabase
-- ==============================================

-- Extension UUID pour PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- TYPES ENUMÉRÉS
-- ==============================================

-- 1. Rôles utilisateurs
CREATE TYPE app_role AS ENUM ('visitor', 'candidate', 'jury', 'organizer', 'super_admin');

-- 2. Statuts de candidature
CREATE TYPE candidature_status AS ENUM ('en_attente', 'validee', 'rejetee', 'en_competition', 'elimine', 'laureat');

-- 3. Statuts de phase
CREATE TYPE phase_status AS ENUM ('future', 'active', 'terminee');

-- 4. Disciplines artistiques
CREATE TYPE artistic_discipline AS ENUM ('rap', 'slam', 'chant', 'danse', 'theatre', 'autre');

-- 5. Sexe
CREATE TYPE gender AS ENUM ('masculin', 'feminin', 'autre');

-- ==============================================
-- TABLE UTILISATEURS (remplace auth.users)
-- ==============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    raw_user_meta_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    email_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    phone TEXT,
    phone_confirmed_at TIMESTAMP WITH TIME ZONE
);

-- ==============================================
-- TABLE PROFILES (informations utilisateur)
-- ==============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    avatar_url TEXT,
    nom TEXT,
    prenom TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================
-- TABLE USER_ROLES (rôles séparés - sécurité)
-- ==============================================
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'visitor',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (user_id, role)
);

-- ==============================================
-- TABLE EVENEMENT (phases de compétition)
-- ==============================================
CREATE TABLE evenement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    phase_order INTEGER NOT NULL,
    status phase_status NOT NULL DEFAULT 'future',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    hashtag TEXT,
    vote_actif BOOLEAN DEFAULT false,
    periode_affichage TEXT,
    sound_url TEXT,
    audio_rap_url TEXT,
    audio_slam_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================
-- TABLE ARTISTE (candidatures)
-- ==============================================
CREATE TABLE artiste (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nom_complet TEXT NOT NULL,
    nom_artiste TEXT NOT NULL,
    date_naissance DATE NOT NULL,
    sexe gender NOT NULL,
    discipline artistic_discipline NOT NULL,
    adresse TEXT NOT NULL,
    quartier TEXT,
    telephone TEXT NOT NULL,
    email TEXT NOT NULL,
    biographie TEXT,
    photo_url TEXT,
    video_url TEXT,
    piece_identite_url TEXT,
    statut candidature_status NOT NULL DEFAULT 'en_attente',
    festiras_id TEXT UNIQUE,
    province TEXT,
    ville TEXT,
    pays TEXT DEFAULT 'Congo',
    hashtag_officiel TEXT,
    total_votes INTEGER DEFAULT 0,
    score_jury DECIMAL(5,2) DEFAULT 0,
    score_final DECIMAL(5,2) DEFAULT 0,
    phase_actuelle_id UUID REFERENCES evenement(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================
-- TABLE VOTES
-- ==============================================
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voter_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    artiste_id UUID REFERENCES artiste(id) ON DELETE CASCADE NOT NULL,
    phase_id UUID REFERENCES evenement(id) ON DELETE CASCADE NOT NULL,
    vote_count INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT votes_unique_per_phase UNIQUE (voter_id, artiste_id, phase_id)
);

-- ==============================================
-- TABLE JURY (informations supplémentaires jury)
-- ==============================================
CREATE TABLE jury_info (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    instagram_url TEXT,
    competences TEXT,
    description TEXT,
    photo_url TEXT,
    nom_complet TEXT,
    specialite TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================
-- TABLE NOTIFICATIONS
-- ==============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    type TEXT DEFAULT 'info',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================
-- TABLE SOCIAL_LINKS (URLs dynamiques réseaux sociaux)
-- ==============================================
CREATE TABLE social_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL UNIQUE,
    url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================
-- TABLE VIDEOS (soumissions vidéo)
-- ==============================================
CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artiste_id UUID REFERENCES artiste(id) ON DELETE CASCADE NOT NULL,
    phase_id UUID REFERENCES evenement(id) ON DELETE CASCADE NOT NULL,
    url_video TEXT NOT NULL,
    description TEXT,
    source TEXT DEFAULT 'plateforme' CHECK (source IN ('plateforme', 'tiktok')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================
-- TABLE LIKES_TIKTOK (intégration TikTok)
-- ==============================================
CREATE TABLE likes_tiktok (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artiste_id UUID REFERENCES artiste(id) ON DELETE CASCADE NOT NULL,
    phase_id UUID REFERENCES evenement(id) ON DELETE CASCADE NOT NULL,
    hashtag TEXT,
    nombre_likes INTEGER DEFAULT 0,
    date_sync TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (artiste_id, phase_id)
);

-- ==============================================
-- TABLE NOTES_JURY (évaluations du jury)
-- ==============================================
CREATE TABLE notes_jury (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    jury_id UUID NOT NULL,
    artiste_id UUID REFERENCES artiste(id) ON DELETE CASCADE NOT NULL,
    phase_id UUID REFERENCES evenement(id) ON DELETE CASCADE NOT NULL,
    note INTEGER NOT NULL CHECK (note >= 0 AND note <= 50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (jury_id, artiste_id, phase_id)
);

-- ==============================================
-- TABLE SCORES (calculs automatiques des scores)
-- ==============================================
CREATE TABLE scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    artiste_id UUID REFERENCES artiste(id) ON DELETE CASCADE NOT NULL,
    phase_id UUID REFERENCES evenement(id) ON DELETE CASCADE NOT NULL,
    score_vote INTEGER DEFAULT 0,
    score_like INTEGER DEFAULT 0,
    score_jury INTEGER DEFAULT 0,
    score_total INTEGER GENERATED ALWAYS AS (score_vote + score_like + score_jury) STORED,
    classement INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    UNIQUE (artiste_id, phase_id)
);

-- ==============================================
-- FONCTIONS UTILITAIRES
-- ==============================================

-- Fonction: Vérifier le rôle d'un utilisateur
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = _user_id AND role = _role
    )
$$;

-- Fonction: Obtenir tous les rôles d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_roles(_user_id UUID)
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM user_roles WHERE user_id = _user_id
$$;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Trigger: Mise à jour automatique updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application du trigger sur les tables pertinentes
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artiste_updated_at
    BEFORE UPDATE ON artiste
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evenement_updated_at
    BEFORE UPDATE ON evenement
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jury_info_updated_at
    BEFORE UPDATE ON jury_info
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_links_updated_at
    BEFORE UPDATE ON social_links
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Générer FESTIRAS ID pour artiste validé
CREATE OR REPLACE FUNCTION generate_festiras_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id TEXT;
    artist_count INTEGER;
BEGIN
    IF NEW.statut = 'validee' AND OLD.statut = 'en_attente' THEN
        SELECT COUNT(*) + 1 INTO artist_count FROM artiste WHERE statut != 'en_attente';
        new_id := 'FTR-2026-' || LPAD(artist_count::TEXT, 4, '0');
        NEW.festiras_id := new_id;
        
        -- Ajouter le rôle candidate
        INSERT INTO user_roles (user_id, role)
        VALUES (NEW.user_id, 'candidate')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_artiste_status_change
    BEFORE UPDATE ON artiste
    FOR EACH ROW EXECUTE FUNCTION generate_festiras_id();

-- ==============================================
-- INDEX POUR OPTIMISATION
-- ==============================================

-- Index sur les clés étrangères
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_artiste_user_id ON artiste(user_id);
CREATE INDEX idx_artiste_statut ON artiste(statut);
CREATE INDEX idx_votes_voter_id ON votes(voter_id);
CREATE INDEX idx_votes_artiste_id ON votes(artiste_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_videos_artiste_id ON videos(artiste_id);
CREATE INDEX idx_scores_artiste_id ON scores(artiste_id);

-- Index composites pour les requêtes fréquentes
CREATE INDEX idx_votes_phase_voter ON votes(phase_id, voter_id);
CREATE INDEX idx_scores_phase_ranking ON scores(phase_id, score_total DESC);
CREATE INDEX idx_artiste_phase ON artiste(phase_actuelle_id, statut);

-- ==============================================
-- DONNÉES INITIALES
-- ==============================================

-- Phases de compétition par défaut
INSERT INTO evenement (name, description, phase_order, status, hashtag) VALUES
    ('Inscriptions', 'Phase d''inscription et de soumission des candidatures', 1, 'active', '#FESTIRASInscription'),
    ('Éliminatoires', 'Phase de sélection et votes du public', 2, 'future', '#FESTIRASEliminatoires'),
    ('Grande Finale', 'Finale nationale avec jury et public', 3, 'future', '#FESTIRASFinale');

-- Liens sociaux par défaut
INSERT INTO social_links (platform, url) VALUES
    ('instagram', 'https://www.instagram.com/festiras_officiel/'),
    ('facebook', 'https://www.facebook.com/festirasbukavu'),
    ('twitter', 'https://twitter.com/festiras'),
    ('youtube', 'https://www.youtube.com/festiras'),
    ('google', 'https://accounts.google.com/');

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

-- ==============================================
-- SÉCURITÉ
-- ==============================================

-- Création d'un utilisateur PostgreSQL pour l'application
-- (à décommenter et adapter selon votre configuration)
-- CREATE USER ccl_app WITH PASSWORD 'votre_mot_de_passe_securise';
-- GRANT CONNECT ON DATABASE ccl_beats TO ccl_app;
-- GRANT USAGE ON SCHEMA public TO ccl_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ccl_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ccl_app;

-- Par défaut, les permissions sont accordées au propriétaire de la base de données
-- Pour la production, configurez des permissions plus restrictives
