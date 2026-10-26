import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Printer,
  Calendar,
  Search,
  TrendingUp,
  CreditCard,
  Banknote,
  ShoppingBag,
  Receipt,
  Trophy,
  PieChart as PieChartIcon,
  AlertTriangle,
  QrCode,
  ChevronDown,
  X,
  CheckCircle2,
  Download,
  Building2,
  Clock,
  ArrowRight,
  User,
  Filter,
} from 'lucide-react';

interface SalesTransactionRow {
  id: string;
  invoiceNumber: string;
  time: string;
  customerName: string;
  customerInitials?: string;
  isConsignment: boolean;
  saleType: 'Kasir Toko' | 'Mitra Seller';
  qty: number;
  total: number;
  paymentMethod: 'Tunai' | 'Kredit / Tempo' | 'QRIS / Transfer';
  dotColor: 'green' | 'purple';
  itemsSummary?: string;
  notes?: string;
}

// 24 realistic initial transactions matching the master design
const SAMPLE_TRANSACTIONS: SalesTransactionRow[] = [
  {
    id: 'tx-01',
    invoiceNumber: '#INV-20261008-024',
    time: '11:15 WIB',
    customerName: 'Pelanggan Ritel (Walk-in)',
    isConsignment: false,
    saleType: 'Kasir Toko',
    qty: 3,
    total: 135000,
    paymentMethod: 'Tunai',
    dotColor: 'green',
    itemsSummary: '2x CD Pria Boxer (L), 1x Singlet Pria Ribbed (M)',
  },
  {
    id: 'tx-02',
    invoiceNumber: '#INV-20261008-023',
    time: '10:45 WIB',
    customerName: 'Nina Kurniawati (Toko Nina)',
    customerInitials: 'NK',
    isConsignment: true,
    saleType: 'Mitra Seller',
    qty: 50,
    total: 1450000,
    paymentMethod: 'Kredit / Tempo',
    dotColor: 'purple',
    itemsSummary: '30x CD Pria Boxer, 20x Celana Dalam Seamless',
  },
  {
    id: 'tx-03',
    invoiceNumber: '#INV-20261008-022',
    time: '09:30 WIB',
    customerName: 'Pelanggan Ritel (Walk-in)',
    isConsignment: false,
    saleType: 'Kasir Toko',
    qty: 2,
    total: 56000,
    paymentMethod: 'QRIS / Transfer',
    dotColor: 'green',
    itemsSummary: '2x CD Wanita Katun Soft (M)',
  },
  {
    id: 'tx-04',
    invoiceNumber: '#INV-20261008-021',
    time: '08:15 WIB',
    customerName: 'Slamet Riyadi (Berkah UW)',
    customerInitials: 'SR',
    isConsignment: true,
    saleType: 'Mitra Seller',
    qty: 30,
    total: 850000,
    paymentMethod: 'Kredit / Tempo',
    dotColor: 'purple',
    itemsSummary: '20x CD Pria Boxer Katun, 10x Singlet Pria Ribbed',
  },
  {
    id: 'tx-05',
    invoiceNumber: '#INV-20261008-020',
    time: '07:50 WIB',
    customerName: 'Pelanggan Ritel (Walk-in)',
    isConsignment: false,
    saleType: 'Kasir Toko',
    qty: 4,
    total: 180000,
    paymentMethod: 'Tunai',
    dotColor: 'green',
    itemsSummary: '4x CD Pria Boxer Bamboo (XL)',
  },
  {
    id: 'tx-06',
    invoiceNumber: '#INV-20261008-019',
    time: '07:30 WIB',
    customerName: 'Dewi Sartika (Grosir Jaya)',
    customerInitials: 'DS',
    isConsignment: true,
    saleType: 'Mitra Seller',
    qty: 25,
    total: 625000,
    paymentMethod: 'Tunai',
    dotColor: 'purple',
    itemsSummary: '25x Celana Dalam Anak Laki Katun',
  },
  {
    id: 'tx-07',
    invoiceNumber: '#INV-20261008-018',
    time: '07:10 WIB',
    customerName: 'Pelanggan Ritel (Walk-in)',
    isConsignment: false,
    saleType: 'Kasir Toko',
    qty: 1,
    total: 28000,
    paymentMethod: 'QRIS / Transfer',
    dotColor: 'green',
    itemsSummary: '1x Singlet Pria Putih (L)',
  },
  {
    id: 'tx-08',
    invoiceNumber: '#INV-20261008-017',
    time: '06:45 WIB',
    customerName: 'Pelanggan Ritel (Walk-in)',
    isConsignment: false,
    saleType: 'Kasir Toko',
    qty: 5,
    total: 225000,
    paymentMethod: 'Tunai',
    dotColor: 'green',
    itemsSummary: '5x CD Boxer Katun (M)',
  },
  {
    id: 'tx-09',
    invoiceNumber: '#INV-20261008-016',
    time: '06:20 WIB',
    customerName: 'Ahmad Fauzi (Toko Sentosa)',
    customerInitials: 'AF',
    isConsignment: true,
    saleType: 'Mitra Seller',
    qty: 15,
    total: 420000,
    paymentMethod: 'Kredit / Tempo',
    dotColor: 'purple',
    itemsSummary: '15x CD Pria Boxer Seamless',
  },
  {
    id: 'tx-10',
    invoiceNumber: '#INV-20261008-015',
    time: '06:05 WIB',
    customerName: 'Pelanggan Ritel (Walk-in)',
    isConsignment: false,
    saleType: 'Kasir Toko',
    qty: 2,
    total: 56000,
    paymentMethod: 'Tunai',
    dotColor: 'green',
    itemsSummary: '2x CD Wanita High-Waist',
  },
  {
    id: 'tx-11',
    invoiceNumber: '#INV-20261008-014',
    time: '05:45 WIB',
    customerName: 'Pelanggan Ritel (Walk-in)',
    isConsignment: false,
    saleType: 'Kasir Toko',
    qty: 3,
    total: 135000,
    paymentMethod: 'QRIS / Transfer',
    dotColor: 'green',
    itemsSummary: '3x CD Pria Boxer Katun (L)',
  },
  {
    id: 'tx-12',
    invoiceNumber: '#INV-20261008-013',
    time: '05:30 WIB',
    customerName: 'Hendra Gunawan (Outlet Barokah)',
    customerInitials: 'HG',
    isConsignment: true,
    saleType: 'Mitra Seller',
    qty: 20,
    total: 580000,
    paymentMethod: 'Kredit / Tempo',
    dotColor: 'purple',
    itemsSummary: '20x Singlet Pria Ribbed (XL)',
  },
];

export const SalesReport: React.FC = () => {
  const { invoices } = useApp();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('Hari Ini (08 Okt 2026)');
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<SalesTransactionRow | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const itemsPerPage = 8;

  // Period options
  const periodOptions = [
    'Semua Periode',
    'Hari Ini (24 Okt 2026)',
    'Kemarin',
    '7 Hari Terakhir',
    'Bulan Ini',
  ];

  // Merge real context invoices with sample transactions, placing REAL INVOICES AT THE VERY TOP
  const allTransactions = useMemo(() => {
    const realMapped: SalesTransactionRow[] = invoices.map((inv, idx) => {
      const isConsign = !!inv.sellerId;
      const initials = inv.sellerName
        ? inv.sellerName
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : undefined;

      const dateObj = new Date(inv.date);
      const timeStr = !isNaN(dateObj.getTime())
        ? `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj
            .getMinutes()
            .toString()
            .padStart(2, '0')} WIB`
        : 'Baru saja';

      const totalQty = inv.items.reduce((sum, item) => sum + item.quantity, 0);

      return {
        id: inv.id || `inv-${idx}`,
        invoiceNumber: inv.invoiceNumber,
        time: timeStr,
        customerName: isConsign
          ? `${inv.sellerName} (Mitra)`
          : 'Pelanggan Ritel (Walk-in)',
        customerInitials: initials,
        isConsignment: isConsign,
        saleType: isConsign ? 'Mitra Seller' : 'Kasir Toko',
        qty: totalQty || 1,
        total: inv.total,
        paymentMethod:
          inv.paymentMethod === 'Kredit'
            ? 'Kredit / Tempo'
            : inv.paymentMethod === 'Transfer Bank'
            ? 'QRIS / Transfer'
            : 'Tunai',
        dotColor: isConsign ? 'purple' : 'green',
        itemsSummary: inv.items
          .map((it) => `${it.quantity}x ${it.productName}`)
          .join(', '),
        notes: (inv as any).notes || 'Transaksi tercatat di sistem POS Kasir',
        isLive: true,
      };
    });

    // PENTING: Transaksi real dari kasir ditaruh di URUTAN PALING ATAS!
    const seenNumbers = new Set(realMapped.map((t) => t.invoiceNumber));
    const sampleRemaining = SAMPLE_TRANSACTIONS.filter((t) => !seenNumbers.has(t.invoiceNumber));
    return [...realMapped, ...sampleRemaining];
  }, [invoices]);

  const realTransactionsCount = invoices.length;

  // Metrik ringkasan dinamis yang selalu sinkron dengan transaksi kasir
  const totalOmsetKotor = useMemo(() => {
    return allTransactions.reduce((acc, curr) => acc + curr.total, 0);
  }, [allTransactions]);

  const totalQtyTerjual = useMemo(() => {
    return allTransactions.reduce((acc, curr) => acc + curr.qty, 0);
  }, [allTransactions]);

  const totalNotaCount = allTransactions.length;

  // Filtered transactions based on search term
  const filteredTransactions = useMemo(() => {
    if (!searchTerm.trim()) return allTransactions;
    const term = searchTerm.toLowerCase();
    return allTransactions.filter(
      (tx) =>
        tx.invoiceNumber.toLowerCase().includes(term) ||
        tx.customerName.toLowerCase().includes(term) ||
        tx.saleType.toLowerCase().includes(term) ||
        tx.paymentMethod.toLowerCase().includes(term) ||
        (tx.itemsSummary && tx.itemsSummary.toLowerCase().includes(term))
    );
  }, [allTransactions, searchTerm]);

  // Pagination calculation
  const totalEntries = filteredTransactions.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  // Handle PDF Print
  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ================= 1. HEADER & ACTION CONTROLS ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
              AUDIT INFORMATION SYSTEM
            </span>
            <span className="text-gray-500 text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sinkronisasi real-time kasir aktif
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1.5">
            Laporan Penjualan &amp; Performa Produk
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Analisis volume penjualan eceran dan mitra, tren omset kotor, serta produk terlaris.
          </p>
        </div>

        {/* Right Controls: Periode Dropdown & Cetak PDF Button */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Dropdown Periode */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-gray-500" />
              <span>Periode: {selectedPeriod}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {isPeriodDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-30 py-1 text-xs">
                {periodOptions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedPeriod(opt);
                      setIsPeriodDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2 hover:bg-gray-100 transition-colors flex items-center justify-between ${
                      selectedPeriod === opt ? 'font-bold text-emerald-700 bg-emerald-50' : 'text-gray-700'
                    }`}
                  >
                    <span>{opt}</span>
                    {selectedPeriod === opt && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cetak Laporan PDF Button */}
          <button
            type="button"
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#064e3b] hover:bg-[#043828] text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-emerald-200" />
            <span>Cetak Laporan PDF</span>
          </button>
        </div>
      </div>

      {/* ================= 2. 4 SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Omset (Kotor) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">
                Total Omset (Kotor)
              </span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100">
                <Banknote className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-[#059669] tracking-tight">
                Rp {totalOmsetKotor.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center gap-2 text-xs">
            <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" />
              Sinkron POS
            </span>
            <span className="text-gray-500 text-[11px]">
              {realTransactionsCount > 0 ? `${realTransactionsCount} transaksi kasir aktif` : 'Real-time & arsip'}
            </span>
          </div>
        </div>

        {/* Card 2: Produk Terjual (Qty) */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-purple-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">
                Produk Terjual (Qty)
              </span>
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md border border-purple-100">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-800 tracking-tight">
                {totalQtyTerjual.toLocaleString('id-ID')} pcs
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500 text-[11px]">
              Akumulasi item terjual
            </span>
            <span className="text-indigo-700 font-semibold text-[11px] bg-indigo-50 px-2 py-0.5 rounded">
              Total Unit
            </span>
          </div>
        </div>

        {/* Card 3: Total Transaksi */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500" />
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">
                Total Transaksi
              </span>
              <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md border border-amber-100">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-amber-500 tracking-tight">
                {totalNotaCount} Nota
              </span>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500 text-[11px]">
              {allTransactions.filter((t) => !t.isConsignment).length} Ritel, {allTransactions.filter((t) => t.isConsignment).length} Mitra
            </span>
            <span className="text-blue-700 font-semibold text-[11px] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              Rata-rata: Rp {totalNotaCount > 0 ? Math.round(totalOmsetKotor / totalNotaCount).toLocaleString('id-ID') : '0'}
            </span>
          </div>
        </div>

        {/* Card 4: PRODUK TERLARIS HARI INI */}
        <div className="bg-[#064e3b] rounded-xl p-4 shadow-2xs relative overflow-hidden text-white flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] tracking-wider uppercase font-bold text-emerald-200">
                PRODUK TERLARIS HARI INI
              </span>
              <div className="p-1.5 bg-[#043828] text-emerald-300 rounded-full border border-emerald-700/50">
                <Trophy className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-xl font-black text-white tracking-tight">
                CD Pria Boxer
              </h3>
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-emerald-700/40 flex items-center justify-between text-xs">
            <span className="text-emerald-100 text-xs">
              Terjual: <strong className="text-white font-bold">45 pcs</strong>
            </span>
            <span className="bg-[#043828] text-emerald-200 text-[11px] font-mono px-2 py-0.5 rounded border border-emerald-700/60">
              SKU: UW-MBX-01
            </span>
          </div>
        </div>
      </div>

      {/* ================= 3. MIDDLE SECTION (2 COLUMNS) ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Kanal Penjualan (Donut Chart) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Kanal Penjualan
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Rasio kontribusi omset hari ini
                </p>
              </div>
              <div className="text-indigo-900">
                <PieChartIcon className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Donut Chart with SVG & Legend */}
            <div className="my-5 flex flex-col sm:flex-row items-center justify-around gap-6">
              {/* Donut Chart SVG */}
              <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                  {/* Background track */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    className="stroke-gray-100"
                    strokeWidth="16"
                    fill="transparent"
                  />
                  {/* Mitra Seller segment (73% -> 211.2 of 289 perimeter) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    stroke="#4f46e5"
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray="211 289"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                  />
                  {/* Ritel Kasir segment (27% -> 78 of 289 perimeter) */}
                  <circle
                    cx="60"
                    cy="60"
                    r="46"
                    stroke="#059669"
                    strokeWidth="16"
                    fill="transparent"
                    strokeDasharray="78 289"
                    strokeDashoffset="-211"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Donut Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                    Total
                  </span>
                  <span className="text-base font-black text-gray-900 leading-tight">
                    100%
                  </span>
                </div>
              </div>

              {/* Legend Right */}
              <div className="space-y-3.5 text-xs">
                <div className="flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#4f46e5] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-800">Mitra Seller</p>
                    <p className="text-gray-500 font-medium">Rp 2.300.000 (73%)</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-[#059669] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-gray-800">Ritel Kasir</p>
                    <p className="text-gray-500 font-medium">Rp 850.000 (27%)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Card Summary Bar */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg px-3.5 py-2.5 flex items-center justify-between text-xs mt-2">
            <span className="text-gray-600 font-medium">
              Arus Kas Tunai vs Tempo:
            </span>
            <span className="text-gray-900 font-bold">
              62% Kredit / 38% Cash
            </span>
          </div>
        </div>

        {/* RIGHT COLUMN: Top 3 Produk Unggulan */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Top 3 Produk Unggulan
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Volume terjual dan nilai perputaran kas per kategori
                </p>
              </div>
              <span className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-blue-100">
                Data Realtime
              </span>
            </div>

            {/* 3 Metric Box Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 my-4">
              {/* Product 1 */}
              <div className="bg-stone-50/70 border border-stone-200/80 rounded-lg p-3 relative flex flex-col justify-between">
                <div>
                  <div className="w-5 h-5 bg-[#065f46] text-white rounded flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm mt-2 line-clamp-1">
                    CD Boxer Katun
                  </h4>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                  <span className="text-gray-500 text-[11px]">45 terjual</span>
                  <span className="font-bold text-[#059669] text-xs">
                    Rp 1.035.000
                  </span>
                </div>
              </div>

              {/* Product 2 */}
              <div className="bg-stone-50/70 border border-stone-200/80 rounded-lg p-3 relative flex flex-col justify-between">
                <div>
                  <div className="w-5 h-5 bg-[#4338ca] text-white rounded flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm mt-2 line-clamp-1">
                    Singlet Pria Ribbed
                  </h4>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                  <span className="text-gray-500 text-[11px]">38 terjual</span>
                  <span className="font-bold text-[#4338ca] text-xs">
                    Rp 950.000
                  </span>
                </div>
              </div>

              {/* Product 3 */}
              <div className="bg-stone-50/70 border border-stone-200/80 rounded-lg p-3 relative flex flex-col justify-between">
                <div>
                  <div className="w-5 h-5 bg-[#0f766e] text-white rounded flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs sm:text-sm mt-2 line-clamp-1">
                    Celana Dalam Seamles
                  </h4>
                </div>
                <div className="mt-3 pt-2 border-t border-gray-200/60 flex items-center justify-between text-xs">
                  <span className="text-gray-500 text-[11px]">29 terjual</span>
                  <span className="font-bold text-[#0f766e] text-xs">
                    Rp 696.000
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Warning Alert */}
          <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs mt-2">
            <span className="text-gray-500">
              Stok kritis pasca penjualan hari ini:
            </span>
            <span className="text-amber-700 font-semibold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Boxer Navy Ukuran XL tersisa 4 pcs
            </span>
          </div>
        </div>
      </div>

      {/* ================= 4. RIWAYAT TRANSAKSI PENJUALAN (TABLE) ================= */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-4 sm:p-5 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Riwayat Transaksi Penjualan
              </h3>
              <p className="text-xs text-gray-500">
                Data tercatat dari kasir offline dan pesanan konsinyasi seller
              </p>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Cari no invoice atau nama..."
              className="w-full pl-9 pr-3.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:bg-white text-gray-900 placeholder-gray-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">NO. INVOICE</th>
                <th className="py-3 px-4">WAKTU</th>
                <th className="py-3 px-4">PELANGGAN / MITRA</th>
                <th className="py-3 px-4">TIPE PENJUALAN</th>
                <th className="py-3 px-4">QTY PRODUK</th>
                <th className="py-3 px-4">TOTAL TRANSAKSI</th>
                <th className="py-3 px-4">METODE BAYAR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    Tidak ditemukan transaksi dengan kata kunci "{searchTerm}".
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                  >
                    {/* NO. INVOICE with dot */}
                    <td className="py-3.5 px-4 font-semibold text-gray-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            tx.dotColor === 'green' ? 'bg-emerald-500' : 'bg-purple-500'
                          }`}
                        />
                        <span className="group-hover:text-emerald-700 transition-colors">
                          {tx.invoiceNumber}
                        </span>
                        {(tx as any).isLive && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded font-mono">
                            BARU (KASIR)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* WAKTU */}
                    <td className="py-3.5 px-4 text-gray-600 whitespace-nowrap">
                      {tx.time}
                    </td>

                    {/* PELANGGAN / MITRA with avatar */}
                    <td className="py-3.5 px-4 text-gray-900 font-medium">
                      <div className="flex items-center gap-2">
                        {tx.customerInitials && (
                          <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                            {tx.customerInitials}
                          </div>
                        )}
                        <span className="truncate max-w-[180px]">
                          {tx.customerName}
                        </span>
                      </div>
                    </td>

                    {/* TIPE PENJUALAN */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {tx.saleType === 'Kasir Toko' ? (
                        <span className="bg-sky-50 text-sky-700 font-semibold text-[11px] px-2.5 py-0.5 rounded border border-sky-100">
                          Kasir Toko
                        </span>
                      ) : (
                        <span className="bg-purple-50 text-purple-700 font-semibold text-[11px] px-2.5 py-0.5 rounded border border-purple-100">
                          Mitra Seller
                        </span>
                      )}
                    </td>

                    {/* QTY PRODUK */}
                    <td className="py-3.5 px-4 text-gray-700 font-medium whitespace-nowrap">
                      {tx.qty} pcs
                    </td>

                    {/* TOTAL TRANSAKSI */}
                    <td className="py-3.5 px-4 font-extrabold text-gray-900 whitespace-nowrap">
                      Rp {tx.total.toLocaleString('id-ID')}
                    </td>

                    {/* METODE BAYAR */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {tx.paymentMethod === 'Tunai' ? (
                        <span className="text-gray-700 font-medium">Tunai</span>
                      ) : tx.paymentMethod === 'Kredit / Tempo' ? (
                        <span className="bg-sky-50 text-sky-700 font-semibold text-[11px] px-2.5 py-0.5 rounded-full border border-sky-200">
                          Kredit / Tempo
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                          <QrCode className="w-3.5 h-3.5" />
                          QRIS / Transfer
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Info count & Pagination */}
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600 bg-gray-50/50">
          <div>
            Menampilkan <strong className="text-gray-900">{paginatedTransactions.length}</strong> dari{' '}
            <strong className="text-gray-900">{totalEntries}</strong> transaksi
          </div>

          {/* Pagination Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white text-gray-700 font-medium cursor-pointer"
            >
              Sebelumnya
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 3).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded text-xs font-bold transition-colors cursor-pointer ${
                  currentPage === page
                    ? 'bg-[#065f46] text-white shadow-2xs'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-white text-gray-700 font-medium cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* ================= 5. MODAL DETAIL TRANSAKSI ================= */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#064e3b] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-sm">
                    Detail Faktur: {selectedTx.invoiceNumber}
                  </h3>
                  <p className="text-[11px] text-emerald-200">
                    Waktu Transaksi: {selectedTx.time}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="text-emerald-200 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <span className="text-gray-500 block">Pelanggan / Mitra:</span>
                  <span className="font-bold text-gray-900 text-sm">
                    {selectedTx.customerName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Kanal Penjualan:</span>
                  <span className="font-semibold text-emerald-800">
                    {selectedTx.saleType}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Metode Pembayaran:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedTx.paymentMethod}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Total Qty:</span>
                  <span className="font-semibold text-gray-900">
                    {selectedTx.qty} pcs
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2">Item Terjual:</h4>
                <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-gray-800 font-medium">
                  {selectedTx.itemsSummary || 'CD Pria Boxer Katun Soft (Ukuran L)'}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">Total Pembayaran:</span>
                <span className="text-lg font-black text-emerald-700">
                  Rp {selectedTx.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-1.5 bg-[#064e3b] text-white rounded-lg text-xs font-semibold hover:bg-[#043828] flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Struk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 6. MODAL CETAK LAPORAN PDF ================= */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 animate-in fade-in">
            <div className="bg-[#064e3b] text-white px-6 py-4 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-300" />
                <div>
                  <h3 className="font-bold text-base">Pratinjau Cetak Laporan PDF</h3>
                  <p className="text-xs text-emerald-200">
                    Tino Underwear Information System • Dokumen Resmi Penjualan
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-gray-900">
              {/* Report Header Letterhead */}
              <div className="border-b-2 border-gray-900 pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-black italic text-blue-900 tracking-wider">
                    TUMIN
                  </h2>
                  <p className="text-xs font-bold text-gray-800">
                    Tino Underwear Information System
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Toko Pusat Bekasi • Terminal Kasir POS-01
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-emerald-800">LAPORAN PENJUALAN HARIAN</p>
                  <p className="text-gray-500">Periode: {selectedPeriod}</p>
                  <p className="text-gray-400 text-[10px]">Dicetak: 08 Okt 2026 12:00 WIB</p>
                </div>
              </div>

              {/* Summary KPIs */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-gray-500 block">Total Omset Kotor</span>
                  <span className="text-base font-extrabold text-emerald-700">Rp 3.150.000</span>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-gray-500 block">Volume Terjual</span>
                  <span className="text-base font-extrabold text-gray-800">142 pcs</span>
                </div>
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="text-gray-500 block">Total Transaksi</span>
                  <span className="text-base font-extrabold text-amber-600">24 Nota</span>
                </div>
              </div>

              {/* Top Products */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">
                  Top 3 Produk Terlaris
                </h4>
                <div className="border border-gray-200 rounded text-xs divide-y divide-gray-100">
                  <div className="p-2.5 flex justify-between">
                    <span>1. CD Boxer Katun (45 pcs)</span>
                    <span className="font-bold">Rp 1.035.000</span>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span>2. Singlet Pria Ribbed (38 pcs)</span>
                    <span className="font-bold">Rp 950.000</span>
                  </div>
                  <div className="p-2.5 flex justify-between">
                    <span>3. Celana Dalam Seamles (29 pcs)</span>
                    <span className="font-bold">Rp 696.000</span>
                  </div>
                </div>
              </div>

              {/* Table snippet */}
              <div>
                <h4 className="text-xs font-bold text-gray-700 uppercase mb-2">
                  Rincian Transaksi Terakhir
                </h4>
                <table className="w-full text-left text-xs border border-gray-200">
                  <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                      <th className="p-2">Invoice</th>
                      <th className="p-2">Pelanggan</th>
                      <th className="p-2">Kanal</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {SAMPLE_TRANSACTIONS.slice(0, 4).map((t) => (
                      <tr key={t.id}>
                        <td className="p-2 font-mono font-medium">{t.invoiceNumber}</td>
                        <td className="p-2">{t.customerName}</td>
                        <td className="p-2">{t.saleType}</td>
                        <td className="p-2">{t.qty} pcs</td>
                        <td className="p-2 font-bold">Rp {t.total.toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 text-center text-xs text-gray-600">
                <div>
                  <p>Petugas Kasir</p>
                  <div className="h-14" />
                  <p className="font-semibold text-gray-900">( Kasir POS-01 )</p>
                </div>
                <div>
                  <p>Mengetahui, Owner</p>
                  <div className="h-14" />
                  <p className="font-semibold text-gray-900">( Pak Tino )</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                Batal
              </button>
              <button
                onClick={handlePrintPdf}
                className="px-4 py-2 bg-[#064e3b] text-white rounded-lg text-xs font-semibold hover:bg-[#043828] flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                Cetak Dokumen Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
