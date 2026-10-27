# Caps_Project-TUMIN
TUMIN adalah sistem informasi manajemen operasional dan Point Of Sale (POS) berbasis web yang dirancang khusus untuk mengautomasi tata kelola bisnis grosir dan eceran UMKM Tino Underwear di Bekasi. Sistem ini mengintegrasikan pencatatan penjualan kasir, kontrol stok inventori, hingga pengelolaan transaksi kredit tempo dan piutang mitra.

# 🎨 Desain UI/UX & Prototype TUMIN
Berikut adalah link menuju desain antarmuka dan *interactive prototype* aplikasi TUMIN (Tino Underwear UMKM Integration), pada platform Figma:
🔗 **[Buka Prototype TUMIN di Figma](https://www.figma.com/design/FfXW59Gd3WaCjNV3amZWL0/UI_TUMIN?node-id=0-1&t=7oPWYUu9tvjkTECM-1)**

### 📱 Modul yang Dirancang:
1. **Owner / Pemilik:**
   - Ringkasan Laporan Laba Rugi
   - Manajemen Piutang Agen & Limit Kredit
2. **Staf / Kasir:**
   - Input Transaksi Penjualan
   - Manajemen & Penyesuaian Stok Barang Multi-Varian
3. **Mitra / Seller:**
   - Katalog Produk & Status Tagihan Mandiri

### 📂 Struktur Folder Proyek TUMIN
Pastikan seluruh file dan folder di bawah ini terpindahkan dengan lengkap:
```text
tumin/
├── .gitignore              # Daftar file yang diabaikan Git
├── index.html              # Entry point HTML & meta viewport
├── package.json            # Daftar pustaka (React, Vite, Lucide, Tailwind)
├── tsconfig.json           # Konfigurasi TypeScript
├── vite.config.ts          # Konfigurasi build Vite
├── tumin_schema.sql        # Rancangan 9 tabel database
├── README.md               # Dokumentasi panduan & skema database
├── public/                 # Aset statis & ikon
└── src/                    # Seluruh kode sumber aplikasi
    ├── main.tsx            # Entry point React
    ├── App.tsx             # Router peran (Owner, Kasir, Seller, Portal)
    ├── index.css           # Styling Tailwind CSS & custom scrollbar
    ├── types/              # Definisi interface TypeScript (Product, Invoice, Seller, dll.)
    ├── context/            # Pengelola state & data (AppContext.tsx)
    ├── data/               # Data awal / sampel toko (initialData.ts)
    ├── utils/              # Helper format mata uang, tanggal, struk SVG
    └── components/         # Komponen antarmuka per modul:
        ├── common/         # Komponen bersama (Badge, Card, Modal Bukti Transfer)
        ├── owner/          # Dashboard Owner, Stok, Seller, Piutang, Laporan Keuangan
        ├── pos/            # Layar Kasir POS, Keranjang, Struk, Modal Pembayaran
        ├── seller/         # Portal Mitra Seller (Stok Tempo & Tagihan Faktur)
        └── portal/         # Portal Utama Login & Registrasi Mitra
```



### METODE Pemindahan Manual Berkas demi Berkas 
Jika Anda menyalin secara manual dari editor/workspace:
1. Buat folder baru di komputer lokal, misalnya `D:\tumin`.
2. Salin seluruh isi folder `src/`, `public/`, `index.html`, `package.json`, `tsconfig.json`, `vite.config.ts`, dan skrip.



## Cara Menjalankan TUMIN di Komputer Lokal

### Langkah 1: Pasang Node.js
Pastikan Node.js sudah terpasang di komputer Anda:
- Unduh dari situs resmi: [https://nodejs.org](https://nodejs.org/) (Pilih versi **LTS**, misal v20 atau v22).
- Jalankan instalasi `.msi` hingga selesai (pastikan opsi *"Add to PATH"* aktif).

### Langkah 2: Menjalankan Aplikasi via Terminal (CMD / PowerShell / Mac Terminal)
1. Buka terminal di dalam folder proyek TUMIN.
2. Pasang pustaka pendukung (hanya perlu dijalankan sekali di awal):
   ```bash
   npm install
   ```
3. Jalankan server lokal:
   ```bash
   npm run dev
   ```
4. Buka peramban (browser) dan akses alamat:
   👉 **`http://localhost:3000`**

#### 📱 Mengakses dari HP / Tablet di Jaringan Wi-Fi yang Sama:
Jalankan server dengan parameter `--host`:
```bash
npm run dev -- --host
```
Terminal akan menampilkan alamat IP lokal (misalnya `http://192.168.1.15:3000`). Buka alamat tersebut di peramban HP kasir atau seller yang terhubung ke jaringan Wi-Fi yang sama dengan laptop.


## 🔐 3. Akun Akses Demo Bawaan

Saat pertama kali dibuka, Anda dapat langsung mencoba login dengan kredensial:
- **Owner (Pemilik Toko)**: `owner@tinounderwear.id` | Sandi: `admin123`
- **Kasir (Point of Sale)**: `kasir@tinounderwear.id` | Sandi: `kasir123`
- **Seller (Mitra Reseller)**: `seller.budi@gmail.com` | Sandi: `seller123`


## 🗄️ 4. Skema Database PostgreSQL 

Berikut rancangan 9 tabel relasional yang selaras dengan seluruh tipe data dan alur transaksi TUMIN:

```sql
-- ====================================================================
-- SKEMA DATABASE POSTGRESQL BAHASA INDONESIA: TUMIN INFORMATION SYSTEM & POS
-- ====================================================================

-- 1. TABEL PENGGUNA & KREDENSIAL LOGIN (pengguna)
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

-- 2. TABEL PENGATURAN TOKO & REKENING (pengaturan_toko)
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

-- 3. TABEL MASTER KATALOG PRODUK (produk)
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

-- 4. TABEL MITRA RESELLER / SELLER (mitra_seller)
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

-- 5. TABEL BARANG KONSINYASI / TITIP TEMPO (barang_konsinyasi)
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

-- 6. TABEL FAKTUR TRANSAKSI KASIR (faktur_penjualan)
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
    status_pembayaran VARCHAR(20) NOT NULL CHECK (status_pembayaran IN ('LUNAS', 'SEBAGIAN', 'BELUM_LUNAS'))
);

-- 7. TABEL ITEM DETAIL FAKTUR (item_faktur)
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

-- 8. TABEL CICILAN / ANGSURAN PIUTANG (cicilan_piutang)
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

-- 9. TABEL AUDIT & MUTASI STOK GUDANG (mutasi_stok)
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
    jumlah_perubahan INT NOT NULL,
    stok_sebelum INT NOT NULL,
    stok_sesudah INT NOT NULL,
    catatan TEXT,
    penanggung_jawab VARCHAR(100) NOT NULL
);
```

## 🔌 5. Mengaktifkan Integrasi Database PostgreSQL di Perangkat

Server backend **`server.ts`** dan driver **`pg`** sudah terpasang dan siap digunakan! Anda hanya perlu menghubungkannya dengan database lokal:

1. **Buat file `.env` di folder proyek laptop Anda**:
   Buat file bernama `.env` sejajar dengan `package.json`, lalu isi:
   ```env
   # Ganti 'password_anda' dengan password postgres yang Anda buat saat instalasi
   DATABASE_URL=postgresql://postgres:password_anda@localhost:5432/tumin_db
   PORT=3000
   ```
2. **Jalankan aplikasi**:
   ```bash
   npm run dev
   ```
3. **Selesai!** 
   - Terminal akan menampilkan: `✅ [PostgreSQL] Sukses terhubung ke database tumin_db!`
   - Setiap transaksi kasir baru, penambahan produk, cicilan piutang, dan mutasi stok akan **otomatis tersimpan permanen ke dalam tabel database PostgreSQL Anda**.
   - *(Jika database sedang mati atau `.env` belum diisi, aplikasi tetap cerdas berjalan menggunakan mode offline lokal)*.

---
*TUMIN - Tino Underwear UMKM Integration · Bekasi Timur, Jawa Barat*

