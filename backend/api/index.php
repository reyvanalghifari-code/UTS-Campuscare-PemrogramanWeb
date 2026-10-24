<?php
declare(strict_types=1);

require __DIR__ . '/src/db.php';
require __DIR__ . '/src/auth.php';

date_default_timezone_set('Asia/Jakarta');
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');

const STATUS   = ['Baru', 'Diproses', 'Selesai'];
const KATEGORI = ['Mahasiswa', 'Staf', 'Dosen'];
const MAX_FOTO = 5 * 1024 * 1024;

class HttpError extends RuntimeException
{
}

function fail(int $code, string $msg): void
{
    throw new HttpError($msg, $code);
}

function out($data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function body(): array
{
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
            fail(413, 'Data terlalu besar. Naikkan post_max_size di php.ini atau perkecil foto.');
        }
        return [];
    }
    $d = json_decode($raw, true);
    if (!is_array($d)) {
        fail(400, 'Format JSON tidak valid.');
    }
    return $d;
}

function route_path(): string
{
    $base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
    $uri  = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    if ($base !== '' && strpos($uri, $base) === 0) {
        $uri = substr($uri, strlen($base));
    }
    $uri = preg_replace('#^/index\.php#', '', $uri);
    return '/' . trim((string)$uri, '/');
}

function text($v, string $label, int $max): string
{
    $s = is_string($v) ? trim($v) : '';
    if ($s === '') {
        fail(400, "$label wajib diisi.");
    }
    if (mb_strlen($s) > $max) {
        fail(400, "$label maksimal $max karakter.");
    }
    return $s;
}

function kode(int $id): string
{
    return 'ID-' . str_pad((string)$id, 5, '0', STR_PAD_LEFT);
}

function to_report(array $r): array
{
    return [
        'id'                 => (int)$r['id'],
        'kode'               => kode((int)$r['id']),
        'tanggal'            => $r['tanggal'],
        'nama_pelapor'       => $r['nama_pelapor'],
        'nim_nip'            => $r['nim_nip'],
        'kategori_pelapor'   => $r['kategori_pelapor'],
        'kategori_kerusakan' => $r['kategori_kerusakan'],
        'lokasi'             => $r['lokasi'],
        'deskripsi'          => $r['deskripsi'],
        'foto'               => $r['foto'] ? 'uploads/' . $r['foto'] : null,
        'status'             => $r['status'],
        'created_at'         => $r['created_at'],
        'updated_at'         => $r['updated_at'],
    ];
}

function find_report(int $id): array
{
    $st = db()->prepare('SELECT * FROM reports WHERE id = ?');
    $st->execute([$id]);
    $r = $st->fetch();
    if (!$r) {
        fail(404, 'Laporan tidak ditemukan.');
    }
    return $r;
}

function current_user(): array
{
    $pl = jwt_verify(bearer_token());
    if (!$pl) {
        fail(401, 'Sesi berakhir. Silakan masuk lagi.');
    }
    $st = db()->prepare('SELECT id, nama, identifier, role FROM users WHERE id = ?');
    $st->execute([(int)($pl['sub'] ?? 0)]);
    $u = $st->fetch();
    if (!$u) {
        fail(401, 'Sesi berakhir. Silakan masuk lagi.');
    }
    $u['id'] = (int)$u['id'];
    return $u;
}

function save_foto($data): string
{
    if (!is_string($data) || !preg_match('#^data:image/(jpeg|png);base64,#', $data, $m)) {
        fail(400, 'Foto harus berformat JPG atau PNG.');
    }
    $bin = base64_decode(substr($data, strlen($m[0])), true);
    if ($bin === false || $bin === '') {
        fail(400, 'Data foto tidak valid.');
    }
    if (strlen($bin) > MAX_FOTO) {
        fail(400, 'Ukuran foto maksimal 5MB.');
    }
    $isJpg = substr($bin, 0, 3) === "\xFF\xD8\xFF";
    $isPng = substr($bin, 0, 4) === "\x89PNG";
    if ($m[1] === 'jpeg' ? !$isJpg : !$isPng) {
        fail(400, 'Isi file tidak sesuai format gambar.');
    }
    $dir = cfg()['upload_dir'];
    if (!is_dir($dir) && !mkdir($dir, 0755, true)) {
        fail(500, 'Folder uploads tidak bisa dibuat.');
    }
    $name = bin2hex(random_bytes(16)) . ($m[1] === 'png' ? '.png' : '.jpg');
    if (file_put_contents($dir . '/' . $name, $bin) === false) {
        fail(500, 'Foto gagal disimpan. Periksa izin folder uploads.');
    }
    return $name;
}

try {
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $path   = route_path();
    if ($method === 'OPTIONS') {
        http_response_code(204);
        exit;
    }

    if ($path === '/health') {
        out(['ok' => true]);
    }

    // ---------- login ----------
    if ($path === '/auth/login') {
        if ($method !== 'POST') {
            fail(405, 'Metode tidak diizinkan.');
        }
        $b  = body();
        $id = mb_substr(trim((string)($b['identifier'] ?? '')), 0, 120);
        $pw = mb_substr((string)($b['password'] ?? ''), 0, 200);
        if ($id === '' || $pw === '') {
            fail(400, 'NIM/email dan kata sandi wajib diisi.');
        }
        $pdo = db();
        $ip  = $_SERVER['REMOTE_ADDR'] ?? '';
        $pdo->exec('DELETE FROM login_attempts WHERE created_at < (NOW() - INTERVAL 1 DAY)');
        $st = $pdo->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND identifier = ? AND created_at > (NOW() - INTERVAL 15 MINUTE)');
        $st->execute([$ip, $id]);
        if ((int)$st->fetchColumn() >= 8) {
            fail(429, 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.');
        }
        $st = $pdo->prepare('SELECT * FROM users WHERE identifier = ?');
        $st->execute([$id]);
        $u  = $st->fetch();
        $ok = $u ? password_verify($pw, $u['password_hash']) : (password_hash($pw, PASSWORD_DEFAULT) === '');
        if (!$ok) {
            $pdo->prepare('INSERT INTO login_attempts (ip, identifier) VALUES (?, ?)')->execute([$ip, $id]);
            fail(401, 'NIM/email atau kata sandi salah.');
        }
        $pdo->prepare('DELETE FROM login_attempts WHERE ip = ? AND identifier = ?')->execute([$ip, $id]);
        out([
            'token' => jwt_sign(['sub' => (int)$u['id']]),
            'user'  => ['id' => (int)$u['id'], 'nama' => $u['nama'], 'identifier' => $u['identifier'], 'role' => $u['role']],
        ]);
    }

    // ---------- semua endpoint lain wajib login ----------
    $user = current_user();

    if ($path === '/auth/me' && $method === 'GET') {
        out(['user' => $user]);
    }

    if ($path === '/stats' && $method === 'GET') {
        $s = ['total' => 0, 'baru' => 0, 'diproses' => 0, 'selesai' => 0];
        foreach (db()->query('SELECT status, COUNT(*) AS n FROM reports GROUP BY status') as $r) {
            $s[strtolower($r['status'])] = (int)$r['n'];
            $s['total'] += (int)$r['n'];
        }
        out($s);
    }

    if ($path === '/reports' && $method === 'GET') {
        $q  = mb_substr(trim((string)($_GET['q'] ?? '')), 0, 100);
        $st = (string)($_GET['status'] ?? '');
        $where = [];
        $args  = [];
        if (in_array($st, STATUS, true)) {
            $where[] = 'status = ?';
            $args[]  = $st;
        }
        if ($q !== '') {
            $like    = '%' . addcslashes($q, '\\%_') . '%';
            $where[] = "(CONCAT('ID-', LPAD(id, 5, '0')) LIKE ? OR nama_pelapor LIKE ? OR kategori_kerusakan LIKE ? OR lokasi LIKE ?)";
            array_push($args, $like, $like, $like, $like);
        }
        $w     = $where ? 'WHERE ' . implode(' AND ', $where) : '';
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 5)));
        $cnt   = db()->prepare("SELECT COUNT(*) FROM reports $w");
        $cnt->execute($args);
        $total = (int)$cnt->fetchColumn();
        $pages = max(1, (int)ceil($total / $limit));
        $page  = min($pages, max(1, (int)($_GET['page'] ?? 1)));
        $stmt  = db()->prepare("SELECT * FROM reports $w ORDER BY tanggal DESC, id DESC LIMIT ? OFFSET ?");
        $i = 1;
        foreach ($args as $a) {
            $stmt->bindValue($i++, $a, PDO::PARAM_STR);
        }
        $stmt->bindValue($i++, $limit, PDO::PARAM_INT);
        $stmt->bindValue($i, ($page - 1) * $limit, PDO::PARAM_INT);
        $stmt->execute();
        out([
            'data'  => array_map('to_report', $stmt->fetchAll()),
            'total' => $total, 'page' => $page, 'pages' => $pages, 'limit' => $limit,
        ]);
    }

    if ($path === '/reports' && $method === 'POST') {
        $b  = body();
        $v  = [
            text($b['nama_pelapor'] ?? null, 'Nama pelapor', 100),
            text($b['nim_nip'] ?? null, 'NIM/NIP', 30),
            text($b['kategori_kerusakan'] ?? null, 'Kategori kerusakan', 60),
            text($b['lokasi'] ?? null, 'Lokasi', 120),
            text($b['deskripsi'] ?? null, 'Deskripsi kerusakan', 2000),
        ];
        $kp = $b['kategori_pelapor'] ?? '';
        if (!in_array($kp, KATEGORI, true)) {
            fail(400, 'Kategori pelapor tidak valid.');
        }
        $foto = !empty($b['foto']) ? save_foto($b['foto']) : null;
        try {
            $st = db()->prepare('INSERT INTO reports (tanggal, nama_pelapor, nim_nip, kategori_pelapor, kategori_kerusakan, lokasi, deskripsi, foto, created_by) VALUES (?,?,?,?,?,?,?,?,?)');
            $st->execute([date('Y-m-d'), $v[0], $v[1], $kp, $v[2], $v[3], $v[4], $foto, $user['id']]);
            out(to_report(find_report((int)db()->lastInsertId())), 201);
        } catch (PDOException $e) {
            if ($foto) {
                @unlink(cfg()['upload_dir'] . '/' . $foto);
            }
            throw $e;
        }
    }

    if (preg_match('#^/reports/(\d+)$#', $path, $m) && $method === 'GET') {
        $r  = find_report((int)$m[1]);
        $st = db()->prepare('SELECT l.status_lama, l.status_baru, l.created_at, u.nama AS oleh FROM status_log l LEFT JOIN users u ON u.id = l.user_id WHERE l.report_id = ? ORDER BY l.id DESC');
        $st->execute([(int)$r['id']]);
        out(to_report($r) + ['riwayat' => $st->fetchAll()]);
    }

    if (preg_match('#^/reports/(\d+)/status$#', $path, $m) && $method === 'PATCH') {
        $b = body();
        if (!in_array($b['status'] ?? '', STATUS, true)) {
            fail(400, 'Status tidak valid.');
        }
        $r = find_report((int)$m[1]);
        if ($r['status'] !== $b['status']) {
            $pdo = db();
            $pdo->beginTransaction();
            try {
                $pdo->prepare('UPDATE reports SET status = ? WHERE id = ?')->execute([$b['status'], $r['id']]);
                $pdo->prepare('INSERT INTO status_log (report_id, status_lama, status_baru, user_id) VALUES (?,?,?,?)')
                    ->execute([$r['id'], $r['status'], $b['status'], $user['id']]);
                $pdo->commit();
            } catch (Throwable $e) {
                $pdo->rollBack();
                throw $e;
            }
        }
        out(to_report(find_report((int)$r['id'])));
    }

    fail(404, 'Endpoint tidak ditemukan.');
} catch (HttpError $e) {
    out(['error' => $e->getMessage()], $e->getCode());
} catch (Throwable $e) {
    error_log('[CampusCare] ' . $e->getMessage());
    if ($e instanceof PDOException && preg_match('/\[(1045|1049|2002)\]/', $e->getMessage())) {
        out(['error' => "Tidak dapat terhubung ke database. Pastikan MySQL di Laragon sudah menyala, database 'campuscare' sudah diimpor, dan cek api/config.php."], 500);
    }
    out(['error' => 'Terjadi kesalahan pada server.'], 500);
}
