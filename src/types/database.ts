import { Request } from 'express';

// Types enumérés pour la base de données
export enum AppRole {
  VISITOR = 'visitor',
  CANDIDATE = 'candidate',
  JURY = 'jury',
  ORGANIZER = 'organizer',
  SUPER_ADMIN = 'super_admin'
}

export enum CandidatureStatus {
  EN_ATTENTE = 'en_attente',
  VALIDEE = 'validee',
  REJETEE = 'rejetee',
  EN_COMPETITION = 'en_competition',
  ELIMINE = 'elimine',
  LAUREAT = 'laureat'
}

export enum PhaseStatus {
  FUTURE = 'future',
  ACTIVE = 'active',
  TERMINEE = 'terminee'
}

export enum ArtisticDiscipline {
  RAP = 'rap',
  SLAM = 'slam',
  CHANT = 'chant',
  DANSE = 'danse',
  THEATRE = 'theatre',
  AUTRE = 'autre'
}

export enum Gender {
  MASCULIN = 'masculin',
  FEMININ = 'feminin',
  AUTRE = 'autre'
}

// Interfaces pour les tables de la base de données
export interface User {
  id: number | string;
  email: string;
  password_hash: string;
  username?: string;
  created_at: Date;
  updated_at: Date;
  email_confirmed_at?: Date;
  phone?: string;
  phone_confirmed_at?: Date;
  email_verified?: number;
  raw_user_meta_data?: string;
  last_sign_in_at?: Date;
}

export interface Profile {
  id: number;
  user_id: number;
  username: string;
  email: string;
  avatar_url?: string;
  nom?: string;
  prenom?: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserRole {
  id: number;
  user_id: number;
  role: AppRole;
  created_at: Date;
}

export interface Evenement {
  id: number;
  name: string;
  description?: string;
  phase_order: number;
  status: PhaseStatus;
  start_date?: Date;
  end_date?: Date;
  hashtag?: string;
  vote_actif?: boolean;
  periode_affichage?: string;
  sound_url?: string;
  audio_rap_url?: string;
  audio_slam_url?: string;
  created_by?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Artiste {
  id: number;
  user_id: number;
  nom_complet: string;
  nom_artiste: string;
  date_naissance: Date;
  sexe: Gender;
  discipline: ArtisticDiscipline;
  adresse: string;
  quartier?: string;
  telephone: string;
  email: string;
  biographie?: string;
  photo_url?: string;
  video_url?: string;
  piece_identite_url?: string;
  statut: CandidatureStatus;
  festiras_id?: string;
  province?: string;
  ville?: string;
  pays?: string;
  hashtag_officiel?: string;
  total_votes: number;
  score_jury: number;
  score_final: number;
  phase_actuelle_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Vote {
  id: number;
  voter_id: number;
  artiste_id: number;
  phase_id: number;
  vote_count: number;
  created_at: Date;
}

export interface JuryInfo {
  id: number;
  user_id: number;
  instagram_url?: string;
  competences?: string;
  description?: string;
  photo_url?: string;
  nom_complet?: string;
  specialite?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: boolean;
  type: string;
  created_at: Date;
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  is_active: boolean;
  updated_at: Date;
}

export interface Video {
  id: number;
  artiste_id: number;
  phase_id: number;
  url_video: string;
  description?: string;
  source: 'plateforme' | 'tiktok';
  created_at: Date;
}

export interface LikesTiktok {
  id: number;
  artiste_id: number;
  phase_id: number;
  hashtag?: string;
  nombre_likes: number;
  date_sync: Date;
}

export interface NotesJury {
  id: number;
  jury_id: number;
  artiste_id: number;
  phase_id: number;
  note: number;
  created_at: Date;
}

export interface Score {
  id: number;
  artiste_id: number;
  phase_id: number;
  score_vote: number;
  score_like: number;
  score_jury: number;
  score_total: number;
  classement?: number;
  created_at: Date;
}

// Types pour les requêtes et réponses API
export interface CreateUserRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  emailOrUsername: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
  roles: AppRole[];
}

export interface CreateArtisteRequest {
  nom_complet: string;
  nom_artiste: string;
  date_naissance: string;
  sexe: Gender;
  discipline: ArtisticDiscipline;
  adresse: string;
  quartier?: string;
  telephone: string;
  email: string;
  biographie?: string;
  province?: string;
  ville?: string;
  photo_url?: string | null;
  video_url?: string | null;
  piece_identite_url?: string | null;
}

export interface VoteRequest {
  artiste_id: string;
  phase_id: string;
}

export interface NoteJuryRequest {
  artiste_id: string;
  phase_id: string;
  note: number;
}

// Types pour les vues et statistiques
export interface ArtisteWithScores extends Artiste {
  total_score: number;
  ranking: number;
  current_phase_name?: string;
}

export interface VoteStatistics {
  artiste_id: string;
  nom_artiste: string;
  total_votes: number;
  phase_name: string;
}

// Types pour les erreurs
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Types pour les middleware
export interface AuthenticatedRequest extends Request {
  user?: any; // Permettre n'importe quel type d'utilisateur pour éviter les conflits
  roles?: AppRole[];
}

// Types pour les fichiers uploadés
export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
}
