import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Download,
  FileText,
  ExternalLink,
  ClipboardCheck,
  AlertTriangle,
  Plus,
  SlidersHorizontal,
  X,
  CheckCircle2,
  Package,
  Printer,
} from 'lucide-react';

export interface StockHistoryItem {
  id: string;
  tanggal: string; // e.g. "08 Okt 2026"
  sku: string; // e.g. "TU-CDP-01"
  namaProduk: string; // e.g. "CD Pria Boxer (Ukuran L)"
  tipe: 'Barang Masuk' | 'Barang Keluar' | 'Opname / Return';
  qty: number; // e.g. +50, -5, -2
  stokAkhir: number; // e.g. 93
  keterangan: string; // e.g. "Restock dari supplier utama"
  // Detail attributes for action modal
  referenceNumber?: string;
  partner?: string; // Supplier / Kasir / Auditor
  details?: {
    item: string;
    qty: number;
    notes?: string;
    unitPrice?: number;
  }[];
  auditStatus?: 'Approved' | 'Pending Review' | 'Verified';
}

// Initial 48 realistic entries, starting with the exact 3 rows requested
const INITIAL_HISTORY_DATA: StockHistoryItem[] = [
  {
    id: 'hist-01',
    tanggal: '08 Okt 2026',
    sku: 'TU-CDP-01',
    namaProduk: 'CD Pria Boxer (Ukuran L)',
    tipe: 'Barang Masuk',
    qty: 50,
    stokAkhir: 93,
    keterangan: 'Restock dari supplier utama',
    referenceNumber: 'SJ-KNV-202610-092',
    partner: 'Konveksi Sentosa Bandung',
    details: [
      { item: 'CD Pria Boxer Seamless Bamboo (L)', qty: 50, unitPrice: 16500, notes: 'Kualitas A, jahitan rapi' },
    ],
    auditStatus: 'Verified',
  },
  {
    id: 'hist-02',
    tanggal: '07 Okt 2026',
    sku: 'TU-CDW-03',
    namaProduk: 'CD Wanita High-Waist (Ukuran M)',
    tipe: 'Barang Keluar',
    qty: -5,
    stokAkhir: 12,
    keterangan: 'Penjualan Kasir #INV-0087',
    referenceNumber: '#INV-0087',
    partner: 'Kasir Siti Nurhaliza (POS Shift Pagi)',
    details: [
      { item: 'CD Wanita High-Waist Tummy Control (M)', qty: 5, unitPrice: 35000, notes: 'Pembayaran Tunai Lunas' },
    ],
    auditStatus: 'Approved',
  },
  {
    id: 'hist-03',
    tanggal: '05 Okt 2026',
    sku: 'TU-CDA-01',
    namaProduk: 'CD Anak Laki (Ukuran S)',
    tipe: 'Opname / Return',
    qty: -2,
    stokAkhir: 24,
    keterangan: 'Barang cacat, disisihkan',
    referenceNumber: 'BA-OPN-202610-05',
    partner: 'Audit Opname Fisik Gudang (Pak Tino)',
    details: [
      { item: 'CD Anak Laki-Laki Motif Kartun (S)', qty: 2, notes: 'Karet pinggang kendur, reject produksi' },
    ],
    auditStatus: 'Approved',
  },
  // Additional realistic entries to fulfill the 48 total items
  {
    id: 'hist-04',
    tanggal: '04 Okt 2026',
    sku: 'TU-CDP-02',
    namaProduk: 'CD Pria Brief Sporty Katun',
    tipe: 'Barang Masuk',
    qty: 35,
    stokAkhir: 45,
    keterangan: 'Restock batch mingguan supplier',
    referenceNumber: 'SJ-KNV-202610-081',
    partner: 'CV Rajut Sejahtera Solo',
    details: [{ item: 'CD Pria Brief Katun Sporty', qty: 35, unitPrice: 34000 }],
    auditStatus: 'Verified',
  },
  {
    id: 'hist-05',
    tanggal: '04 Okt 2026',
    sku: 'TU-CDW-01',
    namaProduk: 'CD Wanita Katun Renda Halus',
    tipe: 'Barang Keluar',
    qty: -15,
    stokAkhir: 35,
    keterangan: 'Pengiriman Barang Tempo ke Toko Budi Jaya',
    referenceNumber: 'SJ-MITRA-001',
    partner: 'Mitra: Budi Santoso (Toko Budi Jaya)',
    details: [{ item: 'CD Wanita Katun Renda Halus', qty: 15, unitPrice: 22000 }],
    auditStatus: 'Approved',
  },
  {
    id: 'hist-06',
    tanggal: '03 Okt 2026',
    sku: 'TU-CDP-03',
    namaProduk: 'CD Pria Segitiga Classic',
    tipe: 'Barang Keluar',
    qty: -10,
    stokAkhir: 62,
    keterangan: 'Penjualan Kasir #INV-0079',
    referenceNumber: '#INV-0079',
    partner: 'Kasir Siti Nurhaliza',
    details: [{ item: 'CD Pria Segitiga Classic', qty: 10, unitPrice: 18000 }],
    auditStatus: 'Approved',
  },
  {
    id: 'hist-07',
    tanggal: '02 Okt 2026',
    sku: 'TU-KOR-01',
    namaProduk: 'Korset Pelangsing 4-Steel Bone',
    tipe: 'Barang Masuk',
    qty: 20,
    stokAkhir: 22,
    keterangan: 'Restock kiriman import supplier',
    referenceNumber: 'SJ-IMP-202610-019',
    partner: 'Tex Indo Logistics Cikarang',
    details: [{ item: 'Korset Pelangsing 4-Steel Bone', qty: 20, unitPrice: 52000 }],
    auditStatus: 'Verified',
  },
  {
    id: 'hist-08',
    tanggal: '01 Okt 2026',
    sku: 'TU-CDW-02',
    namaProduk: 'CD Wanita Seamless Anti-Nyeplak',
    tipe: 'Opname / Return',
    qty: -3,
    stokAkhir: 5,
    keterangan: 'Koreksi fisik stock opname awal bulan',
    referenceNumber: 'BA-OPN-202610-01',
    partner: 'Pak Tino (Owner)',
    details: [{ item: 'CD Wanita Seamless Anti-Nyeplak', qty: 3, notes: 'Selisih hitung display etalase' }],
    auditStatus: 'Approved',
  },
  {
    id: 'hist-09',
    tanggal: '30 Sep 2026',
    sku: 'TU-CDP-01',
    namaProduk: 'CD Pria Boxer (Ukuran L)',
    tipe: 'Barang Keluar',
    qty: -20,
    stokAkhir: 43,
    keterangan: 'Konsinyasi Barang Tempo Grosir Maryam',
    referenceNumber: 'SJ-MITRA-002',
    partner: 'Hajjah Maryam (Grosir Maryam)',
    details: [{ item: 'CD Pria Boxer', qty: 20, unitPrice: 28000 }],
    auditStatus: 'Approved',
  },
  {
    id: 'hist-10',
    tanggal: '29 Sep 2026',
    sku: 'TU-CDA-02',
    namaProduk: 'CD Anak Perempuan Boxer Renda (Isi 3)',
    tipe: 'Barang Masuk',
    qty: 15,
    stokAkhir: 33,
    keterangan: 'Restock barang jadi konveksi',
    referenceNumber: 'SJ-KNV-202609-140',
    partner: 'Konveksi Sentosa Bandung',
    details: [{ item: 'CD Anak Perempuan Boxer Renda (Isi 3)', qty: 15, unitPrice: 24000 }],
    auditStatus: 'Verified',
  },
  // Auto-generate further entries up to 48
  ...Array.from({ length: 38 }, (_, index) => {
    const day = (28 - (index % 25)).toString().padStart(2, '0');
    const types: ('Barang Masuk' | 'Barang Keluar' | 'Opname / Return')[] = [
      'Barang Masuk',
      'Barang Keluar',
      'Barang Keluar',
      'Opname / Return',
    ];
    const pickedType = types[index % types.length];
    const skus = ['TU-CDP-01', 'TU-CDP-02', 'TU-CDW-01', 'TU-CDW-02', 'TU-CDA-01', 'TU-KOR-01'];
    const names = [
      'CD Pria Boxer Seamless',
      'CD Pria Brief Sporty',
      'CD Wanita Katun Renda',
      'CD Wanita Seamless Mid-Waist',
      'CD Anak Laki Katun',
      'Korset Pelangsing 4-Bone',
    ];
    const itemIndex = index % skus.length;
    const qtyVal = pickedType === 'Barang Masuk' ? 10 + (index % 5) * 5 : -(2 + (index % 4) * 2);

    return {
      id: `hist-gen-${index + 11}`,
      tanggal: `${day} Sep 2026`,
      sku: skus[itemIndex],
      namaProduk: names[itemIndex],
      tipe: pickedType,
      qty: qtyVal,
      stokAkhir: 20 + ((index * 7) % 65),
      keterangan:
        pickedType === 'Barang Masuk'
          ? `Penerimaan restok surat jalan #SJ-202609-${100 + index}`
          : pickedType === 'Barang Keluar'
          ? `Penjualan Kasir POS #INV-202609-${200 + index}`
          : `Penyesuaian audit opname fisik rak gudang`,
      referenceNumber:
        pickedType === 'Barang Masuk'
          ? `SJ-202609-${100 + index}`
          : pickedType === 'Barang Keluar'
          ? `#INV-00${index + 10}`
          : `BA-OPN-202609-${index + 1}`,
      partner:
        pickedType === 'Barang Masuk'
          ? 'Konveksi Sentosa'
          : pickedType === 'Barang Keluar'
          ? 'Kasir Siti'
          : 'Pak Tino (Owner)',
      auditStatus: 'Approved' as const,
    };
  }),
];

export const StockControl: React.FC = () => {
  const { products, adjustStock, restockProduct } = useApp();

  // History dataset state
  const [historyData, setHistoryData] = useState<StockHistoryItem[]>(INITIAL_HISTORY_DATA);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Semua Pergerakan');

  // Pagination state: default 3 items per page so the 3 requested items show on page 1, with 16 pages = 48 entries total!
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Selected Action Modal states
  const [selectedIncomingModal, setSelectedIncomingModal] = useState<StockHistoryItem | null>(null);
  const [selectedOutgoingModal, setSelectedOutgoingModal] = useState<StockHistoryItem | null>(null);
  const [selectedOpnameModal, setSelectedOpnameModal] = useState<StockHistoryItem | null>(null);

  // Top Action Modals
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Form states for "+ Catat Barang Masuk"
  const [formSku, setFormSku] = useState('TU-CDP-01');
  const [formQty, setFormQty] = useState(50);
  const [formSupplier, setFormSupplier] = useState('Konveksi Sentosa Bandung');
  const [formReference, setFormReference] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Form states for "Penyesuaian Manual"
  const [adjSku, setAdjSku] = useState('TU-CDP-01');
  const [adjType, setAdjType] = useState<'Kurang' | 'Tambah'>('Kurang');
  const [adjQty, setAdjQty] = useState(2);
  const [adjReason, setAdjReason] = useState('Barang cacat produksi, disisihkan');

  // Filtered History
  const filteredData = useMemo(() => {
    return historyData.filter((item) => {
      const matchSearch =
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.namaProduk.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keterangan.toLowerCase().includes(searchQuery.toLowerCase());

      const matchFilter =
        selectedFilter === 'Semua Pergerakan' ||
        item.tipe === selectedFilter;

      return matchSearch && matchFilter;
    });
  }, [historyData, searchQuery, selectedFilter]);

  // Pagination calculations
  const totalEntries = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * itemsPerPage;
  const currentEntries = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // Handle "+ Catat Barang Masuk" submit
  const handleCatatBarangMasuk = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct = products.find((p) => p.sku === formSku) || products[0];
    const newStock = (targetProduct?.stock || 45) + formQty;

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newEntry: StockHistoryItem = {
      id: 'hist-' + Date.now(),
      tanggal: todayStr,
      sku: targetProduct?.sku || formSku,
      namaProduk: targetProduct?.name || 'CD Pria Boxer (Ukuran L)',
      tipe: 'Barang Masuk',
      qty: formQty,
      stokAkhir: newStock,
      keterangan: formNotes || `Restok dari ${formSupplier}`,
      referenceNumber: formReference || `SJ-KNV-${Date.now().toString().slice(-4)}`,
      partner: formSupplier,
      details: [{ item: targetProduct?.name || formSku, qty: formQty, notes: formNotes }],
      auditStatus: 'Verified',
    };

    setHistoryData([newEntry, ...historyData]);
    if (targetProduct) {
      restockProduct(targetProduct.id, formQty, formNotes, formSupplier);
    }

    setIsRestockModalOpen(false);
    setFormNotes('');
    setFormReference('');
  };

  // Handle "Penyesuaian Manual" submit
  const handlePenyesuaianManual = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct = products.find((p) => p.sku === adjSku) || products[0];
    const change = adjType === 'Tambah' ? adjQty : -adjQty;
    const newStock = Math.max(0, (targetProduct?.stock || 45) + change);

    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    const newEntry: StockHistoryItem = {
      id: 'hist-' + Date.now(),
      tanggal: todayStr,
      sku: targetProduct?.sku || adjSku,
      namaProduk: targetProduct?.name || 'CD Pria Boxer',
      tipe: 'Opname / Return',
      qty: change,
      stokAkhir: newStock,
      keterangan: adjReason || 'Penyesuaian stock opname manual',
      referenceNumber: `BA-OPN-${Date.now().toString().slice(-4)}`,
      partner: 'Pak Tino (Owner)',
      details: [{ item: targetProduct?.name || adjSku, qty: Math.abs(change), notes: adjReason }],
      auditStatus: 'Approved',
    };

    setHistoryData([newEntry, ...historyData]);
    if (targetProduct) {
      adjustStock(targetProduct.id, newStock, adjReason);
    }

    setIsAdjustModalOpen(false);
    setAdjReason('');
  };

  // Handle CSV Download
  const handleDownloadCSV = () => {
    const headers = ['TANGGAL', 'SKU', 'NAMA PRODUK', 'TIPE', 'QTY', 'STOK AKHIR', 'KETERANGAN'];
    const rows = historyData.map((d) => [
      `"${d.tanggal}"`,
      `"${d.sku}"`,
      `"${d.namaProduk}"`,
      `"${d.tipe}"`,
      `"${d.qty > 0 ? '+' : ''}${d.qty}"`,
      `"${d.stokAkhir} pcs"`,
      `"${d.keterangan}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Histori_Pergerakan_Stok_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ================= 2. HEADER & TOMBOL AKSI ================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Kontrol Stok &amp; Histori
            </h1>
            <span className="bg-green-100 text-green-700 font-semibold text-xs px-2 py-0.5 rounded">
              LIVE AUDIT
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Pantau pergerakan barang masuk, keluar, dan penyesuaian opname.
          </p>
        </div>

        {/* Tombol Aksi Kanan Atas */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Tombol outline "Penyesuaian Manual" */}
          <button
            type="button"
            onClick={() => setIsAdjustModalOpen(true)}
            className="px-3.5 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <SlidersHorizontal className="w-4 h-4 text-gray-500" />
            <span>Penyesuaian Manual</span>
          </button>

          {/* Tombol primary hijau "+ Catat Barang Masuk" */}
          <button
            type="button"
            onClick={() => setIsRestockModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Barang Masuk</span>
          </button>
        </div>
      </div>

      {/* ================= 2. 4 SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card a: BARANG MASUK */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              BARANG MASUK
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-teal-600 mt-2 font-mono-num">
              +120 pcs
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Peningkatan restock gudang.
          </p>
        </div>

        {/* Card b: BARANG KELUAR */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              BARANG KELUAR
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2 font-mono-num">
              -85 pcs
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Total penjualan &amp; transfer.
          </p>
        </div>

        {/* Card c: PERINGATAN STOK MENIPIS */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
                PERINGATAN STOK MENIPIS
              </span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-600 mt-2 font-mono-num">
              4 SKU
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Perlu pengadaan segera.
          </p>
        </div>

        {/* Card d: OPNAME TERAKHIR */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              OPNAME TERAKHIR
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
              2 Hari Lalu
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selisih 2 item dicatat.
          </p>
        </div>
      </div>

      {/* ================= 3. KONTEN UTAMA - TABEL HISTORI ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Bagian Filter */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto flex-1 max-w-xl">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari histori SKU atau produk..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-teal-600 focus:bg-white text-gray-900 transition-colors"
              />
            </div>

            {/* Dropdown Filter: Semua Pergerakan */}
            <div className="shrink-0">
              <select
                value={selectedFilter}
                onChange={(e) => {
                  setSelectedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="text-xs sm:text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
              >
                <option value="Semua Pergerakan">Filter: Semua Pergerakan</option>
                <option value="Barang Masuk">Barang Masuk</option>
                <option value="Barang Keluar">Barang Keluar</option>
                <option value="Opname / Return">Opname / Return</option>
              </select>
            </div>
          </div>

          {/* Tombol Icon Download */}
          <button
            type="button"
            onClick={handleDownloadCSV}
            title="Download Data Histori (CSV)"
            className="p-2 border border-gray-300 rounded-lg text-gray-600 hover:text-teal-600 hover:bg-gray-50 transition-colors cursor-pointer shrink-0 ml-auto sm:ml-0"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>

        {/* Tabel Data Histori */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 font-semibold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-4">TANGGAL</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">NAMA PRODUK</th>
                <th className="py-3 px-4">TIPE</th>
                <th className="py-3 px-4 text-right">QTY</th>
                <th className="py-3 px-4 text-right">STOK AKHIR</th>
                <th className="py-3 px-4">KETERANGAN</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentEntries.map((row) => {
                // Badge Tipe
                let badgeElem = (
                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {row.tipe}
                  </span>
                );
                if (row.tipe === 'Barang Masuk') {
                  badgeElem = (
                    <span className="inline-block bg-green-100 text-green-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      Barang Masuk
                    </span>
                  );
                } else if (row.tipe === 'Barang Keluar') {
                  badgeElem = (
                    <span className="inline-block bg-yellow-100 text-yellow-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      Barang Keluar
                    </span>
                  );
                } else if (row.tipe === 'Opname / Return') {
                  badgeElem = (
                    <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2.5 py-0.5 rounded-full font-medium">
                      Opname / Return
                    </span>
                  );
                }

                // Qty Color
                const qtyText = row.qty > 0 ? `+${row.qty}` : `${row.qty}`;
                let qtyColorClass = 'text-gray-900';
                if (row.qty > 0) {
                  qtyColorClass = 'text-teal-600 font-bold';
                } else if (row.tipe === 'Barang Keluar') {
                  qtyColorClass = 'text-amber-600 font-bold';
                } else if (row.tipe === 'Opname / Return') {
                  qtyColorClass = 'text-purple-600 font-bold';
                }

                return (
                  <tr key={row.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* TANGGAL */}
                    <td className="py-3 px-4 font-mono-num text-gray-600 whitespace-nowrap">
                      {row.tanggal}
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-4 font-mono-num font-semibold text-teal-700 whitespace-nowrap">
                      {row.sku}
                    </td>

                    {/* NAMA PRODUK */}
                    <td className="py-3 px-4 font-medium text-gray-900 max-w-[200px] truncate" title={row.namaProduk}>
                      {row.namaProduk}
                    </td>

                    {/* TIPE */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {badgeElem}
                    </td>

                    {/* QTY */}
                    <td className={`py-3 px-4 text-right font-mono-num ${qtyColorClass} whitespace-nowrap`}>
                      {qtyText}
                    </td>

                    {/* STOK AKHIR */}
                    <td className="py-3 px-4 text-right font-mono-num font-medium text-gray-900 whitespace-nowrap">
                      {row.stokAkhir} pcs
                    </td>

                    {/* KETERANGAN */}
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate" title={row.keterangan}>
                      {row.keterangan}
                    </td>

                    {/* ================= 4. LOGIKA KOLOM AKSI (CRUCIAL) ================= */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {row.tipe === 'Barang Masuk' && (
                        <button
                          type="button"
                          onClick={() => setSelectedIncomingModal(row)}
                          title="Lihat Detail Surat Jalan/Faktur Pembelian"
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}

                      {row.tipe === 'Barang Keluar' && (
                        <button
                          type="button"
                          onClick={() => setSelectedOutgoingModal(row)}
                          title="Lihat Struk Penjualan POS / Track Pengiriman"
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      )}

                      {row.tipe === 'Opname / Return' && (
                        <button
                          type="button"
                          onClick={() => setSelectedOpnameModal(row)}
                          title="Lihat Berita Acara & Approve/Reject Opname"
                          className="p-1.5 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <ClipboardCheck className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state if search finds nothing */}
        {currentEntries.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">Tidak ada histori yang cocok</p>
            <p className="text-xs text-gray-400">Silakan ubah kata kunci pencarian atau opsi filter.</p>
          </div>
        )}

        {/* ================= 5. FOOTER TABEL ================= */}
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
          {/* Teks info */}
          <div className="text-gray-500">
            Menampilkan {currentEntries.length} dari {totalEntries} entri pergerakan stok
          </div>

          {/* Komponen Pagination: "Sebelumnya", "1", "2", "3", "...", "16", "Berikutnya" */}
          <div className="flex items-center gap-1 font-medium">
            <button
              type="button"
              disabled={validCurrentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
                validCurrentPage === 1
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              Sebelumnya
            </button>

            {/* Page 1 (Aktif hijau/teal jika di page 1) */}
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                validCurrentPage === 1
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              1
            </button>

            {/* Page 2 */}
            <button
              type="button"
              onClick={() => setCurrentPage(2)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                validCurrentPage === 2
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              2
            </button>

            {/* Page 3 */}
            <button
              type="button"
              onClick={() => setCurrentPage(3)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                validCurrentPage === 3
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              3
            </button>

            {/* Ellipsis "..." */}
            <span className="px-2 py-1 text-gray-400 text-xs">...</span>

            {/* Page 16 */}
            <button
              type="button"
              onClick={() => setCurrentPage(16)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                validCurrentPage === 16
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              16
            </button>

            {/* Berikutnya */}
            <button
              type="button"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className={`px-3 py-1.5 rounded-md border text-xs transition-colors ${
                validCurrentPage >= totalPages
                  ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* ================= MODAL 1: DETAIL SURAT JALAN / FAKTUR PEMBELIAN (Barang Masuk) ================= */}
      {selectedIncomingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-700" />
                <div>
                  <h3 className="font-bold text-sm text-gray-900">
                    Detail Surat Jalan &amp; Faktur Pembelian
                  </h3>
                  <p className="text-[11px] text-teal-800 font-mono-num font-semibold">
                    {selectedIncomingModal.referenceNumber || 'SJ-KNV-202610-092'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncomingModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">TANGGAL MASUK</span>
                  <span className="font-bold text-gray-900">{selectedIncomingModal.tanggal}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">SUPPLIER / KONVEKSI</span>
                  <span className="font-bold text-teal-800">{selectedIncomingModal.partner || 'Konveksi Sentosa'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">STATUS VERIFIKASI</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Telah Diverifikasi Gudang
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">PENERIMA FISIK</span>
                  <span className="font-medium text-gray-800">Pak Tino (Owner)</span>
                </div>
              </div>

              {/* Rincian Barang */}
              <div>
                <h4 className="font-bold text-gray-900 text-xs mb-2">Item Barang Diterima:</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-600">
                      <tr>
                        <th className="p-2.5">Produk</th>
                        <th className="p-2.5 text-right">Jumlah</th>
                        <th className="p-2.5 text-right">Stok Gudang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-2.5">
                          <p className="font-semibold text-gray-900">{selectedIncomingModal.namaProduk}</p>
                          <p className="text-[11px] font-mono-num text-teal-700">{selectedIncomingModal.sku}</p>
                        </td>
                        <td className="p-2.5 text-right font-mono-num font-bold text-teal-600">
                          +{selectedIncomingModal.qty} pcs
                        </td>
                        <td className="p-2.5 text-right font-mono-num font-bold text-gray-900">
                          {selectedIncomingModal.stokAkhir} pcs
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-[11px] text-gray-500 font-semibold block">Catatan Surat Jalan:</span>
                <p className="text-xs text-gray-800 mt-0.5">{selectedIncomingModal.keterangan}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setSelectedIncomingModal(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Dokumen Surat Jalan telah dicetak.');
                    setSelectedIncomingModal(null);
                  }}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Berkas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: STRUK PENJUALAN POS & TRACK PENGIRIMAN (Barang Keluar) ================= */}
      {selectedOutgoingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-amber-700" />
                <div>
                  <h3 className="font-bold text-sm text-gray-900">
                    Struk Penjualan Kasir POS / Track Pengiriman
                  </h3>
                  <p className="text-[11px] text-amber-800 font-mono-num font-semibold">
                    {selectedOutgoingModal.referenceNumber || '#INV-0087'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOutgoingModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">WAKTU TRANSAKSI</span>
                  <span className="font-bold text-gray-900">{selectedOutgoingModal.tanggal}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">KASIR / TUJUAN</span>
                  <span className="font-bold text-gray-900">{selectedOutgoingModal.partner || 'Kasir Toko'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">STATUS TRACKING</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Selesai / Diserahkan
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">SALDO STOK SETELAH KELUAR</span>
                  <span className="font-bold text-gray-900">{selectedOutgoingModal.stokAkhir} pcs</span>
                </div>
              </div>

              {/* Rincian Barang Keluar */}
              <div>
                <h4 className="font-bold text-gray-900 text-xs mb-2">Item Barang Dikeluarkan:</h4>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-600">
                      <tr>
                        <th className="p-2.5">Produk</th>
                        <th className="p-2.5 text-right">Pengurangan</th>
                        <th className="p-2.5 text-right">Sisa Stok</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-2.5">
                          <p className="font-semibold text-gray-900">{selectedOutgoingModal.namaProduk}</p>
                          <p className="text-[11px] font-mono-num text-teal-700">{selectedOutgoingModal.sku}</p>
                        </td>
                        <td className="p-2.5 text-right font-mono-num font-bold text-amber-600">
                          {selectedOutgoingModal.qty} pcs
                        </td>
                        <td className="p-2.5 text-right font-mono-num font-bold text-gray-900">
                          {selectedOutgoingModal.stokAkhir} pcs
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-[11px] text-gray-500 font-semibold block">Catatan Referensi:</span>
                <p className="text-xs text-gray-800 mt-0.5">{selectedOutgoingModal.keterangan}</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setSelectedOutgoingModal(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: BERITA ACARA & APPROVE/REJECT OPNAME (Opname / Return) ================= */}
      {selectedOpnameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-purple-700" />
                <div>
                  <h3 className="font-bold text-sm text-gray-900">
                    Berita Acara &amp; Audit Penyesuaian Opname
                  </h3>
                  <p className="text-[11px] text-purple-800 font-mono-num font-semibold">
                    {selectedOpnameModal.referenceNumber || 'BA-OPN-202610-05'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpnameModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">TANGGAL AUDIT</span>
                  <span className="font-bold text-gray-900">{selectedOpnameModal.tanggal}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">AUDITOR / PETUGAS</span>
                  <span className="font-bold text-purple-900">{selectedOpnameModal.partner || 'Pak Tino (Owner)'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">STATUS APPROVAL OWNER</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-purple-800">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Disetujui (Approved)
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">STOK FISIK AKHIR</span>
                  <span className="font-bold text-gray-900">{selectedOpnameModal.stokAkhir} pcs</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 text-xs mb-2">Item yang Disesuaikan / Di-return:</h4>
                <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-bold text-gray-900">
                    <span>{selectedOpnameModal.namaProduk}</span>
                    <span className="font-mono-num text-purple-700">{selectedOpnameModal.qty} pcs</span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-mono-num">{selectedOpnameModal.sku}</p>
                  <p className="text-xs text-gray-700 pt-1 border-t border-purple-100">
                    Alasan: <span className="font-medium">{selectedOpnameModal.keterangan}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setSelectedOpnameModal(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    alert('Berita Acara Opname telah disetujui & diverifikasi oleh Owner.');
                    setSelectedOpnameModal(null);
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg text-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Berita Acara
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: + CATAT BARANG MASUK ================= */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-teal-50 border-b border-teal-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-700" />
                <h3 className="font-bold text-sm text-gray-900">
                  Catat Penerimaan Barang Masuk (Restock)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCatatBarangMasuk} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-xs">
                  Pilih Produk Pakaian Dalam *
                </label>
                <select
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-teal-600 text-gray-900"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.sku}>
                      {p.sku} - {p.name} (Stok: {p.stock} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-xs">
                    Jumlah Masuk (pcs) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formQty}
                    onChange={(e) => setFormQty(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono-num font-bold text-gray-900 focus:outline-none focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1 text-xs">
                    Supplier / Konveksi
                  </label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-xs">
                  No. Surat Jalan / Faktur Pembelian
                </label>
                <input
                  type="text"
                  placeholder="Contoh: SJ-KNV-202610-095"
                  value={formReference}
                  onChange={(e) => setFormReference(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-teal-600 font-mono-num"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-xs">
                  Keterangan / Catatan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Restock dari supplier utama kain katun"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsRestockModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-xs shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Simpan Barang Masuk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PENYESUAIAN MANUAL ================= */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
            <div className="p-4 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gray-700" />
                <h3 className="font-bold text-sm text-gray-900">
                  Penyesuaian Manual &amp; Koreksi Opname
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePenyesuaianManual} className="p-5 space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-xs">
                  Pilih Produk yang Disesuaikan *
                </label>
                <select
                  value={adjSku}
                  onChange={(e) => setAdjSku(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-teal-600 text-gray-900"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.sku}>
                      {p.sku} - {p.name} (Stok: {p.stock} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-xs">
                  Jenis Penyesuaian *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjType('Kurang')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      adjType === 'Kurang'
                        ? 'bg-purple-100 text-purple-900 border-purple-400'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Pengurangan (Cacat / Hilang)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjType('Tambah')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border ${
                      adjType === 'Tambah'
                        ? 'bg-teal-100 text-teal-900 border-teal-400'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    Penambahan (Surplus Opname)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-xs">
                  Jumlah Perubahan (pcs) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjQty}
                  onChange={(e) => setAdjQty(Math.max(1, parseInt(e.target.value) || 0))}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono-num font-bold text-gray-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-xs">
                  Alasan &amp; Keterangan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Barang cacat, disisihkan"
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-xs shadow-sm flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
