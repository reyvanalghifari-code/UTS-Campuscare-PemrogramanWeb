<?php
// Konfigurasi CampusCare. Nilai bawaan cocok dengan Laragon (MySQL: user root, tanpa password).
return [
    'db_host'    => '127.0.0.1',
    'db_port'    => 3306,
    'db_name'    => 'campuscare',
    'db_user'    => 'root',
    'db_pass'    => '',
    // Kunci penanda token login. Ganti dengan teks acak panjang milik Anda sendiri.
    'jwt_secret' => 'e3e7a1e740b4b738eb23b47a613a38dcd07d716e0fef231c51eec23e21ff975f',
    'jwt_ttl'    => 8 * 3600,                 // lama sesi login (detik)
    'upload_dir' => __DIR__ . '/../uploads',  // folder foto bukti
];
