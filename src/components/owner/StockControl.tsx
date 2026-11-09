import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Download,
  FileText,
  ExternalLink,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  SlidersHorizontal,
  X,
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
}

export const StockControl: React.FC = () => {
  const { products, adjustStock, restockProduct, stockMutations } = useApp();

  const historyData = useMemo<StockHistoryItem[]>(() => stockMutations.map((mutation) => ({
    id: mutation.id,
    tanggal: new Date(mutation.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    sku: mutation.productSku,
    namaProduk: mutation.productName,
    tipe: mutation.type === 'RESTOCK' ? 'Barang Masuk' : (mutation.type === 'PENJUALAN' || mutation.type === 'KONSINYASI_KELUAR' ? 'Barang Keluar' : 'Opname / Return'),
    qty: mutation.change,
    stokAkhir: mutation.finalStock,
    keterangan: mutation.notes || mutation.type,
    referenceNumber: mutation.reference,
    partner: mutation.performedBy,
  })), [stockMutations]);
  const totalIncoming = stockMutations.filter((item) => item.change > 0).reduce((sum, item) => sum + item.change, 0);
  const totalOutgoing = stockMutations.filter((item) => item.change < 0).reduce((sum, item) => sum + item.change, 0);
  const lowStockCount = products.filter((product) => product.stock <= product.minStock).length;
  const lastOpname = stockMutations.find((item) => item.type === 'OPNAME_KOREKSI' || item.type === 'RUSAK_REJECT');

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Semua Pergerakan');

  // Pagination state based on the actual number of stock movement records.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Selected Action Modal states
  const [selectedIncomingModal, setSelectedIncomingModal] = useState<StockHistoryItem | null>(null);
  const [selectedOutgoingModal, setSelectedOutgoingModal] = useState<StockHistoryItem | null>(null);
  const [selectedOpnameModal, setSelectedOpnameModal] = useState<StockHistoryItem | null>(null);

  // Top Action Modals
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Form states for "+ Catat Barang Masuk"
  const [formSku, setFormSku] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formSupplier, setFormSupplier] = useState('');
  const [formReference, setFormReference] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Form states for "Penyesuaian Manual"
  const [adjSku, setAdjSku] = useState('');
  const [adjType, setAdjType] = useState<'Kurang' | 'Tambah'>('Kurang');
  const [adjQty, setAdjQty] = useState(1);
  const [adjReason, setAdjReason] = useState('');

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
  const handleCatatBarangMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct = products.find((p) => p.sku === formSku);
    if (!targetProduct) { window.alert('Pilih SKU produk yang valid terlebih dahulu.'); return; }
    try { await restockProduct(targetProduct.id, formQty, formNotes, formSupplier, formReference); } catch { return; }

    setIsRestockModalOpen(false);
    setFormNotes('');
    setFormReference('');
  };

  // Handle "Penyesuaian Manual" submit
  const handlePenyesuaianManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct = products.find((p) => p.sku === adjSku);
    const change = adjType === 'Tambah' ? adjQty : -adjQty;
    if (!targetProduct) { window.alert('Pilih SKU produk yang valid terlebih dahulu.'); return; }
    const newStock = targetProduct.stock + change;
    if (!Number.isInteger(adjQty) || adjQty <= 0 || newStock < 0) { window.alert('Jumlah penyesuaian tidak valid atau menyebabkan stok negatif.'); return; }
    if (!adjReason.trim()) { window.alert('Alasan penyesuaian stok wajib diisi.'); return; }
    try { await adjustStock(targetProduct.id, newStock, adjReason); } catch { return; }

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
              HISTORI DATABASE
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
              {`+${totalIncoming.toLocaleString('id-ID')} pcs`}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Akumulasi penambahan stok yang tercatat.
          </p>
        </div>

        {/* Card b: BARANG KELUAR */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              BARANG KELUAR
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-2 font-mono-num">
              {`${totalOutgoing.toLocaleString('id-ID')} pcs`}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Akumulasi pengurangan stok yang tercatat.
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
              {`${lowStockCount} SKU`}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Produk di bawah atau sama dengan batas minimum stok.
          </p>
        </div>

        {/* Card d: OPNAME TERAKHIR */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block">
              OPNAME TERAKHIR
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
              {lastOpname ? new Date(lastOpname.date).toLocaleDateString('id-ID') : 'Belum ada'}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tanggal koreksi stok terakhir di database.
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

          {/* Pagination dinamis berdasarkan jumlah histori sebenarnya */}
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

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - validCurrentPage) <= 1)
              .map((page, index, visiblePages) => (
                <React.Fragment key={page}>
                  {index > 0 && page - visiblePages[index - 1] > 1 && <span className="px-1 text-gray-400">…</span>}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      validCurrentPage === page ? 'bg-teal-600 text-white shadow-xs' : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                    }`}
                  >{page}</button>
                </React.Fragment>
              ))}

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
                    Detail Barang Masuk
                  </h3>
                  <p className="text-[11px] text-teal-800 font-mono-num font-semibold">
                    {selectedIncomingModal.referenceNumber || '—'}
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
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">PENANGGUNG JAWAB</span>
                  <span className="font-bold text-teal-800">{selectedIncomingModal.partner || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">STATUS VERIFIKASI</span>
                  <span className="font-semibold text-gray-700">Tercatat pada histori mutasi stok</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">KETERANGAN PENCATATAN</span>
                  <span className="font-medium text-gray-800">—</span>
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
                <span className="text-[11px] text-gray-500 font-semibold block">Catatan mutasi:</span>
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
                  onClick={() => window.print()}
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
                    Detail Barang Keluar
                  </h3>
                  <p className="text-[11px] text-amber-800 font-mono-num font-semibold">
                    {selectedOutgoingModal.referenceNumber || '—'}
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
                  <span className="font-bold text-gray-900">{selectedOutgoingModal.partner || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">STATUS PENCATATAN</span>
                  <span className="font-semibold text-gray-700">Tercatat pada histori mutasi stok</span>
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
                    Detail Penyesuaian Stok
                  </h3>
                  <p className="text-[11px] text-purple-800 font-mono-num font-semibold">
                    {selectedOpnameModal.referenceNumber || '—'}
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
                  <span className="font-bold text-purple-900">{selectedOpnameModal.partner || '—'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-semibold">STATUS PENCATATAN</span>
                  <span className="font-semibold text-gray-700">Tercatat pada histori mutasi stok</span>
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
                  <option value="">Pilih produk</option>
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
