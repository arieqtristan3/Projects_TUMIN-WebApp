import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL wajib diatur sebelum migrasi password.');

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: true } : undefined,
  connectionTimeoutMillis: 10000,
});

const isBcryptHash = (value: string | null): boolean =>
  typeof value === 'string' && /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);

async function main() {
  const client = await pool.connect();
  let usersHashed = 0;
  let sellersHashed = 0;
  try {
    await client.query('BEGIN');
    const users = await client.query("SELECT id, password FROM pengguna WHERE password IS NOT NULL AND password <> ''");
    for (const row of users.rows) {
      if (isBcryptHash(row.password)) continue;
      const hash = await bcrypt.hash(String(row.password), 12);
      const updated = await client.query('UPDATE pengguna SET password = $1 WHERE id = $2 AND password = $3', [hash, row.id, row.password]);
      usersHashed += updated.rowCount || 0;
    }
    const sellers = await client.query("SELECT id, password FROM mitra_seller WHERE password IS NOT NULL AND password <> ''");
    for (const row of sellers.rows) {
      if (isBcryptHash(row.password)) continue;
      const hash = await bcrypt.hash(String(row.password), 12);
      const updated = await client.query('UPDATE mitra_seller SET password = $1 WHERE id = $2 AND password = $3', [hash, row.id, row.password]);
      sellersHashed += updated.rowCount || 0;
    }
    await client.query('COMMIT');
    console.log(`Migrasi password selesai. Akun internal di-hash: ${usersHashed}; Seller di-hash: ${sellersHashed}.`);
    console.log('Tidak ada nilai password yang ditampilkan. Akun tanpa password tetap tidak berubah.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Migrasi password gagal:', error.message);
  process.exitCode = 1;
});
