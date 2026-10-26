import express from 'express';
import type { Request, Response } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '15mb' }));

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

if (dbPassword !== undefined && dbPassword !== '') {
  // Opsi 1: Parameter eksplisit (kebal terhadap karakter khusus seperti @, #, $, dll pada password)
  pool = new Pool({
    user: dbUser,
    password: dbPassword,
    host: dbHost,
    port: dbPort,
    database: dbName,
    connectionTimeoutMillis: 5000,
  });
} else if (dbUrl && dbUrl.trim() !== '') {
  // Opsi 2: Connection String
  pool = new Pool({
    connectionString: dbUrl,
    connectionTimeoutMillis: 5000,
  });
}

const initDatabaseTables = async (dbPool: Pool) => {
  try {
    // 1. Tabel akun pengguna (Kasir & Staff)
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS pengguna (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        nama_lengkap VARCHAR(150) NOT NULL,
        email VARCHAR(150) UNIQUE,
        peran VARCHAR(20) NOT NULL,
        password VARCHAR(255) NOT NULL,
        shift VARCHAR(50),
        no_telepon VARCHAR(50),
        aktif BOOLEAN DEFAULT TRUE,
        dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Tambah akun kasir awal jika belum ada
    await dbPool.query(`
      INSERT INTO pengguna (id, username, nama_lengkap, email, peran, password, shift, no_telepon, aktif)
      VALUES 
        ('usr-kasir-1', 'kasir', 'Siti Rahma (Kasir 1)', 'kasir@tinounderwear.id', 'kasir', 'kasir123', 'Shift Pagi (08:00 - 16:00)', '0813-2233-4455', TRUE),
        ('usr-kasir-2', 'kasir2', 'Dewi Lestari (Kasir 2)', 'kasir2@tinounderwear.id', 'kasir', 'kasir123', 'Shift Sore (16:00 - 22:00)', '0813-8899-1122', TRUE)
      ON CONFLICT (username) DO NOTHING;
    `);

    // 2. Tambah kolom username & password pada mitra_seller jika belum ada
    await dbPool.query(`
      ALTER TABLE mitra_seller ADD COLUMN IF NOT EXISTS username VARCHAR(100);
      ALTER TABLE mitra_seller ADD COLUMN IF NOT EXISTS password VARCHAR(255) DEFAULT 'seller123';
    `);

    console.log('🛡️ [Keamanan Database] Tabel pengguna & otentikasi kasir aktif di PostgreSQL.');
  } catch (err: any) {
    console.warn('⚠️ [Database Init] Penyesuaian skema tabel:', err.message);
  }
};

if (pool) {
  pool
    .connect()
    .then(async (client) => {
      isDbConnected = true;
      client.release();
      console.log('✅ [PostgreSQL] Sukses terhubung ke database tumin_db!');
      if (pool) {
        await initDatabaseTables(pool);
      }
    })
    .catch((err) => {
      console.warn('⚠️ [PostgreSQL] Koneksi database belum aktif:', err.message);
      console.log('💡 Aplikasi tetap berjalan normal menggunakan data memori/lokal.');
      isDbConnected = false;
    });
} else {
  console.log('ℹ️ [PostgreSQL] DATABASE_URL atau DB_PASSWORD belum diatur di .env. Menggunakan mode penyimpanan lokal.');
}

// ====================================================================
// 2. ENDPOINT STATUS SISTEM & DATABASE
// ====================================================================
app.get('/api/status', async (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    appName: 'TUMIN Information System & POS',
    database: isDbConnected ? 'connected' : 'offline_fallback',
    message: isDbConnected
      ? 'Terhubung dengan database PostgreSQL (tumin_db)'
      : 'Mode Mandiri / Browser LocalStorage (Atur DATABASE_URL di .env untuk mengaktifkan)',
  });
});

// ====================================================================
// 3. API PENGATURAN TOKO (Tabel: pengaturan_toko)
// ====================================================================
app.get('/api/pengaturan', async (_req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.status(200).json({ source: 'local', data: null });
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
          bankName: row.nama_bank,
          bankAccountNumber: row.nomor_rekening,
          bankAccountHolder: row.atas_nama_rekening,
          operatingHours: row.jam_operasional,
          receiptFooter: row.pesan_kaki_struk,
        },
      });
    } else {
      res.json({ source: 'postgresql', data: null });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/pengaturan', async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({ success: true, mode: 'local' });
  }
  const s = req.body;
  try {
    await pool.query(
      `INSERT INTO pengaturan_toko (id, nama_toko, slogan, alamat, no_telepon, nama_bank, nomor_rekening, atas_nama_rekening, jam_operasional, pesan_kaki_struk)
       VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE SET
         nama_toko = EXCLUDED.nama_toko,
         slogan = EXCLUDED.slogan,
         alamat = EXCLUDED.alamat,
         no_telepon = EXCLUDED.no_telepon,
         nama_bank = EXCLUDED.nama_bank,
         nomor_rekening = EXCLUDED.nomor_rekening,
         atas_nama_rekening = EXCLUDED.atas_nama_rekening,
         jam_operasional = EXCLUDED.jam_operasional,
         pesan_kaki_struk = EXCLUDED.pesan_kaki_struk,
         diperbarui_pada = CURRENT_TIMESTAMP`,
      [
        s.storeName,
        s.tagline,
        s.address,
        s.phone,
        s.bankName,
        s.bankAccountNumber,
        s.bankAccountHolder,
        s.operatingHours,
        s.receiptFooter,
      ]
    );
    res.json({ success: true, message: 'Pengaturan toko berhasil disimpan ke database' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// 4. API KATALOG PRODUK (Tabel: produk)
// ====================================================================
app.get('/api/produk', async (_req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({ source: 'local', data: [] });
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
      lastUpdated: r.terakhir_diperbarui,
    }));
    res.json({ source: 'postgresql', data: mapped });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/produk', async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({ success: true, mode: 'local' });
  }
  const p = req.body;
  try {
    await pool.query(
      `INSERT INTO produk (id, sku, nama_produk, kategori, harga_jual, harga_pokok_modal, stok, stok_minimum, satuan, deskripsi)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         sku = EXCLUDED.sku,
         nama_produk = EXCLUDED.nama_produk,
         kategori = EXCLUDED.kategori,
         harga_jual = EXCLUDED.harga_jual,
         harga_pokok_modal = EXCLUDED.harga_pokok_modal,
         stok = EXCLUDED.stok,
         stok_minimum = EXCLUDED.stok_minimum,
         satuan = EXCLUDED.satuan,
         deskripsi = EXCLUDED.deskripsi,
         terakhir_diperbarui = CURRENT_TIMESTAMP`,
      [
        p.id,
        p.sku,
        p.name,
        p.category,
        p.price,
        p.costPrice,
        p.stock,
        p.minStock,
        p.unit || 'Pcs',
        p.description || '',
      ]
    );
    res.json({ success: true, message: 'Produk berhasil disimpan ke PostgreSQL' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// 5. API MITRA RESELLER / SELLER (Tabel: mitra_seller)
// ====================================================================
app.get('/api/mitra-seller', async (_req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({ source: 'local', data: [] });
  }
  try {
    const result = await pool.query('SELECT * FROM mitra_seller ORDER BY tanggal_daftar DESC');
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
      password: r.password,
    }));
    res.json({ source: 'postgresql', data: mapped });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mitra-seller', async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({ success: true, mode: 'local' });
  }
  const s = req.body;
  try {
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
         status = EXCLUDED.status,
         limit_piutang = EXCLUDED.limit_piutang,
         total_piutang_berjalan = EXCLUDED.total_piutang_berjalan,
         catatan = EXCLUDED.catatan,
         password = COALESCE(EXCLUDED.password, mitra_seller.password)`,
      [
        s.id,
        s.username || null,
        s.name,
        s.storeName,
        s.phone,
        s.email || null,
        s.address,
        s.status || 'Pending',
        s.creditLimit || 5000000,
        s.totalReceivables || 0,
        s.notes || '',
        s.password || 'seller123',
      ]
    );
    res.json({ success: true, message: 'Mitra seller berhasil disimpan ke PostgreSQL' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// 6. API TRANSAKSI & FAKTUR KASIR (Tabel: faktur_penjualan & item_faktur)
// ====================================================================
app.get('/api/faktur', async (_req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({ source: 'local', data: [] });
  }
  try {
    const invResult = await pool.query('SELECT * FROM faktur_penjualan ORDER BY tanggal DESC');
    const itemResult = await pool.query('SELECT * FROM item_faktur');

    const mapped = invResult.rows.map((inv) => {
      const items = itemResult.rows
        .filter((it) => it.id_faktur === inv.id)
        .map((it) => ({
          productId: it.id_produk,
          productSku: it.sku_produk,
          productName: it.nama_produk,
          quantity: Number(it.jumlah),
          unitPrice: Number(it.harga_satuan),
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
        changeAmount: inv.uang_kembalian ? Number(inv.uang_kembalian) : undefined,
        bankName: inv.nama_bank || undefined,
        transferReference: inv.nomor_referensi_transfer || undefined,
        paymentProofImage: inv.foto_bukti_transfer || undefined,
        sellerId: inv.id_seller || undefined,
        sellerName: inv.nama_seller || undefined,
        dueDate: inv.tanggal_jatuh_tempo || undefined,
        amountPaid: Number(inv.jumlah_terbayar || 0),
        status:
          inv.status_pembayaran === 'LUNAS'
            ? 'PAID'
            : inv.status_pembayaran === 'BELUM_LUNAS'
            ? 'UNPAID'
            : inv.status_pembayaran === 'SEBAGIAN'
            ? 'PARTIAL'
            : (inv.status_pembayaran || 'PAID'),
        items,
      };
    });

    res.json({ source: 'postgresql', data: mapped });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/faktur', async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({ success: true, mode: 'local' });
  }
  const inv = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const dbStatus =
      inv.status === 'PAID' || inv.status === 'LUNAS'
        ? 'LUNAS'
        : inv.status === 'UNPAID' || inv.status === 'BELUM_LUNAS'
        ? 'BELUM_LUNAS'
        : inv.status === 'PARTIAL' || inv.status === 'SEBAGIAN'
        ? 'SEBAGIAN'
        : 'LUNAS';

    // 1. Simpan header faktur
    await client.query(
      `INSERT INTO faktur_penjualan (
         id, nomor_faktur, tanggal, nama_kasir, metode_pembayaran, subtotal, diskon, total_akhir,
         uang_diterima, uang_kembalian, nama_bank, nomor_referensi_transfer, foto_bukti_transfer,
         id_seller, nama_seller, tanggal_jatuh_tempo, jumlah_terbayar, sisa_tagihan, status_pembayaran
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
       ON CONFLICT (id) DO UPDATE SET
         jumlah_terbayar = EXCLUDED.jumlah_terbayar,
         sisa_tagihan = EXCLUDED.sisa_tagihan,
         status_pembayaran = EXCLUDED.status_pembayaran,
         foto_bukti_transfer = COALESCE(EXCLUDED.foto_bukti_transfer, faktur_penjualan.foto_bukti_transfer)`,
      [
        inv.id,
        inv.invoiceNumber,
        inv.date || new Date(),
        inv.cashierName,
        inv.paymentMethod,
        inv.subtotal,
        inv.discount || 0,
        inv.total,
        inv.cashReceived || null,
        inv.changeAmount || null,
        inv.bankName || null,
        inv.transferReference || null,
        inv.paymentProofImage || null,
        inv.sellerId || null,
        inv.sellerName || null,
        inv.dueDate || null,
        inv.amountPaid || 0,
        inv.remainingBalance || 0,
        dbStatus,
      ]
    );

    // 2. Simpan rincian item jika ada
    if (inv.items && Array.isArray(inv.items)) {
      for (const item of inv.items) {
        // Pastikan master produk ada di tabel produk agar relasi foreign key valid
        if (item.productId) {
          await client.query(
            `INSERT INTO produk (id, sku, nama_produk, kategori, harga_jual, harga_pokok_modal, stok, stok_minimum, satuan)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO NOTHING`,
            [
              item.productId,
              item.productSku || 'SKU-' + item.productId,
              item.productName || 'Produk ' + item.productId,
              'CD Pria',
              item.unitPrice || 0,
              (item.unitPrice || 0) * 0.6,
              100,
              10,
              'pcs',
            ]
          );
        }

        await client.query(
          `INSERT INTO item_faktur (id_faktur, id_produk, sku_produk, nama_produk, jumlah, harga_satuan, subtotal)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            inv.id,
            item.productId,
            item.productSku,
            item.productName,
            item.quantity,
            item.unitPrice,
            item.subtotal,
          ]
        );
      }
    }

    await client.query('COMMIT');
    console.log(`✅ [PostgreSQL] Faktur ${inv.invoiceNumber} berhasil disimpan ke database.`);
    res.json({ success: true, message: 'Faktur transaksi berhasil dicatat ke PostgreSQL' });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('❌ [PostgreSQL] Gagal menyimpan faktur ke database:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ====================================================================
// 7. API CICILAN PIUTANG (Tabel: cicilan_piutang)
// ====================================================================
app.get('/api/cicilan', async (_req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({ source: 'local', data: [] });
  }
  try {
    const result = await pool.query('SELECT * FROM cicilan_piutang ORDER BY tanggal DESC');
    res.json({ source: 'postgresql', data: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/cicilan', async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({ success: true, mode: 'local' });
  }
  const inst = req.body;
  try {
    await pool.query(
      `INSERT INTO cicilan_piutang (id, id_faktur, tanggal, nominal_cicilan, metode_pembayaran, dicatat_oleh, catatan, foto_bukti_transfer)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        inst.id,
        inst.invoiceId,
        inst.date || new Date(),
        inst.amount,
        inst.method,
        inst.recordedBy,
        inst.notes || '',
        inst.paymentProofImage || null,
      ]
    );
    res.json({ success: true, message: 'Setoran cicilan berhasil disimpan ke PostgreSQL' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// 8. API KARTU MUTASI STOK AUDIT (Tabel: mutasi_stok)
// ====================================================================
app.get('/api/mutasi-stok', async (_req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({ source: 'local', data: [] });
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
      newStock: Number(r.stok_sesudah),
      notes: r.catatan,
      actor: r.penanggung_jawab,
    }));
    res.json({ source: 'postgresql', data: mapped });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mutasi-stok', async (req: Request, res: Response) => {
  if (!pool || !isDbConnected) {
    return res.json({ success: true, mode: 'local' });
  }
  const m = req.body;
  try {
    await pool.query(
      `INSERT INTO mutasi_stok (id, tanggal, id_produk, sku_produk, nama_produk, jenis_mutasi, jumlah_perubahan, stok_sebelum, stok_sesudah, catatan, penanggung_jawab)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        m.id,
        m.date || new Date(),
        m.productId,
        m.productSku,
        m.productName,
        m.type,
        m.change,
        m.previousStock,
        m.newStock,
        m.notes || '',
        m.actor,
      ]
    );
    res.json({ success: true, message: 'Mutasi stok berhasil dicatat ke PostgreSQL' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// 9. KREDENSIAL INTERNAL (OWNER & KASIR) DARI .ENV
// ====================================================================
const OWNER_USERNAME = process.env.OWNER_USERNAME || 'owner@tinounderwear.id';
const OWNER_PASSWORD = process.env.OWNER_PASSWORD || 'admin123';

const KASIR_USERNAME = process.env.KASIR_USERNAME || 'kasir';
const KASIR_PASSWORD = process.env.KASIR_PASSWORD || 'kasir123';

const KASIR2_USERNAME = process.env.KASIR2_USERNAME || 'kasir2';
const KASIR2_PASSWORD = process.env.KASIR2_PASSWORD || 'kasir123';

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const { role, identifier, password } = req.body;

  if (!role || !identifier || !password) {
    return res.status(400).json({ success: false, error: 'Username/No. Telepon dan Kata Sandi wajib diisi.' });
  }

  const cleanId = String(identifier).trim().toLowerCase();
  const cleanPhoneDigits = cleanId.replace(/\D/g, '');
  const cleanPass = String(password).trim();

  // 1. VALIDASI ROLE OWNER (Menggunakan kredensial dari file .env)
  if (role === 'owner') {
    const isUserMatch =
      cleanId === OWNER_USERNAME.toLowerCase() ||
      cleanId === 'owner' ||
      cleanId === 'admin';

    if (!isUserMatch || cleanPass !== OWNER_PASSWORD) {
      return res.status(401).json({
        success: false,
        error: 'Email/Username atau Kata Sandi salah untuk Akun Owner (.env).',
      });
    }

    return res.json({
      success: true,
      user: {
        id: 'usr-owner',
        name: 'Pak Tino (Owner)',
        email: OWNER_USERNAME,
        role: 'owner',
        phone: '0812-9876-5432',
      },
    });
  }

  // 2. VALIDASI ROLE KASIR (Menggunakan kredensial dari file .env)
  if (role === 'kasir') {
    const isKasir1 =
      (cleanId === KASIR_USERNAME.toLowerCase() ||
       cleanId === 'kasir' ||
       cleanId === 'kasir@tinounderwear.id') &&
      cleanPass === KASIR_PASSWORD;

    if (isKasir1) {
      return res.json({
        success: true,
        user: {
          id: 'usr-kasir-1',
          name: 'Siti Rahma (Kasir 1)',
          email: `${KASIR_USERNAME}@tinounderwear.id`,
          role: 'kasir',
          shift: 'Shift Pagi (08:00 - 16:00)',
          phone: '0813-2233-4455',
        },
      });
    }

    const isKasir2 =
      (cleanId === KASIR2_USERNAME.toLowerCase() ||
       cleanId === 'kasir2' ||
       cleanId === 'kasir2@tinounderwear.id') &&
      cleanPass === KASIR2_PASSWORD;

    if (isKasir2) {
      return res.json({
        success: true,
        user: {
          id: 'usr-kasir-2',
          name: 'Dewi Lestari (Kasir 2)',
          email: `${KASIR2_USERNAME}@tinounderwear.id`,
          role: 'kasir',
          shift: 'Shift Sore (16:00 - 22:00)',
          phone: '0813-8899-1122',
        },
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Username atau Kata Sandi salah untuk Akun Kasir (.env).',
    });
  }

  // 3. VALIDASI ROLE SELLER (Username atau No. Telepon + Kata Sandi)
  if (role === 'seller') {
    if (pool && isDbConnected) {
      try {
        const result = await pool.query(
          `SELECT * FROM mitra_seller 
           WHERE LOWER(COALESCE(username, '')) = $1 
              OR LOWER(no_telepon) = $1 
              OR REPLACE(no_telepon, '-', '') = $2
              OR LOWER(COALESCE(email, '')) = $1 
              OR id = $1`,
          [cleanId, cleanPhoneDigits || cleanId]
        );

        if (result.rows.length === 0) {
          return res.status(401).json({
            success: false,
            error: 'Akun mitra seller tidak ditemukan. Silakan periksa kembali username atau nomor telepon Anda, atau ajukan pendaftaran mitra.',
          });
        }

        const seller = result.rows[0];
        if (seller.status === 'Pending') {
          return res.status(403).json({
            success: false,
            error: `Pengajuan kemitraan "${seller.nama_toko}" masih berstatus PENDING (Menunggu Persetujuan Owner). Owner akan menghubungi Anda via WhatsApp di nomor ${seller.no_telepon} setelah akun disetujui.`,
          });
        }

        if (seller.status === 'Ditangguhkan') {
          return res.status(403).json({
            success: false,
            error: `Akun kemitraan "${seller.nama_toko}" sedang ditangguhkan. Silakan hubungi Owner Tino Underwear untuk informasi lebih lanjut.`,
          });
        }

        const expectedPass = seller.password || 'seller123';
        if (cleanPass !== expectedPass) {
          return res.status(401).json({
            success: false,
            error: `Kata sandi salah untuk akun mitra seller "${seller.nama_pemilik}". Hubungi Owner jika Anda lupa kata sandi.`,
          });
        }

        return res.json({
          success: true,
          user: {
            id: seller.id,
            username: seller.username || seller.id,
            name: seller.nama_pemilik,
            email: seller.email || `${seller.no_telepon}@seller.tinounderwear.id`,
            role: 'seller',
            storeName: seller.nama_toko,
            phone: seller.no_telepon,
          },
        });
      } catch (err: any) {
        console.error('Error saat login seller dari database:', err.message);
      }
    }

    // Fallback Seller jika database lokal belum aktif / mode in-memory
    const isBudi =
      cleanId === 'budi88' ||
      cleanPhoneDigits === '081288997711' ||
      cleanId === '0812-8899-7711' ||
      cleanId === 'seller.budi@gmail.com' ||
      cleanId === 'seller';

    if (isBudi) {
      if (cleanPass !== 'seller123') {
        return res.status(401).json({ success: false, error: 'Kata sandi salah untuk akun Budi Santoso (Toko Budi Jaya).' });
      }
      return res.json({
        success: true,
        user: {
          id: 'sel-01',
          username: 'budi88',
          name: 'Budi Santoso',
          email: 'budi88@seller.tinounderwear.id',
          role: 'seller',
          storeName: 'Toko Budi Jaya',
          phone: '0812-8899-7711',
        },
      });
    }

    const isMaryam =
      cleanId === 'maryam_barokah' ||
      cleanPhoneDigits === '085712349088' ||
      cleanId === '0857-1234-9088' ||
      cleanId === 'maryam.barokah@yahoo.com' ||
      cleanId === 'maryam';

    if (isMaryam) {
      if (cleanPass !== 'seller123') {
        return res.status(401).json({ success: false, error: 'Kata sandi salah untuk akun Hajjah Maryam.' });
      }
      return res.json({
        success: true,
        user: {
          id: 'sel-02',
          username: 'maryam_barokah',
          name: 'Hajjah Maryam',
          email: 'maryam@seller.tinounderwear.id',
          role: 'seller',
          storeName: 'Grosir Maryam Barokah',
          phone: '0857-1234-9088',
        },
      });
    }

    const isHendra =
      cleanId === 'hendra_wijaya' ||
      cleanPhoneDigits === '081377223344' ||
      cleanId === '0813-7722-3344';

    if (isHendra) {
      if (cleanPass !== 'seller123') {
        return res.status(401).json({ success: false, error: 'Kata sandi salah untuk akun Hendra Wijaya.' });
      }
      return res.json({
        success: true,
        user: {
          id: 'sel-03',
          username: 'hendra_wijaya',
          name: 'Hendra Wijaya',
          email: 'hendra@seller.tinounderwear.id',
          role: 'seller',
          storeName: 'Kios Busana Hendra',
          phone: '0813-7722-3344',
        },
      });
    }

    if (cleanId === 'nina_kurnia' || cleanPhoneDigits === '081933445566') {
      return res.status(403).json({
        success: false,
        error: 'Pengajuan kemitraan "Toko Nina Busana" masih berstatus PENDING (Menunggu Persetujuan Owner). Owner akan menghubungi Anda via WhatsApp setelah disetujui.',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Username/No. Telepon atau kata sandi tidak cocok. Pastikan akun sudah disetujui oleh Owner.',
    });
  }

  return res.status(400).json({ success: false, error: 'Peran pengguna tidak dikenal.' });
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
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [TUMIN] Server aktif dan berjalan di http://localhost:${PORT}`);
});
