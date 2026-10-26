-- ====================================================================
-- SKEMA DATABASE POSTGRESQL: TUMIN INFORMATION SYSTEM & POS
-- Tino Underwear Management & POS System
-- ====================================================================


-- 1. TABEL PENGGUNA & KREDENSIAL LOGIN
CREATE TABLE pengguna (
    id VARCHAR(50) PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    kata_sandi_hash VARCHAR(255) NOT NULL,
    peran VARCHAR(20) NOT NULL CHECK (peran IN ('owner', 'kasir', 'seller')),
    nama_toko VARCHAR(100),
    no_telepon VARCHAR(30),
    shift VARCHAR(50), -- Contoh: 'Shift Pagi (08:00 - 16:00)'
    dibuat_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL PENGATURAN TOKO & REKENING BANK
CREATE TABLE pengaturan_toko (
    id INT PRIMARY KEY DEFAULT 1,
    nama_toko VARCHAR(150) NOT NULL DEFAULT 'Tino Underwear',
    slogan TEXT DEFAULT 'Pusat Grosir & Eceran Pakaian Dalam Berkualitas',
    alamat TEXT DEFAULT 'Jl. Pemuda No. 12, Kranji, Bekasi Barat, Kota Bekasi, Jawa Barat 17135',
    no_telepon VARCHAR(30) DEFAULT '0812-9876-5432',
    nama_bank VARCHAR(100) DEFAULT 'BCA (Bank Central Asia)',
    nomor_rekening VARCHAR(50) DEFAULT '8830-1928-33',
    atas_nama_rekening VARCHAR(100) DEFAULT 'Suhartino (Tino Underwear)',
    jam_operasional VARCHAR(100) DEFAULT '08:00 - 21:00 WIB',
    pesan_kaki_struk TEXT DEFAULT 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan kecuali ada perjanjian.',
    diperbarui_pada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL MASTER KATALOG PRODUK
CREATE TABLE produk (
    id VARCHAR(50) PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    nama_produk VARCHAR(150) NOT NULL,
    kategori VARCHAR(50) NOT NULL CHECK (kategori IN ('CD Pria', 'CD Wanita', 'Anak-Anak', 'Korset')),
    harga_jual NUMERIC(15, 2) NOT NULL,          -- Harga Jual Kasir (Rp)
    harga_pokok_modal NUMERIC(15, 2) NOT NULL,   -- HPP Modal Beli (Rp)
    stok INT NOT NULL DEFAULT 0,
    stok_minimum INT NOT NULL DEFAULT 10,
    satuan VARCHAR(20) NOT NULL DEFAULT 'Pcs',    -- 'Pcs', 'Lusin', 'Box'
    deskripsi TEXT,
    terakhir_diperbarui TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL MITRA RESELLER / SELLER
CREATE TABLE mitra_seller (
    id VARCHAR(50) PRIMARY KEY,
    nama_pemilik VARCHAR(100) NOT NULL,
    nama_toko VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(30) NOT NULL,
    email VARCHAR(100) NOT NULL,
    alamat TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Aktif', 'Pending', 'Ditangguhkan')),
    limit_piutang NUMERIC(15, 2) DEFAULT 5000000, -- Limit Kredit Maksimal (Rp)
    total_piutang_berjalan NUMERIC(15, 2) DEFAULT 0, -- Piutang Belum Lunas (Rp)
    tanggal_transaksi_terakhir TIMESTAMP,
    tanggal_daftar TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    catatan TEXT
);

-- 5. TABEL BARANG KONSINYASI / TITIP TEMPO MITRA
CREATE TABLE barang_konsinyasi (
    id VARCHAR(50) PRIMARY KEY,
    id_seller VARCHAR(50) NOT NULL REFERENCES mitra_seller(id) ON DELETE CASCADE,
    id_produk VARCHAR(50) NOT NULL REFERENCES produk(id),
    sku_produk VARCHAR(50) NOT NULL,
    nama_produk VARCHAR(150) NOT NULL,
    jumlah_stok_titip INT NOT NULL DEFAULT 0,
    harga_modal_satuan NUMERIC(15, 2) NOT NULL,
    harga_jual_anjuran NUMERIC(15, 2) NOT NULL,
    tanggal_titip TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. TABEL FAKTUR PENJUALAN KASIR
CREATE TABLE faktur_penjualan (
    id VARCHAR(50) PRIMARY KEY,
    nomor_faktur VARCHAR(50) UNIQUE NOT NULL, -- Contoh: #INV-20261007-001
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nama_kasir VARCHAR(100) NOT NULL,
    metode_pembayaran VARCHAR(20) NOT NULL CHECK (metode_pembayaran IN ('Tunai', 'Transfer Bank', 'Kredit')),
    subtotal NUMERIC(15, 2) NOT NULL,
    diskon NUMERIC(15, 2) DEFAULT 0,
    total_akhir NUMERIC(15, 2) NOT NULL,
    
    -- Pembayaran Tunai
    uang_diterima NUMERIC(15, 2),
    uang_kembalian NUMERIC(15, 2),

    -- Pembayaran Transfer Bank
    nama_bank VARCHAR(100),
    nomor_referensi_transfer VARCHAR(150),
    foto_bukti_transfer TEXT,

    -- Pembayaran Tempo / Kredit Mitra
    id_seller VARCHAR(50) REFERENCES mitra_seller(id),
    nama_seller VARCHAR(100),
    tanggal_jatuh_tempo TIMESTAMP,
    jumlah_terbayar NUMERIC(15, 2) DEFAULT 0,
    sisa_tagihan NUMERIC(15, 2) DEFAULT 0,
    status_pembayaran VARCHAR(20) NOT NULL CHECK (status_pembayaran IN ('LUNAS', 'SEBAGIAN', 'BELUM_LUNAS', 'PAID', 'UNPAID', 'PARTIAL'))
);

-- 7. TABEL ITEM DETAIL FAKTUR
CREATE TABLE item_faktur (
    id SERIAL PRIMARY KEY,
    id_faktur VARCHAR(50) NOT NULL REFERENCES faktur_penjualan(id) ON DELETE CASCADE,
    id_produk VARCHAR(50) NOT NULL REFERENCES produk(id),
    sku_produk VARCHAR(50) NOT NULL,
    nama_produk VARCHAR(150) NOT NULL,
    jumlah INT NOT NULL,
    harga_satuan NUMERIC(15, 2) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL
);

-- 8. TABEL CICILAN / ANGSURAN PIUTANG
CREATE TABLE cicilan_piutang (
    id VARCHAR(50) PRIMARY KEY,
    id_faktur VARCHAR(50) NOT NULL REFERENCES faktur_penjualan(id) ON DELETE CASCADE,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nominal_cicilan NUMERIC(15, 2) NOT NULL,
    metode_pembayaran VARCHAR(20) NOT NULL CHECK (metode_pembayaran IN ('Tunai', 'Transfer Bank')),
    dicatat_oleh VARCHAR(100) NOT NULL,
    catatan TEXT,
    foto_bukti_transfer TEXT
);

-- 9. TABEL AUDIT & MUTASI STOK GUDANG
CREATE TABLE mutasi_stok (
    id VARCHAR(50) PRIMARY KEY,
    tanggal TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id_produk VARCHAR(50) NOT NULL REFERENCES produk(id),
    sku_produk VARCHAR(50) NOT NULL,
    nama_produk VARCHAR(150) NOT NULL,
    jenis_mutasi VARCHAR(30) NOT NULL CHECK (jenis_mutasi IN (
        'RESTOCK', 
        'PENJUALAN', 
        'KONSINYASI_KELUAR', 
        'KONSINYASI_RETUR', 
        'OPNAME_KOREKSI', 
        'RUSAK_REJECT'
    )),
    jumlah_perubahan INT NOT NULL,           -- Kuantitas (+ atau -)
    stok_sebelum INT NOT NULL,
    stok_sesudah INT NOT NULL,
    catatan TEXT,
    penanggung_jawab VARCHAR(100) NOT NULL
);

-- ====================================================================
-- DATA AWAL BAWAAN (SEEDED DATA DEMO BAHASA INDONESIA)
-- ====================================================================

-- Pengaturan Toko
INSERT INTO pengaturan_toko (id, nama_toko, slogan, alamat, no_telepon, nama_bank, nomor_rekening, atas_nama_rekening, jam_operasional)
VALUES (
    1, 
    'Tino Underwear', 
    'Pusat Grosir & Eceran Pakaian Dalam Berkualitas', 
    'Jl. Pemuda No. 12, Kranji, Bekasi Barat, Kota Bekasi, Jawa Barat 17135',
    '0812-9876-5432',
    'BCA (Bank Central Asia)',
    '8830-1928-33',
    'Suhartino (Tino Underwear)',
    '08:00 - 21:00 WIB'
) ON CONFLICT (id) DO NOTHING;

-- Akun Pengguna Bawaan
INSERT INTO pengguna (id, nama, email, kata_sandi_hash, peran, nama_toko, no_telepon, shift)
VALUES 
    ('user-1', 'Pak Suhartino (Owner)', 'owner@tinounderwear.id', 'admin123', 'owner', 'Tino Underwear Pusat', '0812-9876-5432', NULL),
    ('user-2', 'Siti Rahmawati (Kasir)', 'kasir@tinounderwear.id', 'kasir123', 'kasir', 'Tino Underwear Pusat', '0857-1122-3344', 'Shift Pagi (08:00 - 16:00)'),
    ('user-3', 'Budi Santoso (Mitra)', 'seller.budi@gmail.com', 'seller123', 'seller', 'Toko Budi Busana', '0813-8899-7766', NULL)
ON CONFLICT (id) DO NOTHING;

-- Katalog Produk Bawaan Tino Underwear
INSERT INTO produk (id, sku, nama_produk, kategori, harga_jual, harga_pokok_modal, stok, stok_minimum, satuan, deskripsi)
VALUES
    ('prod-01', 'TU-CDP-01', 'CD Pria Boxer Seamless Bamboo Anti-Bakteri', 'CD Pria', 28000, 16500, 45, 15, 'pcs', 'Bahan serat bambu premium, sejuk dan elastis.'),
    ('prod-02', 'TU-CDP-02', 'CD Pria Brief Katun Combed 30s Sporty (Isi 3)', 'CD Pria', 55000, 34000, 8, 10, 'pack', 'Paket 3 pcs celana dalam katun combed lembut.'),
    ('prod-03', 'TU-CDP-03', 'CD Pria Segitiga Classic Karet Elastis', 'CD Pria', 18000, 10500, 62, 15, 'pcs', 'Model klasik dengan karet pinggang kuat anti kendor.'),
    ('prod-04', 'TU-CDW-01', 'CD Wanita Katun Renda Breathable Comfort', 'CD Wanita', 22000, 12500, 35, 12, 'pcs', 'Celana dalam wanita dengan aksen renda halus.'),
    ('prod-05', 'TU-CDW-02', 'CD Wanita Seamless Anti-Nyeplak Mid-Waist', 'CD Wanita', 25000, 14000, 50, 15, 'pcs', 'Potongan laser tanpa jahitan pinggir.'),
    ('prod-06', 'TU-CDA-01', 'CD Anak Laki-Laki Motif Karakter Katun (Isi 3)', 'Anak-Anak', 38000, 22000, 28, 10, 'pack', 'Bahan katun lembut ramah kulit anak.'),
    ('prod-07', 'TU-CDA-02', 'CD Anak Perempuan Motif Pastel Lucu (Isi 3)', 'Anak-Anak', 38000, 22000, 30, 10, 'pack', 'Motif lucu warna pastel ceria.'),
    ('prod-08', 'TU-KOR-01', 'Korset Pelangsing Perut High-Waist 4 Tulang', 'Korset', 65000, 38000, 15, 8, 'pcs', 'Menopang pinggang dan membentuk siluet tubuh.')
ON CONFLICT (id) DO NOTHING;

-- Mitra Seller Bawaan
INSERT INTO mitra_seller (id, nama_pemilik, nama_toko, no_telepon, email, alamat, status, limit_piutang, total_piutang_berjalan)
VALUES
    ('sel-01', 'Budi Santoso', 'Toko Budi Busana', '0813-8899-7766', 'seller.budi@gmail.com', 'Pasar Baru Blok A No. 12, Bekasi', 'Aktif', 5000000, 1420000),
    ('sel-02', 'Hj. Mardiah', 'Kios Berkah Barokah', '0812-4455-6677', 'mardiah.toko@yahoo.com', 'Ruko Sentra Grosir Cikarang No. 05', 'Aktif', 7500000, 2850000)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- VIEW MEMUDAHKAN CEK TRANSAKSI DI PGADMIN (Mirip Tampilan Struk / Kasir)
-- ====================================================================
CREATE OR REPLACE VIEW v_laporan_transaksi_kasir AS
SELECT 
    f.nomor_faktur,
    f.tanggal,
    f.nama_kasir,
    f.metode_pembayaran,
    COALESCE(f.nama_seller, 'Pelanggan Ritel / Toko') AS pelanggan,
    COUNT(i.id) AS total_jenis_produk,
    SUM(i.jumlah) AS total_pcs_terjual,
    f.subtotal,
    f.diskon,
    f.total_akhir,
    f.status_pembayaran,
    STRING_AGG(i.jumlah || 'x ' || i.nama_produk, ', ') AS rincian_produk
FROM faktur_penjualan f
LEFT JOIN item_faktur i ON f.id = i.id_faktur
GROUP BY f.id, f.nomor_faktur, f.tanggal, f.nama_kasir, f.metode_pembayaran, f.nama_seller, f.subtotal, f.diskon, f.total_akhir, f.status_pembayaran
ORDER BY f.tanggal DESC;
