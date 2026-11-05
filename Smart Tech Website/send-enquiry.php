<?php
/*
 * Smart Tech – sends website enquiries to the sales inbox.
 * Used only when the HTML website is on web hosting with PHP (for example GoDaddy cPanel).
 * When the website is opened from a computer folder, enquiries go out through WhatsApp or email instead.
 */
declare(strict_types=1);

const SEND_TO = 'rishikesh@smarttech.org.in';            // sales inbox that receives every enquiry
date_default_timezone_set('Asia/Kolkata');
const MAX_FILE_MB = 5;
const MAX_PER_10_MIN = 6;             // per visitor IP address

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function reply(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}
function field(string $k, int $max = 500): string
{
    $v = trim((string)($_POST[$k] ?? ''));
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
}
function one_line(string $v): string
{
    return trim(preg_replace('/[\r\n\t]+/', ' ', $v));
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reply(['ok' => false, 'error' => 'Method not allowed.'], 405);

// same-site check: the form must come from this website
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$host = $_SERVER['HTTP_HOST'] ?? '';
if ($origin && parse_url($origin, PHP_URL_HOST) !== preg_replace('/:\d+$/', '', $host)) reply(['ok' => false, 'error' => 'Your enquiry could not be sent. Please call or email us.'], 403);

// anti-spam: hidden field filled, or sent too quickly
if (field('website') !== '' || (int)field('elapsed', 10) < 3) reply(['ok' => true, 'ref' => '']);

// rate limit per IP
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$rl = sys_get_temp_dir() . '/st_enq_' . substr(hash('sha256', $ip . __FILE__), 0, 24);
$hits = array_filter(json_decode((string)@file_get_contents($rl), true) ?: [], fn($t) => $t > time() - 600);
if (count($hits) >= MAX_PER_10_MIN) reply(['ok' => false, 'error' => 'Too many enquiries were sent from this connection. Please wait a few minutes, or call us.'], 429);
$hits[] = time();
@file_put_contents($rl, json_encode(array_values($hits)), LOCK_EX);

// checks (the page checks the same things before sending)
$name = one_line(field('name', 120));
$email = one_line(field('email', 190));
$phone = one_line(field('country_code', 6) . ' ' . field('phone', 20));
if (mb_strlen($name) < 2) reply(['ok' => false, 'error' => 'Enter your full name.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) reply(['ok' => false, 'error' => 'Enter a valid email address.']);
$digits = preg_replace('/\D/', '', field('phone', 20));
if (strlen($digits) < 7 || strlen($digits) > 15) reply(['ok' => false, 'error' => 'Enter a valid mobile number.']);

$summary = field('summary', 8000);
if ($summary === '') reply(['ok' => false, 'error' => 'Your enquiry could not be sent. Please call or email us.']);
$subject = one_line(field('subject', 160)) ?: 'Website enquiry from ' . $name;
$ref = 'ST-' . date('ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));

$body = str_replace('*', '', $summary) . "\n\n----\nReference: $ref\nSent: " . date('d M Y, h:i A') . "\nIP address: $ip\nReply to this email to answer the customer directly.\n";

// optional attachment
$file = null;
if (!empty($_FILES['attachment']) && ($_FILES['attachment']['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_NO_FILE) {
    $f = $_FILES['attachment'];
    $ext = strtolower(pathinfo((string)$f['name'], PATHINFO_EXTENSION));
    if ($f['error'] !== UPLOAD_ERR_OK || $f['size'] > MAX_FILE_MB * 1048576) reply(['ok' => false, 'error' => 'The attached file is larger than ' . MAX_FILE_MB . ' MB. Attach a smaller file or email it to us.']);
    if (!in_array($ext, ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png'], true)) reply(['ok' => false, 'error' => 'Attach a PDF, Word, Excel, JPG or PNG file.']);
    $head = (string)file_get_contents($f['tmp_name'], false, null, 0, 262144);
    if (preg_match('/<\?php|<script\b/i', $head)) reply(['ok' => false, 'error' => 'This file was rejected by the security check. Attach a different file.']);
    $file = ['name' => preg_replace('/[^\w.\- ()]+/u', '_', basename((string)$f['name'])), 'data' => file_get_contents($f['tmp_name'])];
}

// build and send the email
$domain = preg_replace('/^www\./', '', preg_replace('/:\d+$/', '', $host)) ?: 'localhost';
$from = 'website@' . $domain;
$headers = [
    'From: Smart Tech Website <' . $from . '>',
    'Reply-To: ' . '=?UTF-8?B?' . base64_encode($name) . '?= <' . $email . '>',
    'MIME-Version: 1.0',
    'X-Mailer: SmartTech-Website',
];
if ($file) {
    $b = 'b' . bin2hex(random_bytes(12));
    $headers[] = 'Content-Type: multipart/mixed; boundary="' . $b . '"';
    $msg = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($body))
         . "--$b\r\nContent-Type: application/octet-stream; name=\"{$file['name']}\"\r\nContent-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"{$file['name']}\"\r\n\r\n" . chunk_split(base64_encode($file['data']))
         . "--$b--\r\n";
} else {
    $headers[] = 'Content-Type: text/plain; charset=UTF-8';
    $headers[] = 'Content-Transfer-Encoding: base64';
    $msg = chunk_split(base64_encode($body));
}
$ok = @mail(SEND_TO, '=?UTF-8?B?' . base64_encode('[' . $ref . '] ' . $subject) . '?=', $msg, implode("\r\n", $headers), '-f' . $from);

// keep a copy on the server too, in case email delivery fails
$dir = __DIR__ . '/enquiries-log';
if (!is_dir($dir)) { @mkdir($dir, 0750); @file_put_contents($dir . '/.htaccess', "Require all denied\n"); }
@file_put_contents($dir . '/' . date('Y-m') . '.txt', "==== $ref ====\n$body" . ($ok ? '' : "(EMAIL NOT SENT)\n") . "\n", FILE_APPEND | LOCK_EX);

if (!$ok) reply(['ok' => false]);   // the page then offers WhatsApp / email instead
reply(['ok' => true, 'ref' => $ref]);
