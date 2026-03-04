-- Créer la table pour les publications TikTok
CREATE TABLE IF NOT EXISTS `tiktok_publications` (
  `id` VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  `artiste_id` INT NOT NULL,
  `video_url` TEXT NOT NULL,
  `caption` TEXT,
  `hashtags` TEXT,
  `status` ENUM('draft', 'published', 'failed') DEFAULT 'draft',
  `views` INT DEFAULT 0,
  `likes` INT DEFAULT 0,
  `shares` INT DEFAULT 0,
  `comments` INT DEFAULT 0,
  `platform` VARCHAR(50) DEFAULT 'tiktok',
  `tiktok_video_id` VARCHAR(100),
  `published_at` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`artiste_id`) REFERENCES `artiste` (`id`) ON DELETE CASCADE,
  INDEX `idx_artiste_id` (`artiste_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_published_at` (`published_at`)
);

-- Vérifier la création de la table
DESCRIBE `tiktok_publications`;
