-- Créer la table pour les tokens TikTok OAuth
CREATE TABLE IF NOT EXISTS `tiktok_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `artiste_id` INT NULL,
  `access_token` TEXT NOT NULL,
  `refresh_token` TEXT,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`artiste_id`) REFERENCES `artiste` (`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_artiste_id` (`artiste_id`),
  INDEX `idx_expires_at` (`expires_at`)
);

-- Si la table existe déjà, ajouter la colonne user_id
ALTER TABLE `tiktok_tokens` 
ADD COLUMN IF NOT EXISTS `user_id` INT NOT NULL AFTER `id`,
ADD COLUMN IF NOT EXISTS `artiste_id` INT NULL AFTER `user_id`;

-- Ajouter les contraintes et index si ils n'existent pas
ALTER TABLE `tiktok_tokens` 
ADD FOREIGN KEY IF NOT EXISTS (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
ADD FOREIGN KEY IF NOT EXISTS (`artiste_id`) REFERENCES `artiste` (`id`) ON DELETE CASCADE;

ALTER TABLE `tiktok_tokens` 
ADD INDEX IF NOT EXISTS `idx_user_id` (`user_id`),
ADD INDEX IF NOT EXISTS `idx_artiste_id` (`artiste_id`),
ADD INDEX IF NOT EXISTS `idx_expires_at` (`expires_at`);

-- Mettre à jour la table tiktok_publications pour inclure les champs TikTok
ALTER TABLE `tiktok_publications` 
ADD COLUMN IF NOT EXISTS `tiktok_video_id` VARCHAR(100) AFTER `platform`,
ADD COLUMN IF NOT EXISTS `publish_id` VARCHAR(100) AFTER `tiktok_video_id`,
ADD COLUMN IF NOT EXISTS `tiktok_status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending' AFTER `status`;

-- Si les colonnes existent déjà, les modifier individuellement
ALTER TABLE `tiktok_publications` 
MODIFY COLUMN IF NOT EXISTS `tiktok_status` ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending';

-- Vérifier la création des tables
DESCRIBE `tiktok_tokens`;
DESCRIBE `tiktok_publications`;
