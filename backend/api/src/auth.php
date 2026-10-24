<?php
declare(strict_types=1);

function b64u(string $s): string
{
    return rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
}

function b64u_dec(string $s): string
{
    $r = base64_decode(strtr($s, '-_', '+/'), true);
    return $r === false ? '' : $r;
}

function jwt_sign(array $payload): string
{
    $c = cfg();
    $head = b64u(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $body = b64u(json_encode($payload + ['exp' => time() + (int)$c['jwt_ttl']]));
    $sig  = b64u(hash_hmac('sha256', "$head.$body", $c['jwt_secret'], true));
    return "$head.$body.$sig";
}

function jwt_verify(string $token): ?array
{
    $p = explode('.', $token);
    if (count($p) !== 3) {
        return null;
    }
    $h = json_decode(b64u_dec($p[0]), true);
    if (!is_array($h) || ($h['alg'] ?? '') !== 'HS256') {
        return null;
    }
    $expect = b64u(hash_hmac('sha256', $p[0] . '.' . $p[1], cfg()['jwt_secret'], true));
    if (!hash_equals($expect, $p[2])) {
        return null;
    }
    $pl = json_decode(b64u_dec($p[1]), true);
    return (is_array($pl) && ($pl['exp'] ?? 0) > time()) ? $pl : null;
}

function bearer_token(): string
{
    $h = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if ($h === '' && function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strtolower((string)$k) === 'authorization') {
                $h = (string)$v;
            }
        }
    }
    return preg_match('/^Bearer\s+(.+)$/i', $h, $m) ? trim($m[1]) : '';
}
