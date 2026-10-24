-- CampusCare - skema database MySQL/MariaDB (Laragon + phpMyAdmin)
-- Cara pakai: phpMyAdmin -> tab "Import" -> pilih file ini -> Import.
-- Database `campuscare` akan dibuat otomatis.

CREATE DATABASE IF NOT EXISTS `campuscare` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `campuscare`;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `identifier`    VARCHAR(120) NOT NULL COMMENT 'NIM atau email untuk login',
  `nama`          VARCHAR(100) NOT NULL,
  `role`          ENUM('admin') NOT NULL DEFAULT 'admin',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'hash bcrypt, bukan password asli',
  `created_at`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_identifier` (`identifier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `reports` (
  `id`                 INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'kode tampil: ID-00001',
  `tanggal`            DATE NOT NULL,
  `nama_pelapor`       VARCHAR(100) NOT NULL,
  `nim_nip`            VARCHAR(30)  NOT NULL,
  `kategori_pelapor`   ENUM('Mahasiswa','Staf','Dosen') NOT NULL,
  `kategori_kerusakan` VARCHAR(60)  NOT NULL,
  `lokasi`             VARCHAR(120) NOT NULL,
  `deskripsi`          TEXT NOT NULL,
  `foto`               VARCHAR(80) NULL COMMENT 'nama file di folder uploads',
  `status`             ENUM('Baru','Diproses','Selesai') NOT NULL DEFAULT 'Baru',
  `created_by`         INT UNSIGNED NULL,
  `created_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reports_status` (`status`),
  KEY `idx_reports_tanggal` (`tanggal`, `id`),
  CONSTRAINT `fk_reports_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `status_log` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `report_id`   INT UNSIGNED NOT NULL,
  `status_lama` ENUM('Baru','Diproses','Selesai') NOT NULL,
  `status_baru` ENUM('Baru','Diproses','Selesai') NOT NULL,
  `user_id`     INT UNSIGNED NULL,
  `created_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_status_log_report` (`report_id`),
  CONSTRAINT `fk_log_report` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_log_user`   FOREIGN KEY (`user_id`)   REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `login_attempts` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `ip`         VARCHAR(45)  NOT NULL,
  `identifier` VARCHAR(120) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attempts` (`ip`, `identifier`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Akun admin awal -> login: admin@campus.ac.id / Admin#12345  (SEGERA GANTI, lihat PANDUAN.md)
INSERT IGNORE INTO `users` (`identifier`, `nama`, `role`, `password_hash`)
VALUES ('admin@campus.ac.id', 'Admin CampusCare', 'admin', '$2b$12$6mHtewFF4rHB8RAqWrzPP./sEzad/cm8NrHP61WAtvycbGoG/vXa6');
