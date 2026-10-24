-- CampusCare - 128 data laporan contoh (opsional). Impor SETELAH campuscare.sql.
-- Impor cukup sekali; jika diimpor lagi datanya akan dobel.
USE `campuscare`;
SET NAMES utf8mb4;
SET @admin = (SELECT `id` FROM `users` ORDER BY `id` LIMIT 1);

INSERT INTO `reports` (`tanggal`, `nama_pelapor`, `nim_nip`, `kategori_pelapor`, `kategori_kerusakan`, `lokasi`, `deskripsi`, `status`, `created_by`) VALUES
(DATE_SUB(CURDATE(), INTERVAL 0 DAY), 'Siti Aminah', '2204699', 'Dosen', 'Kursi patah', 'Perpustakaan Lt. 3', 'Kursi patah di Perpustakaan Lt. 3. Mohon segera ditindaklanjuti.', 'Baru', @admin),
(DATE_SUB(CURDATE(), INTERVAL 0 DAY), 'Bavin Magami', '2204736', 'Mahasiswa', 'Komputer rusak', 'Lab Komputer 2', 'Komputer rusak di Lab Komputer 2. Mohon segera ditindaklanjuti.', 'Baru', @admin);
