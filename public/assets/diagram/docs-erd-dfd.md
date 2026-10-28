# Dokumentasi Perancangan Sistem: ERD & DFD
## Proyek Capstone: TUMIN (Tino Underwear Management & POS System)

Dokumen ini disusun untuk melengkapi laporan teknis dan pengujian Capstone Project, mencakup perancangan basis data relasional (**Entity Relationship Diagram - ERD**) dan pemodelan aliran data berjenjang (**Data Flow Diagram - DFD** Level 0 Context Diagram, Level 1, dan Level 2).

---

# BAGIAN 1: ENTITY RELATIONSHIP DIAGRAM (ERD)

## 1.1 Diagram Konseptual & Relasi (Mermaid Format)
*Catatan: Diagram di bawah ini akan otomatis dirender secara visual saat dibuka di GitHub.*

```mermaid
erDiagram
    pengguna {
        string id PK
        string username UK
        string nama_lengkap
        string email UK
        string peran "owner / kasir"
        string password
        string shift
        string no_telepon
        boolean aktif
        timestamp dibuat_pada
    }

    pengaturan_toko {
        int id PK
        string nama_toko
        string slogan
        string alamat
        string no_telepon
        string nama_bank
        string nomor_rekening
        string atas_nama_rekening
        string jam_operasional
        string pesan_kaki_struk
        timestamp diperbarui_pada
    }

    produk ||--o{ item_faktur : "dijual dalam"
    produk ||--o{ barang_konsinyasi : "didistribusikan ke"
    produk ||--o{ mutasi_stok : "dicatat riwayat"
    produk {
        string id PK
        string sku UK
        string nama_produk
        string kategori "CD Pria / CD Wanita / Anak / Korset"
        decimal harga_jual
        decimal harga_pokok_modal
        int stok
        int stok_minimum
        string satuan "Pcs / Lusin / Box"
        text deskripsi
        timestamp terakhir_diperbarui
    }

    mitra_seller ||--o{ faktur_penjualan : "memiliki transaksi kredit"
    mitra_seller ||--o{ barang_konsinyasi : "memegang stok titip"
    mitra_seller {
        string id PK
        string username UK
        string password
        string nama_pemilik
        string nama_toko
        string no_telepon
        string email
        text alamat
        string status "Pending / Aktif / Ditangguhkan"
        decimal limit_piutang
        decimal total_piutang_berjalan
        timestamp tanggal_transaksi_terakhir
        timestamp tanggal_daftar
        text catatan
    }

    barang_konsinyasi {
        string id PK
        string id_seller FK
        string id_produk FK
        string sku_produk
        string nama_produk
        int jumlah_stok_titip
        decimal harga_modal_satuan
        decimal harga_jual_anjuran
        timestamp tanggal_titip
    }

    faktur_penjualan ||--|{ item_faktur : "memuat rincian belanja"
    faktur_penjualan ||--o{ cicilan_piutang : "diangsur melalui"
    faktur_penjualan {
        string id PK
        string nomor_faktur UK
        timestamp tanggal
        string nama_kasir
        string metode_pembayaran "Tunai / Transfer Bank / Kredit"
        decimal subtotal
        decimal diskon
        decimal total_akhir
        decimal uang_diterima
        decimal uang_kembalian
        string nama_bank
        string nomor_referensi_transfer
        text foto_bukti_transfer
        string id_seller FK
        string nama_seller
        timestamp tanggal_jatuh_tempo
        decimal jumlah_terbayar
        decimal sisa_tagihan
        string status_pembayaran "LUNAS / SEBAGIAN / BELUM_LUNAS"
    }

    item_faktur {
        int id PK
        string id_faktur FK
        string id_produk FK
        string sku_produk
        string nama_produk
        int jumlah
        decimal harga_satuan
        decimal subtotal
    }

    cicilan_piutang {
        string id PK
        string id_faktur FK
        timestamp tanggal
        decimal nominal_cicilan
        string metode_pembayaran "Tunai / Transfer Bank"
        string dicatat_oleh
        text catatan
        text foto_bukti_transfer
    }

    mutasi_stok {
        string id PK
        timestamp tanggal
        string id_produk FK
        string sku_produk
        string nama_produk
        string jenis_mutasi "RESTOCK / PENJUALAN / KONSINYASI / OPNAME"
        int jumlah_perubahan
        int stok_sebelum
        int stok_sesudah
        text catatan
        string penanggung_jawab
    }
```

## 1.2 Kardinalitas dan Relasi Antar Entitas (Business Rules)
1. **`mitra_seller` ke `faktur_penjualan` (One-to-Many / 1 : N)**:
   - Satu mitra seller dapat memiliki banyak faktur penjualan tempo/kredit.
   - Satu faktur tempo hanya dimiliki oleh tepat satu mitra seller.
2. **`faktur_penjualan` ke `item_faktur` (One-to-Many / 1 : N)**:
   - Satu faktur penjualan memiliki satu atau lebih rincian barang belanjaan.
3. **`produk` ke `item_faktur` (One-to-Many / 1 : N)**:
   - Satu produk katalog dapat terjual berulang kali pada banyak transaksi.
4. **`faktur_penjualan` ke `cicilan_piutang` (One-to-Many / 1 : N)**:
   - Satu faktur tempo yang belum lunas dapat memiliki banyak riwayat catatan angsuran pembayaran hingga sisa saldo menjadi Rp 0.
5. **`mitra_seller` ke `barang_konsinyasi` (One-to-Many / 1 : N)**:
   - Satu mitra reseller dapat membawa banyak item titipan konsinyasi produk toko.
6. **`produk` ke `mutasi_stok` (One-to-Many / 1 : N)**:
   - Setiap perubahan stok produk (penjualan kasir, restock suplier, koreksi opname) mencatat kartu riwayat mutasi audit untuk integritas inventori.

---

# BAGIAN 2: DATA FLOW DIAGRAM (DFD)

Sistem Informasi & POS TUMIN dirancang untuk mengintegrasikan proses operasional toko fisik grosir/eceran pakaian dalam dengan pemantauan terpusat oleh pemilik (*Owner*).

## 2.1 Entitas Eksternal (External Entities / Terminator)
1. **Owner (Pemilik Toko)**: Memiliki hak akses penuh untuk mengelola harga dasar modal, penetapan limit kredit mitra, verifikasi persetujuan pendaftaran mitra seller via WhatsApp, konfigurasi toko, dan analisis laporan keuangan komprehensif.
2. **Kasir (Operator POS)**: Mengoperasikan modul transaksi kasir harian, melayani penjualan tunai/transfer/kredit tempo, menerima cicilan piutang seller, dan melakukan stok opname fisik.
3. **Mitra Seller (Reseller / Pembeli Grosir Tempo)**: Mengajukan formulir kemitraan, menerima konfirmasi akun yang disetujui dari Owner, mengambil stok barang konsinyasi/tempo, dan menyetor angsuran pelunasan.
4. **Pelanggan Umum (Customer Eceran)**: Melakukan transaksi pembelian langsung di meja kasir dan menerima struk belanja fisik/digital.

---

## 2.2 DFD Level 0 (Diagram Konteks / Context Diagram)

Diagram konteks menggambarkan batasan sistem (*system boundary*) secara garis besar dengan seluruh entitas luar yang berinteraksi.

```mermaid
flowchart TD
    %% Entitas Luar
    Owner([Owner / Pemilik Toko])
    Kasir([Kasir / Operator POS])
    Seller([Mitra Seller / Reseller])
    Customer([Pelanggan Umum])

    %% Sistem Pusat
    System((0.0<br/><b>SISTEM INFORMASI & POS TUMIN</b><br/>Tino Underwear Management))

    %% Aliran Data Owner
    Owner -->|Data Modal & Produk Baru, Limit Kredit, Persetujuan Akun, Profil Toko| System
    System -->|Laporan Laba Rugi, Kartu Stok, Rekap Piutang, Notifikasi Seller Pending| Owner

    %% Aliran Data Kasir
    Kasir -->|Input Keranjang Belanja, Uang Diterima, Pembayaran Cicilan, Koreksi Stok| System
    System -->|Info Validasi Harga & Stok, Cetak Struk Belanja, Status Limit Seller| Kasir

    %% Aliran Data Mitra Seller
    Seller -->|Formulir Registrasi Usaha, Konfirmasi Pembayaran Angsuran| System
    System -->|Kredensial Akun Disetujui via WA, Riwayat Faktur Tempo, Sisa Limit Kredit| Seller

    %% Aliran Data Pelanggan
    Customer -->|Uang Pembayaran Tunai / Bukti Transfer| System
    System -->|Struk Belanja Resmi & Pakaian Dalam Fisik| Customer
```

---

## 2.3 DFD Level 1 (Dekomposisi Proses Sistem)

Membagi sistem ke dalam 6 proses utama serta interaksinya dengan 4 kelompok Data Store (Penyimpanan Data).

```mermaid
flowchart LR
    %% Data Stores
    D1[(D1: Data Pengguna & Toko)]
    D2[(D2: Katalog Produk & Stok)]
    D3[(D3: Mitra Seller & Konsinyasi)]
    D4[(D4: Faktur Transaksi & Piutang)]

    %% Entitas
    Owner([Owner])
    Kasir([Kasir])
    Seller([Mitra Seller])
    Customer([Pelanggan])

    %% Proses-Proses
    P1((1.0<br/>Manajemen Autentikasi & Akun))
    P2((2.0<br/>Katalog Produk & Kontrol Stok))
    P3((3.0<br/>Registrasi & Verifikasi Mitra))
    P4((4.0<br/>Transaksi Kasir & Faktur POS))
    P5((5.0<br/>Buku Piutang & Pembayaran Angsuran))
    P6((6.0<br/>Pelaporan Penjualan & Keuangan))

    %% Relasi P1 (Autentikasi)
    Owner & Kasir & Seller -->|Input Username & Password| P1
    P1 <-->|Validasi Kredensial & Role| D1
    P1 -->|Sesi Akses Terotorisasi| Owner & Kasir & Seller

    %% Relasi P2 (Katalog Produk & Stok)
    Owner -->|Input Produk, Harga Pokok, Minimum Stok| P2
    Kasir -->|Update Stok Opname Fisik| P2
    P2 <-->|Baca & Tulis Mutasi Stok| D2
    P2 -->|Daftar Produk Aktif & Alert Stok Tipis| Kasir & Owner

    %% Relasi P3 (Pendaftaran Mitra)
    Seller -->|Form Registrasi: Nama Toko, No Telp, Alamat| P3
    P3 -->|Simpan Status Pending| D3
    D3 -->|Notifikasi Mitra Baru| P3
    P3 -->|Data Pengajuan Kemitraan| Owner
    Owner -->|Persetujuan Approval & Penentuan Limit| P3
    P3 -->|Kirim Akun & Sandi via WA / Telepon| Seller
    P3 -->|Update Status Aktif| D3

    %% Relasi P4 (Transaksi POS)
    Customer & Seller -->|Item Belanjaan & Pilihan Bayar| P4
    P4 <-->|Periksa Stok & Kurangi Kuantitas| D2
    P4 <-->|Cek Limit Kredit & Status Mitra| D3
    P4 -->|Simpan Faktur Baru & Item Faktur| D4
    P4 -->|Cetak Struk Transaksi| Customer & Kasir

    %% Relasi P5 (Piutang & Angsuran)
    Seller -->|Setoran Cicilan & Bukti Transfer| P5
    Kasir -->|Input Pembayaran Angsuran Piutang| P5
    P5 <-->|Update Saldo Piutang & Status Faktur| D4
    P5 <-->|Update Total Piutang Berjalan Mitra| D3
    P5 -->|Kuitansi Angsuran & Rekap Sisa Tagihan| Seller & Kasir

    %% Relasi P6 (Laporan & Audit)
    D2 & D3 & D4 -->|Agregasi Data Transaksi, Stok & Piutang| P6
    P6 -->|Laporan Omzet Harian, Laba Bersih, Buku Piutang, Performa Produk| Owner
```

---

## 2.4 DFD Level 2 (Rincian Proses Kritis)

### A. DFD Level 2 - Proses 3.0: Registrasi & Verifikasi Mitra Seller
```mermaid
flowchart TD
    Seller([Mitra Seller])
    Owner([Owner Toko])
    D3[(D3: mitra_seller)]

    P31((3.1<br/>Penerimaan Formulir Pendaftaran))
    P32((3.2<br/>Verifikasi Kelaikan & Limit Piutang))
    P33((3.3<br/>Aktivasi Akun & Kontak WhatsApp))

    Seller -->|Isi Nama, Toko, No HP, Alamat, Usulan User/Pass| P31
    P31 -->|Simpan Data Status 'Pending'| D3

    D3 -->|Tampilkan Daftar Pengajuan Antrean| P32
    Owner -->|Review Profil, Tentukan Limit Kredit (Rp)| P32

    P32 -->|Keputusan Approval Disetujui| P33
    P33 -->|Update Status 'Aktif' di Database| D3
    P33 -->|Hubungi Seller via WA dengan Format Pesan Akun Siap Pakai| Seller
```

### B. DFD Level 2 - Proses 4.0: Transaksi Kasir POS
```mermaid
flowchart TD
    Kasir([Kasir])
    Pelanggan([Pelanggan / Seller])
    D2[(D2: Produk)]
    D3[(D3: Mitra Seller)]
    D4[(D4: Faktur)]

    P41((4.1<br/>Pemindaian / Pemilihan Produk))
    P42((4.2<br/>Validasi Metode Pembayaran))
    P43((4.3<br/>Penerbitan Struk & Mutasi Otomatis))

    Kasir -->|Input SKU / Barcode / Pilih Item| P41
    D2 -->|Ambil Data Harga Jual & Cek Stok| P41
    P41 -->|Hitung Subtotal, Diskon & Total Akhir| P42

    Pelanggan -->|Pilih: Tunai / Transfer / Tempo Kredit| P42
    P42 <-->|Jika Kredit: Cek Limit & Sisa Piutang| D3
    P42 -->|Validasi Sukses| P43

    P43 -->|Kurangi Stok & Catat Log Mutasi Penjualan| D2
    P43 -->|Simpan Record Faktur ke Tabel| D4
    P43 -->|Cetak / Bagikan Struk Belanja| Pelanggan
```

---

## 2.5 Kamus Data (Data Dictionary) Utama
* **Data Arus `Form_Registrasi_Seller`**: `nama_pemilik + nama_toko + no_telepon + alamat + usulan_username + usulan_password`
* **Data Arus `Faktur_Penjualan`**: `nomor_faktur + tanggal + nama_kasir + metode_bayar + {item_produk + kuantitas + harga_satuan + subtotal} + diskon + total_akhir + status_lunas`
* **Data Arus `Bukti_Angsuran_Piutang`**: `id_faktur + tanggal_bayar + nominal_cicilan + metode_bayar + dicatat_oleh + sisa_saldo_terbaru`
* **Data Arus `Laporan_Keuangan`**: `periode_tanggal + total_omzet_kotor + total_hpp_modal + laba_kotor + total_piutang_berjalan + stok_aset_tersedia`

---
*Dokumen ini merupakan bagian dari berkas arsitektur proyek Capstone TUMIN (Tino Underwear Management & POS System).*
