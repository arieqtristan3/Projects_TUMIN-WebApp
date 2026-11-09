import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'node:crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface AuthUserPayload {
  id: string;
  username: string;
  role: 'owner' | 'kasir' | 'seller';
  name?: string;
  email?: string;
  storeName?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// ====================================================================
// 0. TRUST PROXY CONFIGURATION (REVERSE PROXY / Railway reverse proxy)
// ====================================================================
// Validasi ketat variabel lingkungan TRUST_PROXY.
// Hanya nilai '1' yang diizinkan untuk topologi Railway (1 proxy hop).
// Nilai 'false', '0', atau tidak diatur akan menonaktifkan trust proxy secara penuh (default aman lokal).
// Nilai di luar daftar yang diuji ditolak secara eksplisit dengan peringatan keamanan.
const rawTrustProxy = process.env.TRUST_PROXY?.trim();
if (!rawTrustProxy || rawTrustProxy === 'false' || rawTrustProxy === '0') {
  app.set('trust proxy', false);
  console.log('🛡️ [Reverse Proxy] Trust proxy dinonaktifkan (mode langsung / lokal). Header X-Forwarded-For diabaikan.');
} else if (rawTrustProxy === '1') {
  app.set('trust proxy', 1);
  console.log('🛡️ [Reverse Proxy] Trust proxy diaktifkan khusus 1 hop terdekat (Railway / reverse proxy tunggal).');
} else {
  console.warn(`⚠️ [Konfigurasi Keamanan] Nilai TRUST_PROXY="${rawTrustProxy}" tidak didukung. Menolak konfigurasi tidak dikenal dan menetapkan default aman (trust proxy: false).`);
  app.set('trust proxy', false);
}

// ====================================================================
// 1. KONEKSI KE DATABASE POSTGRESQL (tumin_db)
// ====================================================================
const dbUrl = process.env.DATABASE_URL;
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD;
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT) || 5432;
const dbName = process.env.DB_NAME || 'tumin_db';

let pool: Pool | null = null;
let isDbConnected = false;

if (dbUrl && dbUrl.trim() !== '') {
  // Railway menyediakan DATABASE_URL; prioritaskan URL agar kredensial tidak terpecah.
  pool = new Pool({ connectionString: dbUrl, connectionTimeoutMillis: 10000, max: 10 });
} else if (dbPassword) {
  // Konfigurasi eksplisit untuk pengembangan lokal.
  pool = new Pool({ user: dbUser, password: dbPassword, host: dbHost, port: dbPort, database: dbName, connectionTimeoutMillis: 10000, max: 10 });
}

// ====================================================================
// 2. SECURITY HEADERS (HELMET) & CORS WHITELIST
// ====================================================================
app.use(
  helmet({
    contentSecurityPolicy: false, // Vite inline dev scripts & iFrame embedding
    crossOriginEmbedderPolicy: false,
  })
);

const corsOriginEnv = process.env.CORS_ORIGIN;
const defaultAllowedOrigins = process.env.NODE_ENV === 'production'
  ? []
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];
const allowedOrigins = corsOriginEnv
  ? corsOriginEnv.split(',').map((origin) => origin.trim()).filter(Boolean)
  : defaultAllowedOrigins;

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (curl, server-to-server) atau origin domain terdaftar spesifik (tanpa wildcard)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Origin tidak diizinkan oleh kebijakan CORS TUMIN'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '15mb' }));

// ====================================================================
// 3. KONFIGURASI JWT & MIDDLEWARE AUTENTIKASI (HS256)
// ====================================================================
const JWT_SECRET = process.env.JWT_SECRET?.trim();
if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.includes('CHANGE_ME')) {
  throw new Error('JWT_SECRET wajib diatur dan minimal 32 karakter. Buat secret acak melalui environment variable.');
}
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_ISSUER = 'tumin-pos-api';
const JWT_AUDIENCE = 'tumin-pos-client';

export const generateToken = (user: AuthUserPayload): string => {
  const options: jwt.SignOptions = {
    algorithm: 'HS256',
    expiresIn: (JWT_EXPIRES_IN || '24h') as any,
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  };

  return jwt.sign(
    {
      sub: user.id,
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    },
    JWT_SECRET,
    options
  );
};

export const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Akses ditolak. Token otentikasi (Bearer token) tidak disertakan.',
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as any;

    const userId = decoded.id || decoded.sub;
    let userRole = decoded.role as 'owner' | 'kasir' | 'seller';

    // 🛡️ FAIL-CLOSED POLICY (Keamanan Mutlak Akses Endpoint Privat):
    // Semua endpoint privat mewajibkan verifikasi akun aktual ke database PostgreSQL.
    // Jika database tidak tersedia (offline) atau terjadi kegagalan query, akses DITOLAK (HTTP 503).
    // Sistem TIDAK memberikan akses berdasarkan fallback in-memory atau asumsi JWT valid.
    if (!pool || !isDbConnected) {
      return res.status(503).json({
        success: false,
        error: 'Layanan autentikasi database sedang tidak tersedia (Database Offline). Akses endpoint privat ditolak demi keamanan data (Fail-Closed).',
      });
    }

    try {
      if (userRole === 'seller') {
        const sellerCheck = await pool.query(
          'SELECT id, status FROM mitra_seller WHERE id = $1 LIMIT 1',
          [userId]
        );
        if (sellerCheck.rows.length === 0) {
          return res.status(401).json({
            success: false,
            error: 'Akun mitra seller tidak ditemukan pada database sistem.',
          });
        }
        const sellerStatus = String(sellerCheck.rows[0].status || '').toLowerCase();
        if (!['aktif', 'active'].includes(sellerStatus)) {
          return res.status(403).json({
            success: false,
            error: sellerStatus === 'pending'
              ? 'Akun Seller masih menunggu persetujuan Owner.'
              : 'Akun Seller tidak aktif atau ditangguhkan.',
          });
        }
      } else {
        // Role internal toko: wajib terdaftar pada tabel pengguna (owner atau kasir)
        const userCheck = await pool.query(
          'SELECT id, username, peran, aktif FROM pengguna WHERE id = $1 LIMIT 1',
          [userId]
        );

        if (userCheck.rows.length === 0) {
          // Zero Trust: Tidak ada pengecualian in-memory/bypass berdasarkan klaim JWT
          return res.status(401).json({
            success: false,
            error: 'Akun pengguna tidak ditemukan pada database sistem.',
          });
        }

        const dbUser = userCheck.rows[0];

        // 1. Validasi Status Keaktifan Akun Pengguna
        if (dbUser.aktif === false) {
          return res.status(403).json({
            success: false,
            error: 'Akses ditolak. Akun pengguna Anda telah dinonaktifkan oleh administrator.',
          });
        }

        // 2. Validasi & Sinkronisasi Role Mutlak dari Database
        const rawRole = dbUser.peran ? String(dbUser.peran).toLowerCase().trim() : '';
        const allowedInternalRoles: Array<'owner' | 'kasir'> = ['owner', 'kasir'];

        if (!rawRole || !allowedInternalRoles.includes(rawRole as any)) {
          return res.status(403).json({
            success: false,
            error: `Akses ditolak. Peran pengguna pada database ("${rawRole || 'kosong'}") tidak valid atau tidak memiliki izin operasional.`,
          });
        }

        // Peran di-override secara mutlak dari database, menimpa klaim lama di JWT
        userRole = rawRole as 'owner' | 'kasir';
      }
    } catch (dbErr: any) {
      console.error('❌ [verifyAuth] Gagal memverifikasi status akun ke database:', dbErr.message);
      return res.status(503).json({
        success: false,
        error: 'Gagal memverifikasi status akun pengguna ke database. Permintaan ditolak demi keamanan data (Fail-Closed).',
      });
    }

    req.user = {
      id: userId,
      username: decoded.username,
      role: userRole,
      name: decoded.name,
    };
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Sesi telah kedaluwarsa. Silakan login kembali.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Token otentikasi tidak valid atau telah dimanipulasi.',
    });
  }
};

export const requireRole = (...allowedRoles: Array<'owner' | 'kasir' | 'seller'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Pengguna belum terautentikasi.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Akses ditolak. Peran "${req.user.role}" tidak memiliki izin untuk tindakan ini.`,
      });
    }

    next();
  };
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 10, // Maksimal 10 percobaan per IP
  message: {
    success: false,
    error: 'Terlalu banyak percobaan login gagal dari IP ini. Silakan coba lagi setelah 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 pendaftaran mitra per IP
  message: {
    success: false,
    error: 'Terlalu banyak permintaan pendaftaran mitra dari IP ini. Silakan coba lagi setelah 15 menit.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const verifyDatabaseSchema = async (dbPool: Pool): Promise<void> => {
  // Tidak membuat tabel/akun otomatis. Skema harus disiapkan melalui migration terkontrol.
  await dbPool.query('SELECT id, username, nama_lengkap, password, peran, aktif FROM pengguna LIMIT 0');
  await dbPool.query('SELECT id, username, password, status FROM mitra_seller LIMIT 0');
  await dbPool.query('SELECT id, gambar FROM produk LIMIT 0');
  await dbPool.query('SELECT id, email_bisnis, stok_minimum_default FROM pengaturan_toko LIMIT 0');
  await dbPool.query('SELECT id, referensi FROM mutasi_stok LIMIT 0');
  await dbPool.query('SELECT id, status FROM barang_konsinyasi LIMIT 0');
  await dbPool.query('SELECT id, harga_pokok_satuan FROM item_faktur LIMIT 0');
};

if (pool) {
  void (async () => {
    try {
      await pool!.query('SELECT 1');
      await verifyDatabaseSchema(pool!);
      isDbConnected = true;
      console.log('PostgreSQL terhubung dan skema TUMIN terverifikasi.');
    } catch (error) {
      isDbConnected = false;
      console.error('Database belum siap. Pastikan migration TUMIN sudah dijalankan dan DATABASE_URL benar.');
      console.error(error instanceof Error ? error.message : 'Kesalahan database tidak diketahui.');
    }
  })();
} else {
  console.warn('DATABASE_URL belum diatur. Endpoint yang membutuhkan database akan mengembalikan HTTP 503.');
}

// ====================================================================
// 2. ENDPOINT STATUS SISTEM & DATABASE
// ====================================================================
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', service: 'tumin-api' });
});

app.get('/ready', async (_req: Request, res: Response) => {
  if (!pool) return res.status(503).json({ status: 'not_ready', database: 'not_configured' });
  try {
    await pool.query('SELECT 1');
    if (!isDbConnected) await verifyDatabaseSchema(pool);
    isDbConnected = true;
    return res.status(200).json({ status: 'ready', database: 'connected' });
  } catch {
    isDbConnected = false;
    return res.status(503).json({ status: 'not_ready', database: 'unavailable_or_schema_mismatch' });
  }
});

app.get('/api/status', async (_req: Request, res: Response) => {
  let dbLatencyMs: number | null = null;
  let activeDbName = dbName;
  let queryError: string | null = null;

  if (pool) {
    try {
      const startTime = Date.now();
      const testRes = await pool.query('SELECT NOW() as server_time, current_database() as db_name');
      await verifyDatabaseSchema(pool);
      dbLatencyMs = Date.now() - startTime;
      isDbConnected = true;
      if (testRes.rows[0]?.db_name) {
        activeDbName = testRes.rows[0].db_name;
      }
    } catch (err: any) {
      isDbConnected = false;
      queryError = 'Database query or schema verification failed.';
    }
  }

  res.json({
    status: 'ok',
    appName: 'TUMIN Information System & POS',
    database: isDbConnected ? 'connected' : 'offline_fallback',
    isDatabaseConnected: isDbConnected,
    databaseType: 'PostgreSQL',
    databaseName: activeDbName,
    latencyMs: dbLatencyMs,
    queryError,
    timestamp: new Date().toISOString(),
    message: isDbConnected
      ? `Terhubung aktif ke database PostgreSQL (${activeDbName})`
      : 'Database PostgreSQL belum siap atau skemanya belum sesuai.',
  });
});

// ====================================================================
// 3. API PENGATURAN TOKO (Tabel: pengaturan_toko)
// ====================================================================
app.get('/api/pengaturan', verifyAuth, requireRole('owner', 'kasir', 'seller'), async (_req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  }
  try {
    const result = await pool.query('SELECT * FROM pengaturan_toko WHERE id = 1');
    if (result.rows.length > 0) {
      const row = result.rows[0];
      res.json({
        source: 'postgresql',
        data: {
          storeName: row.nama_toko,
          tagline: row.slogan,
          address: row.alamat,
          phone: row.no_telepon,
          email: row.email_bisnis || '',
          bankName: row.nama_bank,
          bankAccountNumber: row.nomor_rekening,
          bankAccountHolder: row.atas_nama_rekening,
          operatingHours: row.jam_operasional,
          receiptFooter: row.pesan_kaki_struk,
          minStockDefault: Number(row.stok_minimum_default ?? 10),
        },
      });
    } else {
      res.json({ source: 'postgresql', data: null });
    }
  } catch (err: any) {
    console.error('Permintaan database gagal:', err instanceof Error ? err.message : 'unknown error');
    res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server. Silakan coba kembali.' });
  }
});

app.put('/api/pengaturan', verifyAuth, requireRole('owner'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia. Operasi tidak disimpan.' });
  }
  const s = req.body;
  try {
    await pool.query(
      `INSERT INTO pengaturan_toko (id, nama_toko, slogan, alamat, no_telepon, email_bisnis, nama_bank, nomor_rekening, atas_nama_rekening, jam_operasional, pesan_kaki_struk, stok_minimum_default)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         nama_toko = EXCLUDED.nama_toko,
         slogan = EXCLUDED.slogan,
         alamat = EXCLUDED.alamat,
         no_telepon = EXCLUDED.no_telepon,
         email_bisnis = EXCLUDED.email_bisnis,
         nama_bank = EXCLUDED.nama_bank,
         nomor_rekening = EXCLUDED.nomor_rekening,
         atas_nama_rekening = EXCLUDED.atas_nama_rekening,
         jam_operasional = EXCLUDED.jam_operasional,
         pesan_kaki_struk = EXCLUDED.pesan_kaki_struk,
         stok_minimum_default = EXCLUDED.stok_minimum_default,
         diperbarui_pada = CURRENT_TIMESTAMP`,
      [
        s.storeName,
        s.tagline,
        s.address,
        s.phone,
        s.email || null,
        s.bankName,
        s.bankAccountNumber,
        s.bankAccountHolder,
        s.operatingHours,
        s.receiptFooter,
        Number.isInteger(Number(s.minStockDefault)) && Number(s.minStockDefault) >= 0 ? Number(s.minStockDefault) : 10,
      ]
    );
    res.json({ success: true, message: 'Pengaturan toko berhasil disimpan ke database' });
  } catch (err: any) {
    console.error('Permintaan database gagal:', err instanceof Error ? err.message : 'unknown error');
    res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server. Silakan coba kembali.' });
  }
});

// ====================================================================
// 4. API KATALOG PRODUK (Tabel: produk)
// ====================================================================
app.get('/api/produk', verifyAuth, requireRole('owner', 'kasir', 'seller'), async (_req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  }
  try {
    const result = await pool.query('SELECT * FROM produk ORDER BY sku ASC');
    const mapped = result.rows.map((r) => ({
      id: r.id,
      sku: r.sku,
      name: r.nama_produk,
      category: r.kategori,
      price: Number(r.harga_jual),
      costPrice: Number(r.harga_pokok_modal),
      stock: Number(r.stok),
      minStock: Number(r.stok_minimum),
      unit: r.satuan,
      description: r.deskripsi,
      image: r.gambar || undefined,
      lastUpdated: r.terakhir_diperbarui,
    }));
    res.json({ source: 'postgresql', data: mapped });
  } catch (err: any) {
    console.error('Permintaan database gagal:', err instanceof Error ? err.message : 'unknown error');
    res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server. Silakan coba kembali.' });
  }
});

app.post('/api/produk', verifyAuth, requireRole('owner', 'kasir'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia. Operasi tidak disimpan.' });
  const p = req.body || {};
  if (!p.id || !p.sku || !p.name || !Number.isFinite(Number(p.price)) || !Number.isInteger(Number(p.stock)) || Number(p.stock) < 0) {
    return res.status(400).json({ success: false, error: 'Data produk tidak valid.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query(
      `INSERT INTO produk (id, sku, nama_produk, kategori, harga_jual, harga_pokok_modal, stok, stok_minimum, satuan, deskripsi, gambar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (id) DO UPDATE SET
         sku = EXCLUDED.sku, nama_produk = EXCLUDED.nama_produk, kategori = EXCLUDED.kategori,
         harga_jual = EXCLUDED.harga_jual, harga_pokok_modal = EXCLUDED.harga_pokok_modal,
         stok_minimum = EXCLUDED.stok_minimum, satuan = EXCLUDED.satuan, deskripsi = EXCLUDED.deskripsi,
         gambar = COALESCE(EXCLUDED.gambar, produk.gambar), terakhir_diperbarui = CURRENT_TIMESTAMP
       RETURNING id, sku, nama_produk, stok, (xmax = 0) AS inserted`,
      [p.id, p.sku, p.name, p.category, p.price, p.costPrice || 0, p.stock, p.minStock || 0, p.unit || 'Pcs', p.description || '', p.image || null]
    );
    const saved = result.rows[0];
    if (saved.inserted && Number(saved.stok) > 0) {
      await client.query(
        `INSERT INTO mutasi_stok (id, tanggal, id_produk, sku_produk, nama_produk, jenis_mutasi, jumlah_perubahan, stok_sebelum, stok_sesudah, catatan, penanggung_jawab, referensi)
         VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, 'RESTOCK', $5, 0, $5, $6, $7, $8)`,
        [`mut-init-${Date.now()}-${Math.floor(Math.random()*10000)}`, saved.id, saved.sku, saved.nama_produk, Number(saved.stok), 'Stok awal saat produk dibuat', req.user?.username || req.user?.id || 'Pengguna', 'STOK-AWAL']
      );
    }
    await client.query('COMMIT');
    return res.json({ success: true, source: 'postgresql', message: 'Produk berhasil disimpan ke PostgreSQL.' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    const duplicate = err?.code === '23505';
    return res.status(duplicate ? 409 : 400).json({ success: false, error: duplicate ? 'SKU atau ID produk sudah digunakan.' : (err instanceof Error ? err.message : 'Produk gagal disimpan.') });
  } finally { client.release(); }
});

// Penyesuaian stok atomik: update produk dan audit mutasi dalam satu transaksi DB.
app.post('/api/produk/:id/stock-adjustment', verifyAuth, requireRole('owner', 'kasir'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  const productId = String(req.params.id || '');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT id, sku, nama_produk, stok FROM produk WHERE id = $1 FOR UPDATE', [productId]);
    if (current.rowCount !== 1) throw new Error('Produk tidak ditemukan.');
    const product = current.rows[0];
    const oldStock = Number(product.stok);
    const requestedNewStock = req.body.newStock !== undefined ? Number(req.body.newStock) : oldStock + Number(req.body.change);
    if (!Number.isInteger(requestedNewStock) || requestedNewStock < 0) throw new Error('Jumlah stok harus bilangan bulat nol atau lebih.');
    const diff = requestedNewStock - oldStock;
    if (diff === 0) { await client.query('COMMIT'); return res.json({ success: true, unchanged: true }); }
    const newStock = requestedNewStock;
    const type = ['RESTOCK','RUSAK_REJECT','OPNAME_KOREKSI'].includes(req.body.type)
      ? req.body.type : (diff > 0 ? 'RESTOCK' : (/rusak|reject/i.test(String(req.body.reason || '')) ? 'RUSAK_REJECT' : 'OPNAME_KOREKSI'));
    await client.query('UPDATE produk SET stok = $1, terakhir_diperbarui = CURRENT_TIMESTAMP WHERE id = $2', [newStock, productId]);
    await client.query(
      `INSERT INTO mutasi_stok (id, tanggal, id_produk, sku_produk, nama_produk, jenis_mutasi, jumlah_perubahan, stok_sebelum, stok_sesudah, catatan, penanggung_jawab, referensi)
       VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [`mut-${Date.now()}-${Math.floor(Math.random()*10000)}`, productId, product.sku, product.nama_produk, type, diff, oldStock, newStock, String(req.body.reason || ''), req.user?.username || req.user?.id || 'Pengguna', String(req.body.reference || '') || null]
    );
    await client.query('COMMIT');
    return res.json({ success: true, source: 'postgresql', data: { productId, previousStock: oldStock, newStock } });
  } catch (error: any) {
    await client.query('ROLLBACK');
    return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Penyesuaian stok gagal.' });
  } finally { client.release(); }
});

// Stock opname batch: semua koreksi stok dan mutasi tersimpan atomik.
app.post('/api/stok/opname', verifyAuth, requireRole('owner'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  const adjustments = req.body?.adjustments;
  if (!Array.isArray(adjustments) || adjustments.length === 0) return res.status(400).json({ success: false, error: 'Daftar penyesuaian stock opname kosong.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const reference = `OPN-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.floor(100 + Math.random()*900)}`;
    for (const adjustment of adjustments) {
      const productId = String(adjustment.productId || '');
      const newStock = Number(adjustment.physicalStock);
      if (!productId || !Number.isInteger(newStock) || newStock < 0) throw new Error('Data stock opname tidak valid.');
      const current = await client.query('SELECT id, sku, nama_produk, stok FROM produk WHERE id = $1 FOR UPDATE', [productId]);
      if (current.rowCount !== 1) throw new Error(`Produk ${productId} tidak ditemukan.`);
      const product = current.rows[0]; const oldStock = Number(product.stok); const diff = newStock - oldStock;
      if (diff === 0) continue;
      const reason = String(adjustment.reason || 'Koreksi stock opname');
      const type = diff < 0 && /rusak|reject/i.test(reason) ? 'RUSAK_REJECT' : 'OPNAME_KOREKSI';
      await client.query('UPDATE produk SET stok = $1, terakhir_diperbarui = CURRENT_TIMESTAMP WHERE id = $2', [newStock, productId]);
      await client.query(
        `INSERT INTO mutasi_stok (id, tanggal, id_produk, sku_produk, nama_produk, jenis_mutasi, jumlah_perubahan, stok_sebelum, stok_sesudah, catatan, penanggung_jawab, referensi)
         VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [`mut-opn-${Date.now()}-${Math.floor(Math.random()*100000)}`, productId, product.sku, product.nama_produk, type, diff, oldStock, newStock, reason, req.user?.username || req.user?.id || 'Owner', reference]
      );
    }
    await client.query('COMMIT');
    return res.json({ success: true, source: 'postgresql', reference });
  } catch (error) {
    await client.query('ROLLBACK');
    return res.status(400).json({ success: false, error: error instanceof Error ? error.message : 'Stock opname gagal disimpan.' });
  } finally { client.release(); }
});

// ====================================================================
// 5. API MITRA RESELLER / SELLER (Tabel: mitra_seller)
// ====================================================================
app.get('/api/mitra-seller', verifyAuth, requireRole('owner', 'kasir', 'seller'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  }
  try {
    let result;
    // 🛡️ ISOLASI DATA SELLER: Seller hanya boleh membaca record miliknya sendiri
    if (req.user?.role === 'seller') {
      result = await pool.query('SELECT * FROM mitra_seller WHERE id = $1', [req.user.id]);
    } else {
      result = await pool.query('SELECT * FROM mitra_seller ORDER BY tanggal_daftar DESC');
    }

    const mapped = result.rows.map((r) => ({
      id: r.id,
      username: r.username,
      name: r.nama_pemilik,
      storeName: r.nama_toko,
      phone: r.no_telepon,
      email: r.email,
      address: r.alamat,
      status: r.status,
      creditLimit: Number(r.limit_piutang),
      totalReceivables: Number(r.total_piutang_berjalan),
      lastTransactionDate: r.tanggal_transaksi_terakhir,
      registeredDate: r.tanggal_daftar,
      notes: r.catatan,
      // 🛡️ Kredensial password dihapus sepenuhnya dari response API
    }));
    res.json({ source: 'postgresql', data: mapped });
  } catch (err: any) {
    console.error('Permintaan database gagal:', err instanceof Error ? err.message : 'unknown error');
    res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server. Silakan coba kembali.' });
  }
});

app.post('/api/mitra-seller', registerLimiter, async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia. Operasi tidak disimpan.' });
  }
  const s = req.body;
  try {
    // Periksa apakah pendaftaran dilakukan oleh Owner terautentikasi atau calon seller publik
    let authHeader = req.headers.authorization;
    let isCallerOwner = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET, {
          algorithms: ['HS256'],
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        }) as any;
        if (decoded.role === 'owner') {
          isCallerOwner = true;
        }
      } catch {}
    }

    // 🛡️ Keamanan Pendaftaran: Jika bukan Owner, status DIPAKSA 'Pending' dan limit tidak bisa dimanipulasi
    const safeStatus = isCallerOwner ? (s.status || 'Pending') : 'Pending';
    const safeLimit = isCallerOwner ? (Number(s.creditLimit) || 5000000) : 5000000;

    // 🛡️ Keamanan Password (Zero Trust):
    // Selalu perlakukan password dari request publik sebagai password mentah dan hash di backend (salt rounds: 10).
    // Jangan pernah mempercayai string hash yang dikirimkan langsung oleh frontend.
    let finalSellerHash: string | null = null;
    if (typeof s.password === 'string' && s.password.length > 0) {
      // Jangan trim password: spasi awal/akhir adalah bagian dari kredensial.
      finalSellerHash = await bcrypt.hash(s.password, 10);
    }

    await pool.query(
      `INSERT INTO mitra_seller (id, username, nama_pemilik, nama_toko, no_telepon, email, alamat, status, limit_piutang, total_piutang_berjalan, catatan, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (id) DO UPDATE SET
         username = COALESCE(EXCLUDED.username, mitra_seller.username),
         nama_pemilik = EXCLUDED.nama_pemilik,
         nama_toko = EXCLUDED.nama_toko,
         no_telepon = EXCLUDED.no_telepon,
         email = EXCLUDED.email,
         alamat = EXCLUDED.alamat,
         status = $8,
         limit_piutang = $9,
         total_piutang_berjalan = EXCLUDED.total_piutang_berjalan,
         catatan = EXCLUDED.catatan,
         password = COALESCE($12, mitra_seller.password)`,
      [
        s.id,
        s.username || null,
        s.name,
        s.storeName,
        s.phone,
        s.email || null,
        s.address,
        safeStatus,
        safeLimit,
        s.totalReceivables || 0,
        s.notes || '',
        finalSellerHash,
      ]
    );
    res.json({ success: true, message: 'Mitra seller berhasil disimpan ke PostgreSQL' });
  } catch (err: any) {
    console.error('Permintaan database gagal:', err instanceof Error ? err.message : 'unknown error');
    const duplicate = err?.code === '23505';
    res.status(duplicate ? 409 : 500).json({
      success: false,
      error: duplicate ? 'Username seller sudah digunakan.' : 'Terjadi kesalahan pada server. Silakan coba kembali.',
    });
  }
});

// Hanya Owner yang boleh mengubah status, limit piutang, dan profil seller.
app.put('/api/mitra-seller/:id', verifyAuth, requireRole('owner'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  }

  const sellerId = String(req.params.id || '').trim();
  const body = req.body ?? {};
  const allowedStatuses = ['Pending', 'Aktif', 'Ditangguhkan', 'Nonaktif'];
  const status = allowedStatuses.find((value) => value.toLowerCase() === String(body.status || '').trim().toLowerCase());
  const creditLimit = Number(body.creditLimit);

  if (!sellerId) return res.status(400).json({ success: false, error: 'ID seller tidak valid.' });
  if (body.status !== undefined && !status) {
    return res.status(400).json({ success: false, error: 'Status seller tidak valid.' });
  }
  if (body.creditLimit !== undefined && (!Number.isFinite(creditLimit) || creditLimit < 0)) {
    return res.status(400).json({ success: false, error: 'Limit piutang harus berupa angka nol atau lebih.' });
  }

  try {
    const result = await pool.query(
      `UPDATE mitra_seller SET
         status = COALESCE($1, status),
         limit_piutang = COALESCE($2, limit_piutang),
         nama_pemilik = COALESCE($3, nama_pemilik),
         nama_toko = COALESCE($4, nama_toko),
         no_telepon = COALESCE($5, no_telepon),
         email = COALESCE($6, email),
         alamat = COALESCE($7, alamat),
         catatan = COALESCE($8, catatan)
       WHERE id = $9
       RETURNING id, username, nama_pemilik, nama_toko, no_telepon, email, alamat, status, limit_piutang, total_piutang_berjalan, tanggal_transaksi_terakhir, tanggal_daftar, catatan`,
      [
        status ?? null,
        body.creditLimit !== undefined ? creditLimit : null,
        typeof body.name === 'string' ? body.name.trim() : null,
        typeof body.storeName === 'string' ? body.storeName.trim() : null,
        typeof body.phone === 'string' ? body.phone.trim() : null,
        typeof body.email === 'string' ? body.email.trim() : null,
        typeof body.address === 'string' ? body.address.trim() : null,
        typeof body.notes === 'string' ? body.notes : null,
        sellerId,
      ]
    );
    if (result.rowCount !== 1) return res.status(404).json({ success: false, error: 'Data seller tidak ditemukan.' });
    return res.json({ success: true, source: 'postgresql', data: result.rows[0], message: 'Data seller berhasil diperbarui.' });
  } catch (error: any) {
    const duplicate = error?.code === '23505';
    console.error('Gagal memperbarui seller:', error instanceof Error ? error.message : 'unknown error');
    return res.status(duplicate ? 409 : 500).json({ success: false, error: duplicate ? 'Data unik seller sudah digunakan.' : 'Gagal memperbarui data seller.' });
  }
});

// ====================================================================
// 6. API TRANSAKSI & FAKTUR KASIR (Tabel: faktur_penjualan & item_faktur)
// ====================================================================
app.get(['/api/faktur', '/api/transaksi'], verifyAuth, requireRole('owner', 'kasir', 'seller'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  }
  try {
    let invResult;
    // 🛡️ ISOLASI DATA TRANSAKSI SELLER (Least Privilege):
    // Jika role seller -> hanya tampilkan faktur dengan id_seller = ID seller yang terverifikasi di token
    if (req.user?.role === 'seller') {
      invResult = await pool.query(
        'SELECT * FROM faktur_penjualan WHERE id_seller = $1 ORDER BY tanggal DESC',
        [req.user.id]
      );
    } else {
      // Owner & Kasir berhak melihat seluruh faktur toko
      invResult = await pool.query('SELECT * FROM faktur_penjualan ORDER BY tanggal DESC');
    }

    const itemResult = await pool.query('SELECT * FROM item_faktur');
    const installmentResult = req.user?.role === 'seller'
      ? await pool.query(`SELECT c.* FROM cicilan_piutang c JOIN faktur_penjualan f ON f.id = c.id_faktur WHERE f.id_seller = $1 ORDER BY c.tanggal DESC`, [req.user.id])
      : await pool.query('SELECT * FROM cicilan_piutang ORDER BY tanggal DESC');

    const mapped = invResult.rows.map((inv) => {
      const items = itemResult.rows
        .filter((it) => it.id_faktur === inv.id)
        .map((it) => ({
          productId: it.id_produk,
          productSku: it.sku_produk,
          productName: it.nama_produk,
          quantity: Number(it.jumlah),
          unitPrice: Number(it.harga_satuan),
          costPrice: it.harga_pokok_satuan === null || it.harga_pokok_satuan === undefined ? null : Number(it.harga_pokok_satuan),
          subtotal: Number(it.subtotal),
        }));

      return {
        id: inv.id,
        invoiceNumber: inv.nomor_faktur,
        date: inv.tanggal,
        cashierName: inv.nama_kasir,
        paymentMethod: inv.metode_pembayaran,
        subtotal: Number(inv.subtotal),
        discount: Number(inv.diskon),
        total: Number(inv.total_akhir),
        cashReceived: inv.uang_diterima ? Number(inv.uang_diterima) : undefined,
        change: inv.uang_kembalian !== null && inv.uang_kembalian !== undefined ? Number(inv.uang_kembalian) : undefined,
        bankName: inv.nama_bank || undefined,
        transferReference: inv.nomor_referensi_transfer || undefined,
        paymentProofImage: inv.foto_bukti_transfer || undefined,
        sellerId: inv.id_seller || undefined,
        sellerName: inv.nama_seller || undefined,
        dueDate: inv.tanggal_jatuh_tempo || undefined,
        amountPaid: Number(inv.jumlah_terbayar || 0),
        remainingBalance: Number(
          inv.sisa_tagihan !== undefined && inv.sisa_tagihan !== null
            ? inv.sisa_tagihan
            : Math.max(0, Number(inv.total_akhir || 0) - Number(inv.jumlah_terbayar || 0))
        ),
        status:
          inv.status_pembayaran === 'LUNAS'
            ? 'PAID'
            : inv.status_pembayaran === 'BELUM_LUNAS'
            ? 'UNPAID'
            : inv.status_pembayaran === 'SEBAGIAN'
            ? 'PARTIALLY_PAID'
            : (inv.status_pembayaran || 'PAID'),
        items,
        installments: installmentResult.rows.filter((c) => c.id_faktur === inv.id).map((c) => ({
          id: c.id, date: c.tanggal, amount: Number(c.nominal_cicilan), method: c.metode_pembayaran,
          recordedBy: c.dicatat_oleh, notes: c.catatan || undefined, paymentProofImage: c.foto_bukti_transfer || undefined,
        })),
      };
    });

    res.json({ source: 'postgresql', data: mapped });
  } catch (err: any) {
    console.error('Permintaan database gagal:', err instanceof Error ? err.message : 'unknown error');
    res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server. Silakan coba kembali.' });
  }
});

app.post(['/api/faktur', '/api/transaksi'], verifyAuth, requireRole('owner', 'kasir'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia. Operasi tidak disimpan.' });
  }
  const inv = req.body ?? {};
  if (!inv.id || !inv.invoiceNumber || !Array.isArray(inv.items) || inv.items.length === 0) {
    return res.status(400).json({ success: false, error: 'Data faktur dan minimal satu item transaksi wajib diisi.' });
  }
  if (!['Tunai', 'Transfer Bank', 'Kredit'].includes(String(inv.paymentMethod))) {
    return res.status(400).json({ success: false, error: 'Metode pembayaran tidak valid.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Harga, nama, SKU, dan stok selalu diverifikasi dari PostgreSQL.
    // Jangan percaya harga/subtotal yang dikirim browser.
    const lines: Array<{ productId: string; sku: string; name: string; quantity: number; unitPrice: number; costPrice: number; subtotal: number; oldStock: number }> = [];
    let subtotal = 0;
    for (const item of inv.items) {
      const productId = String(item.productId || '');
      const quantity = Number(item.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity <= 0) throw new Error('Item transaksi tidak valid.');
      const productResult = await client.query(
        'SELECT id, sku, nama_produk, harga_jual, harga_pokok_modal, stok FROM produk WHERE id = $1 FOR UPDATE',
        [productId]
      );
      if (productResult.rows.length !== 1) throw new Error(`Produk ${productId} tidak ditemukan.`);
      const product = productResult.rows[0];
      const oldStock = Number(product.stok);
      if (oldStock < quantity) throw new Error(`Stok ${product.nama_produk} tidak mencukupi. Tersedia ${oldStock}, diminta ${quantity}.`);
      const unitPrice = Number(product.harga_jual);
      if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new Error(`Harga produk ${product.nama_produk} tidak valid.`);
      const costPrice = Number(product.harga_pokok_modal);
      if (!Number.isFinite(costPrice) || costPrice < 0) throw new Error(`HPP produk ${product.nama_produk} tidak valid.`);
      const lineSubtotal = unitPrice * quantity;
      subtotal += lineSubtotal;
      lines.push({ productId, sku: product.sku, name: product.nama_produk, quantity, unitPrice, costPrice, subtotal: lineSubtotal, oldStock });
    }

    const discount = Number(inv.discount || 0);
    if (!Number.isFinite(discount) || discount < 0 || discount > subtotal) throw new Error('Diskon tidak valid.');
    const total = subtotal - discount;
    const paymentMethod = String(inv.paymentMethod);
    const cashReceived = paymentMethod === 'Tunai' ? Number(inv.cashReceived || 0) : null;
    if (paymentMethod === 'Tunai' && (!Number.isFinite(cashReceived) || Number(cashReceived) < total)) {
      throw new Error('Uang tunai yang diterima kurang dari total transaksi.');
    }

    let sellerName: string | null = null;
    if (paymentMethod === 'Kredit') {
      if (!inv.sellerId) throw new Error('Mitra Seller wajib dipilih untuk transaksi kredit.');
      if (!inv.dueDate || String(inv.dueDate).slice(0, 10) <= new Date().toISOString().slice(0, 10)) {
        throw new Error('Tanggal jatuh tempo harus setelah hari ini.');
      }
      const sellerResult = await client.query(
        'SELECT nama_pemilik, nama_toko, status, limit_piutang, total_piutang_berjalan FROM mitra_seller WHERE id = $1 FOR UPDATE',
        [inv.sellerId]
      );
      if (sellerResult.rows.length !== 1 || !['aktif', 'active'].includes(String(sellerResult.rows[0].status || '').toLowerCase())) {
        throw new Error('Mitra Seller tidak ditemukan atau belum aktif.');
      }
      const seller = sellerResult.rows[0];
      sellerName = `${seller.nama_pemilik} (${seller.nama_toko})`;
      const outstanding = Number(seller.total_piutang_berjalan || 0);
      const creditLimit = Number(seller.limit_piutang || 0);
      if (outstanding + total > creditLimit) throw new Error('Transaksi melebihi sisa plafon kredit Seller.');
    }

    const amountPaid = paymentMethod === 'Kredit' ? 0 : total;
    const remainingBalance = paymentMethod === 'Kredit' ? total : 0;
    const dbStatus = paymentMethod === 'Kredit' ? 'BELUM_LUNAS' : 'LUNAS';
    const cashierName = req.user?.username || req.user?.id || 'Kasir';

    await client.query(
      `INSERT INTO faktur_penjualan (
         id, nomor_faktur, tanggal, nama_kasir, metode_pembayaran, subtotal, diskon, total_akhir,
         uang_diterima, uang_kembalian, nama_bank, nomor_referensi_transfer, foto_bukti_transfer,
         id_seller, nama_seller, tanggal_jatuh_tempo, jumlah_terbayar, sisa_tagihan, status_pembayaran
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        inv.id, inv.invoiceNumber, inv.date || new Date(), cashierName, paymentMethod, subtotal, discount, total,
        cashReceived, paymentMethod === 'Tunai' ? Number(cashReceived) - total : null,
        paymentMethod === 'Transfer Bank' ? (inv.bankName || null) : null,
        paymentMethod === 'Transfer Bank' ? (inv.transferReference || null) : null,
        paymentMethod === 'Transfer Bank' ? (inv.paymentProofImage || null) : null,
        paymentMethod === 'Kredit' ? inv.sellerId : null,
        sellerName,
        paymentMethod === 'Kredit' ? inv.dueDate : null,
        amountPaid, remainingBalance, dbStatus,
      ]
    );

    for (const line of lines) {
      await client.query(
        `INSERT INTO item_faktur (id_faktur, id_produk, sku_produk, nama_produk, jumlah, harga_satuan, harga_pokok_satuan, subtotal)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [inv.id, line.productId, line.sku, line.name, line.quantity, line.unitPrice, line.costPrice, line.subtotal]
      );

      // Kredit Seller juga berarti barang fisik dipegang Seller untuk dijual di kios.
      // Catat ke inventaris tempo dalam transaksi database yang sama dengan faktur.
      // Stok gudang TIDAK dikurangi lagi di sini; pengurangan dilakukan sekali di bawah.
      if (paymentMethod === 'Kredit' && inv.sellerId) {
        await client.query(
          `INSERT INTO barang_konsinyasi (
             id, id_seller, id_produk, sku_produk, nama_produk, jumlah_dititipkan,
             harga_satuan, harga_jual_rekomendasi, tanggal_penitipan, status, catatan
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'DITITIPKAN', $10)`,
          [
            `tempo-${randomUUID()}`,
            inv.sellerId,
            line.productId,
            line.sku,
            line.name,
            line.quantity,
            line.unitPrice,
            line.unitPrice,
            inv.date || new Date(),
            `Barang tempo dari faktur ${inv.invoiceNumber}`,
          ]
        );
      }

      const newStock = line.oldStock - line.quantity;
      await client.query(
        'UPDATE produk SET stok = $1, terakhir_diperbarui = CURRENT_TIMESTAMP WHERE id = $2',
        [newStock, line.productId]
      );
      await client.query(
        `INSERT INTO mutasi_stok (id, tanggal, id_produk, sku_produk, nama_produk, jenis_mutasi, jumlah_perubahan, stok_sebelum, stok_sesudah, catatan, penanggung_jawab)
         VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, 'PENJUALAN', $5, $6, $7, $8, $9)`,
        [
          'mut-' + Date.now() + '-' + Math.floor(Math.random() * 1000), line.productId, line.sku, line.name,
          -line.quantity, line.oldStock, newStock, `Penjualan kasir faktur ${inv.invoiceNumber}`, cashierName,
        ]
      );
    }

    if (paymentMethod === 'Kredit' && inv.sellerId) {
      await client.query(
        'UPDATE mitra_seller SET total_piutang_berjalan = COALESCE(total_piutang_berjalan, 0) + $1, tanggal_transaksi_terakhir = CURRENT_TIMESTAMP WHERE id = $2',
        [total, inv.sellerId]
      );
    }

    await client.query('COMMIT');
    console.log(`Faktur ${inv.invoiceNumber} tersimpan.`);
    return res.json({ success: true, source: 'postgresql', message: 'Faktur transaksi berhasil dicatat ke PostgreSQL.', totals: { subtotal, discount, total } });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('Gagal menyimpan faktur:', err instanceof Error ? err.message : 'unknown error');
    const duplicate = err?.code === '23505';
    return res.status(duplicate ? 409 : 400).json({ success: false, error: duplicate ? 'Faktur dengan ID atau nomor tersebut sudah pernah dicatat.' : (err instanceof Error ? err.message : 'Transaksi gagal disimpan.') });
  } finally {
    client.release();
  }
});

// ====================================================================
// 6A. API BARANG KONSINYASI (Tabel: barang_konsinyasi)
// ====================================================================
app.get('/api/barang-konsinyasi', verifyAuth, requireRole('owner', 'kasir', 'seller'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  try {
    const result = req.user?.role === 'seller'
      ? await pool.query('SELECT * FROM barang_konsinyasi WHERE id_seller = $1 ORDER BY tanggal_penitipan DESC', [req.user.id])
      : await pool.query('SELECT * FROM barang_konsinyasi ORDER BY tanggal_penitipan DESC');
    const data = result.rows.map((r) => ({
      id: r.id, sellerId: r.id_seller, productId: r.id_produk, productSku: r.sku_produk,
      productName: r.nama_produk, quantityHeld: Number(r.jumlah_dititipkan), unitPrice: Number(r.harga_satuan),
      recommendedSellPrice: Number(r.harga_jual_rekomendasi), assignedDate: r.tanggal_penitipan,
    }));
    return res.json({ source: 'postgresql', data });
  } catch (error) {
    console.error('Gagal mengambil barang konsinyasi:', error instanceof Error ? error.message : 'unknown error');
    return res.status(500).json({ success: false, error: 'Gagal mengambil data barang konsinyasi.' });
  }
});

app.post('/api/barang-konsinyasi', verifyAuth, requireRole('owner', 'kasir'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  const item = req.body || {};
  const quantity = Number(item.quantityHeld);
  if (!item.id || !item.sellerId || !item.productId || !Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ success: false, error: 'Data konsinyasi tidak valid.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const productResult = await client.query('SELECT id, sku, nama_produk, stok FROM produk WHERE id = $1 FOR UPDATE', [item.productId]);
    if (productResult.rowCount !== 1) throw new Error('Produk untuk konsinyasi tidak ditemukan.');
    const product = productResult.rows[0];
    const oldStock = Number(product.stok);
    if (oldStock < quantity) throw new Error('Stok produk tidak mencukupi untuk konsinyasi.');
    await client.query(
      `INSERT INTO barang_konsinyasi (id, id_seller, id_produk, sku_produk, nama_produk, jumlah_dititipkan, harga_satuan, harga_jual_rekomendasi, tanggal_penitipan)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [item.id, item.sellerId, item.productId, product.sku, product.nama_produk, quantity, Number(item.unitPrice || 0), Number(item.recommendedSellPrice || 0), item.assignedDate || new Date()]
    );
    await client.query('UPDATE produk SET stok = $1, terakhir_diperbarui = CURRENT_TIMESTAMP WHERE id = $2', [oldStock - quantity, item.productId]);
    await client.query(
      `INSERT INTO mutasi_stok (id, tanggal, id_produk, sku_produk, nama_produk, jenis_mutasi, jumlah_perubahan, stok_sebelum, stok_sesudah, catatan, penanggung_jawab, referensi)
       VALUES ($1, CURRENT_TIMESTAMP, $2, $3, $4, 'KONSINYASI_KELUAR', $5, $6, $7, $8, $9, $10)`,
      [`mut-cons-${Date.now()}-${Math.floor(Math.random()*10000)}`, item.productId, product.sku, product.nama_produk, -quantity, oldStock, oldStock - quantity, `Penitipan barang untuk seller ${item.sellerId}`, req.user?.username || req.user?.id || 'Pengguna', item.id]
    );
    await client.query('COMMIT');
    return res.status(201).json({ success: true, source: 'postgresql' });
  } catch (error: any) {
    await client.query('ROLLBACK');
    const duplicate = error?.code === '23505';
    return res.status(duplicate ? 409 : 400).json({ success: false, error: duplicate ? 'ID konsinyasi sudah digunakan.' : (error instanceof Error ? error.message : 'Gagal menyimpan barang konsinyasi.') });
  } finally { client.release(); }
});

// ====================================================================
// 7. API CICILAN PIUTANG (Tabel: cicilan_piutang)
// ====================================================================
app.get('/api/cicilan', verifyAuth, requireRole('owner', 'kasir', 'seller'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  }
  try {
    let result;
    // Jika seller, hanya tampilkan cicilan atas faktur miliknya
    if (req.user?.role === 'seller') {
      result = await pool.query(
        `SELECT c.* FROM cicilan_piutang c
         JOIN faktur_penjualan f ON c.id_faktur = f.id
         WHERE f.id_seller = $1
         ORDER BY c.tanggal DESC`,
        [req.user.id]
      );
    } else {
      result = await pool.query('SELECT * FROM cicilan_piutang ORDER BY tanggal DESC');
    }
    res.json({ source: 'postgresql', data: result.rows });
  } catch (err: any) {
    console.error('Permintaan database gagal:', err instanceof Error ? err.message : 'unknown error');
    res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server. Silakan coba kembali.' });
  }
});

app.post('/api/cicilan', verifyAuth, requireRole('owner', 'kasir'), async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  const inst = req.body ?? {};
  const amount = Number(inst.amount);
  if (!inst.id || !inst.invoiceId || !Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ success: false, error: 'Data cicilan tidak valid.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const invoiceResult = await client.query(
      'SELECT id, id_seller, total_akhir, jumlah_terbayar, sisa_tagihan FROM faktur_penjualan WHERE id = $1 FOR UPDATE',
      [inst.invoiceId]
    );
    if (invoiceResult.rows.length !== 1) throw new Error('Faktur tidak ditemukan.');
    const invoice = invoiceResult.rows[0];
    const oldRemaining = Number(invoice.sisa_tagihan ?? Math.max(0, Number(invoice.total_akhir) - Number(invoice.jumlah_terbayar || 0)));
    if (amount > oldRemaining) throw new Error('Nominal cicilan melebihi sisa tagihan.');
    const newPaid = Number(invoice.jumlah_terbayar || 0) + amount;
    const newRemaining = Math.max(0, oldRemaining - amount);
    const newStatus = newRemaining === 0 ? 'LUNAS' : 'SEBAGIAN';

    await client.query(
      `INSERT INTO cicilan_piutang (id, id_faktur, tanggal, nominal_cicilan, metode_pembayaran, dicatat_oleh, catatan, foto_bukti_transfer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [inst.id, inst.invoiceId, inst.date || new Date(), amount, inst.method, inst.recordedBy, inst.notes || '', inst.paymentProofImage || null]
    );
    await client.query(
      'UPDATE faktur_penjualan SET jumlah_terbayar = $1, sisa_tagihan = $2, status_pembayaran = $3 WHERE id = $4',
      [newPaid, newRemaining, newStatus, inst.invoiceId]
    );
    if (invoice.id_seller) {
      await client.query(
        'UPDATE mitra_seller SET total_piutang_berjalan = GREATEST(0, COALESCE(total_piutang_berjalan, 0) - $1) WHERE id = $2',
        [amount, invoice.id_seller]
      );
    }
    await client.query('COMMIT');
    return res.json({ success: true, amountPaid: newPaid, remainingBalance: newRemaining, status: newStatus });
  } catch (error: any) {
    await client.query('ROLLBACK');
    const duplicate = error?.code === '23505';
    return res.status(duplicate ? 409 : 400).json({ success: false, error: duplicate ? 'ID cicilan sudah pernah digunakan.' : (error instanceof Error ? error.message : 'Cicilan gagal disimpan.') });
  } finally {
    client.release();
  }
});

// ====================================================================
// 8. API KARTU MUTASI STOK AUDIT (Tabel: mutasi_stok)
// ====================================================================
app.get('/api/mutasi-stok', verifyAuth, requireRole('owner', 'kasir'), async (_req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak tersedia.' });
  }
  try {
    const result = await pool.query('SELECT * FROM mutasi_stok ORDER BY tanggal DESC');
    const mapped = result.rows.map((r) => ({
      id: r.id,
      date: r.tanggal,
      productId: r.id_produk,
      productSku: r.sku_produk,
      productName: r.nama_produk,
      type: r.jenis_mutasi,
      change: Number(r.jumlah_perubahan),
      previousStock: Number(r.stok_sebelum),
      finalStock: Number(r.stok_sesudah),
      notes: r.catatan,
      performedBy: r.penanggung_jawab,
      reference: r.referensi || undefined,
    }));
    res.json({ source: 'postgresql', data: mapped });
  } catch (err: any) {
    console.error('Permintaan database gagal:', err instanceof Error ? err.message : 'unknown error');
    res.status(500).json({ success: false, error: 'Terjadi kesalahan pada server. Silakan coba kembali.' });
  }
});

// ====================================================================
// 9. HELPER KEAMANAN & DUAL-MODE PASSWORD MIGRATION
// ====================================================================

/**
 * Memeriksa apakah sebuah string adalah hash bcrypt yang valid ($2a$, $2b$, atau $2y$)
 */
export const isBcryptHash = (str?: string | null): boolean => {
  if (!str || typeof str !== 'string') return false;
  return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(str);
};

/**
 * Verifikasi password pengguna dengan dukungan migrasi transparan dual-mode:
 * 1. Jika password tersimpan sudah berformat bcrypt ($2a$/$2b$) -> verifikasi via bcrypt.compare()
 * 2. Jika password masih berupa plaintext lama -> bandingkan string, dan jika cocok,
 *    SEGERA upgrade ke hash bcrypt (salt rounds = 10) dengan kondisi optimistic concurrency.
 */
interface VerifyPasswordResult {
  isValid: boolean;
  wasMigrated: boolean;
}

const verifyAndMigratePassword = async (
  inputPass: string,
  storedPass: string | null | undefined,
  onMigrateToHash?: (newHash: string) => Promise<void>
): Promise<VerifyPasswordResult> => {
  if (!inputPass || !storedPass) {
    return { isValid: false, wasMigrated: false };
  }

  // 1. Validasi via bcrypt jika sudah berupa hash
  if (isBcryptHash(storedPass)) {
    try {
      const isMatch = await bcrypt.compare(inputPass, storedPass);
      return { isValid: isMatch, wasMigrated: false };
    } catch {
      return { isValid: false, wasMigrated: false };
    }
  }

  // 2. Transisi Sementara: Validasi plaintext lama & auto-upgrade transparan ke bcrypt
  if (inputPass === storedPass) {
    let wasMigrated = false;
    if (onMigrateToHash) {
      try {
        const newHash = await bcrypt.hash(inputPass, 10);
        await onMigrateToHash(newHash);
        wasMigrated = true;
      } catch (err: any) {
        console.error('⚠️ [Migrasi Password] Gagal memperbarui hash bcrypt:', err.message);
      }
    }
    return { isValid: true, wasMigrated };
  }

  return { isValid: false, wasMigrated: false };
};


// --------------------------------------------------------------------
// ENDPOINT PEMANTAUAN PROGRES MIGRASI (Khusus Administrator/Owner)
// --------------------------------------------------------------------
app.get('/api/auth/migration-status', verifyAuth, requireRole('owner'), async (_req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({
      status: 'offline_mode',
      database: 'disconnected',
      message: 'Database PostgreSQL belum terhubung. Mode memori aktif.',
    });
  }

  try {
    const penggunaStat = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE password ~ '^\\$2[aby]\\$')::int AS bcrypt_hashed,
        COUNT(*) FILTER (WHERE password !~ '^\\$2[aby]\\$' OR password IS NULL)::int AS plaintext_legacy
      FROM pengguna
    `);

    const sellerStat = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE password ~ '^\\$2[aby]\\$')::int AS bcrypt_hashed,
        COUNT(*) FILTER (WHERE password !~ '^\\$2[aby]\\$' OR password IS NULL)::int AS plaintext_legacy
      FROM mitra_seller
    `);

    const pRow = penggunaStat.rows[0] || { total: 0, bcrypt_hashed: 0, plaintext_legacy: 0 };
    const sRow = sellerStat.rows[0] || { total: 0, bcrypt_hashed: 0, plaintext_legacy: 0 };

    const totalPlaintext = Number(pRow.plaintext_legacy) + Number(sRow.plaintext_legacy);

    res.json({
      status: 'ok',
      allAccountsMigratedToBcrypt: totalPlaintext === 0,
      penggunaTable: {
        totalAccounts: Number(pRow.total),
        bcryptHashedAccounts: Number(pRow.bcrypt_hashed),
        plaintextLegacyAccounts: Number(pRow.plaintext_legacy),
      },
      mitraSellerTable: {
        totalAccounts: Number(sRow.total),
        bcryptHashedAccounts: Number(sRow.bcrypt_hashed),
        plaintextLegacyAccounts: Number(sRow.plaintext_legacy),
      },
      note: 'Tidak ada data password maupun hash yang ditampilkan pada status migrasi ini.',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal memeriksa status migrasi akun.' });
  }
});

// --------------------------------------------------------------------
// ENDPOINT LOGIN AUTENTIKASI DENGAN RATE LIMITER & JWT ISSUER
// --------------------------------------------------------------------
app.post('/api/auth/login', loginLimiter, async (req: Request, res: Response) => {
  const { role, identifier, password } = req.body ?? {};
  if (!['owner', 'kasir', 'seller'].includes(String(role)) || !identifier || typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ success: false, error: 'Peran, username/nomor telepon, dan kata sandi wajib diisi.' });
  }
  if (!pool || !isDbConnected) {
    return res.status(503).json({ success: false, error: 'Database belum siap. Login sementara tidak tersedia.' });
  }

  const cleanId = String(identifier).trim().toLowerCase();
  const phoneDigits = cleanId.replace(/\D/g, '');
  // Password tidak di-trim agar karakter spasi tetap menjadi bagian dari password.
  const suppliedPassword = password;

  try {
    if (role === 'seller') {
      const result = await pool.query(
        `SELECT id, username, nama_pemilik, nama_toko, email, no_telepon, status, password
         FROM mitra_seller
         WHERE LOWER(COALESCE(username, '')) = $1
            OR LOWER(COALESCE(email, '')) = $1
            OR LOWER(COALESCE(id, '')) = $1
            OR regexp_replace(COALESCE(no_telepon, ''), '\\D', '', 'g') = $2
         LIMIT 1`,
        [cleanId, phoneDigits]
      );
      if (result.rows.length === 0) return res.status(401).json({ success: false, error: 'Akun Seller tidak ditemukan.' });
      const seller = result.rows[0];
      const status = String(seller.status || '').toLowerCase();
      if (!['aktif', 'active'].includes(status)) {
        return res.status(403).json({ success: false, error: status === 'pending' ? 'Akun Seller masih menunggu persetujuan Owner.' : 'Akun Seller tidak aktif atau ditangguhkan.' });
      }
      const verified = await verifyAndMigratePassword(suppliedPassword, seller.password, async (hash) => {
        const updated = await pool!.query('UPDATE mitra_seller SET password = $1 WHERE id = $2 AND password = $3', [hash, seller.id, seller.password]);
        if (updated.rowCount !== 1) throw new Error('Password Seller berubah saat proses login.');
      });
      if (!verified.isValid) return res.status(401).json({ success: false, error: 'Username atau kata sandi tidak sesuai.' });
      const user = { id: seller.id, username: seller.username || seller.id, name: seller.nama_pemilik, email: seller.email, role: 'seller' as const, storeName: seller.nama_toko, phone: seller.no_telepon };
      const token = generateToken({ id: user.id, username: user.username, role: user.role, name: user.name, email: user.email, storeName: user.storeName });
      return res.json({ success: true, token, user });
    }

    const expectedRole = role === 'owner' ? 'owner' : 'kasir';
    const result = await pool.query(
      `SELECT id, username, nama_lengkap, email, peran, password, aktif, shift, no_telepon
       FROM pengguna
       WHERE (LOWER(COALESCE(username, '')) = $1 OR LOWER(COALESCE(email, '')) = $1)
         AND LOWER(peran) = $2
       LIMIT 1`,
      [cleanId, expectedRole]
    );
    if (result.rows.length === 0) return res.status(401).json({ success: false, error: 'Username atau kata sandi tidak sesuai.' });
    const account = result.rows[0];
    if (account.aktif !== true) return res.status(403).json({ success: false, error: 'Akun tidak aktif. Hubungi administrator.' });
    const verified = await verifyAndMigratePassword(suppliedPassword, account.password, async (hash) => {
      const updated = await pool!.query('UPDATE pengguna SET password = $1 WHERE id = $2 AND password = $3', [hash, account.id, account.password]);
      if (updated.rowCount !== 1) throw new Error('Password pengguna berubah saat proses login.');
    });
    if (!verified.isValid) return res.status(401).json({ success: false, error: 'Username atau kata sandi tidak sesuai.' });

    const user = {
      id: account.id,
      username: account.username,
      name: account.nama_lengkap,
      email: account.email,
      role: expectedRole,
      ...(expectedRole === 'kasir' ? { shift: account.shift, phone: account.no_telepon } : {}),
    };
    const token = generateToken({ id: user.id, username: user.username, role: expectedRole, name: user.name, email: user.email });
    return res.json({ success: true, token, user });
  } catch (error) {
    console.error('Login gagal diproses oleh database:', error instanceof Error ? error.message : 'unknown error');
    return res.status(503).json({ success: false, error: 'Layanan login sementara tidak tersedia. Silakan coba kembali.' });
  }
});

// ====================================================================
// 10. VITE DEV SERVER MIDDLEWARE / PRODUCTION STATIC FILES
// ====================================================================
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [TUMIN] Server aktif dan berjalan di http://localhost:${PORT}`);
});
