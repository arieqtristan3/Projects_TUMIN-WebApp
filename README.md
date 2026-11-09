# TUMIN — Tino Underwear Management & POS System

Aplikasi manajemen operasional Tino Underwear yang mencakup POS, katalog produk, stok, mitra Seller, faktur, piutang, dan konsinyasi.

## Teknologi
- Frontend: React 19 + Vite + TypeScript
- Backend: Node.js 24 + Express + TypeScript
- Database: PostgreSQL
- Authentication: JWT + bcrypt

## Menjalankan secara lokal
1. Gunakan Node.js 24.
2. Instal dependensi: `npm install`.
3. Salin `.env.example` menjadi `.env`.
4. Isi `DATABASE_URL` dan `JWT_SECRET` (minimal 32 karakter acak).
5. Siapkan PostgreSQL dan jalankan migration yang sesuai setelah backup terverifikasi.
6. Jalankan `npm run dev`.

## Pemeriksaan
- `npm run lint` — pemeriksaan TypeScript.
- `npm run build` — pemeriksaan TypeScript dan build frontend.
- `npm run start` — menjalankan server Express.

## Deployment Railway
Lihat [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md).

## Keamanan database
- Aplikasi tidak membuat akun Owner/Kasir bawaan secara otomatis.
- Login hanya menggunakan akun yang tersimpan di PostgreSQL.
- Jangan commit `.env`, secret, token, backup berisi data pribadi, atau password.
- `tumin_schema.sql` adalah file legacy yang dinonaktifkan; jangan dijalankan.
- Gunakan migration pada folder `migrations/` setelah backup dan uji restore.

## Catatan
Akun demo dan kredensial tidak disimpan di source code. Buat/kelola akun melalui proses administrasi database yang aman dan simpan kredensial secara terpisah.
