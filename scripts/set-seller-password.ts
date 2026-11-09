
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

// Ambil konfigurasi dari environment variables
const connectionString = process.env.DATABASE_URL;
const sellerId = process.env.SELLER_ID;
const newPassword = process.env.SELLER_NEW_PASSWORD;

// Validasi konfigurasi database
if (!connectionString) {
  throw new Error('DATABASE_URL wajib diatur.');
}

// Validasi ID Seller
if (!sellerId) {
  throw new Error('SELLER_ID wajib diatur.');
}

// Validasi password secara eksplisit
if (typeof newPassword !== 'string' || newPassword.length < 12) {
  throw new Error(
    'SELLER_NEW_PASSWORD wajib diisi dan minimal 12 karakter.'
  );
}

// Setelah validasi, TypeScript mengenali nilai ini sebagai string
const passwordToHash: string = newPassword;

const pool = new Pool({
  connectionString,
  ssl:
    process.env.PGSSL === 'true'
      ? { rejectUnauthorized: true }
      : undefined,
  connectionTimeoutMillis: 10000,
});

async function main(): Promise<void> {
  try {
    // Hash password menggunakan bcrypt
    const hash = await bcrypt.hash(passwordToHash, 12);

    // Perbarui password Seller berdasarkan ID
    const result = await pool.query(
      `UPDATE mitra_seller
       SET password = $1
       WHERE id = $2
       RETURNING id`,
      [hash, sellerId]
    );

    // Pastikan tepat satu akun Seller ditemukan
    if (result.rowCount !== 1) {
      throw new Error('Seller ID tidak ditemukan.');
    }

    console.log(
      `Password Seller ${sellerId} berhasil diperbarui dengan bcrypt.`
    );
  } finally {
    // Tutup koneksi database
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Terjadi kesalahan tidak dikenal.';

  console.error('Gagal memperbarui password Seller:', message);
  process.exitCode = 1;
});
