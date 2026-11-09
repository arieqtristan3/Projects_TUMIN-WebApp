-- TUMIN v2: seed non-credential awal.
-- Aman dijalankan berulang kali. Tidak membuat akun dengan password bawaan.
BEGIN;
INSERT INTO pengaturan_toko (id, nama_toko)
VALUES (1, 'TUMIN')
ON CONFLICT (id) DO NOTHING;
COMMIT;

-- Buat akun Owner secara manual setelah schema dibuat.
-- Password wajib berupa bcrypt hash; jangan simpan password plaintext.
-- Contoh generator hash lokal (jalankan dari folder project):
--   node --input-type=module -e "import bcrypt from 'bcryptjs'; console.log(await bcrypt.hash(process.env.OWNER_PASSWORD, 12))"
-- Kemudian INSERT dengan hash yang dihasilkan:
-- INSERT INTO pengguna (id, username, nama_lengkap, email, password, peran, aktif)
-- VALUES ('owner-001', 'owner', 'Nama Owner', 'owner@example.com', '<BCRYPT_HASH>', 'owner', TRUE);
-- Ganti seluruh nilai contoh sebelum digunakan. Jangan commit hash/password ke Git.
