import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ProductManagement } from './ProductManagement';
import { StockControl } from './StockControl';
import { SellerManagement } from './SellerManagement';
import { ReceivablesManagement } from './ReceivablesManagement';
import { FinancialReports } from './FinancialReports';
import { SalesReport } from './SalesReport';
import { PosScreen } from '../pos/PosScreen';
import { PaymentProofModal } from '../common/PaymentProofModal';
import {
  LayoutDashboard,
  ShoppingCart,
  Layers,
  Archive,
  Users,
  CreditCard,
  BarChart3,
  FileSpreadsheet,
  Settings,
  LogOut,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowUpRight,
  DollarSign,
  PackageCheck,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Image as ImageIcon,
  Menu,
  X,
  Store,
  Printer,
  Smartphone,
  Save,
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const {
    currentUser,
    logout,
    products,
    sellers,
    invoices,
    pendingSellersCount,
    totalReceivablesSummary,
    resetToDefaultData,
  } = useApp();

  // Active sidebar view
  const [activeNav, setActiveNav] = useState<
    | 'dashboard'
    | 'pos'
    | 'produk'
    | 'stok'
    | 'seller'
    | 'piutang'
    | 'laporan-penjualan'
    | 'laporan-keuangan'
    | 'pengaturan'
  >(() => {
    return (sessionStorage.getItem('tumin_owner_active_nav') as any) || 'dashboard';
  });

  useEffect(() => {
    sessionStorage.setItem('tumin_owner_active_nav', activeNav);
  }, [activeNav]);

  // Mobile sidebar open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Selected invoice for viewing payment proof
  const [selectedProofInvoice, setSelectedProofInvoice] = useState<any | null>(null);

  // Sales Chart toggle: 'Harian' | 'Bulanan'
  const [chartMode, setChartMode] = useState<'Harian' | 'Bulanan'>('Harian');
  const [activeChartHoverIndex, setActiveChartHoverIndex] = useState<number | null>(null);

  // Store Settings state
  const [storeInfo, setStoreInfo] = useState({
    name: 'Tino Underwear',
    tagline: 'Pusat Grosir & Eceran Pakaian Dalam Berkualitas',
    address: 'Jl. Pemuda No. 12, Kranji, Bekasi Barat, Kota Bekasi, Jawa Barat 17135',
    phone: '+62 812-9876-5432',
    email: 'kontak@tinounderwear.id',
    bankAccount: 'BCA 521-089-2234 a.n Tino Underwear',
    bankAccountOwner: 'Bank Central Asia (BCA)',
    receiptFooter: 'Terima kasih atas kunjungan Anda! Barang yang sudah dibeli tidak dapat ditukar.',
    minStockDefault: 10,
    storeOpenTime: '08:00',
    storeCloseTime: '21:00',
  });
  const [settingsSavedMessage, setSettingsSavedMessage] = useState(false);

  // Summary Metrics
  const metrics = useMemo(() => {
    // Omzet Hari Ini (calculated from today's invoices)
    const today = new Date().toISOString().slice(0, 10);
    const todayInvoices = invoices.filter((i) => i.date.startsWith(today));
    const omzetHariIni = todayInvoices.reduce((acc, curr) => acc + curr.total, 0);

    // Omzet Bulan Ini
    const thisMonth = new Date().toISOString().slice(0, 7);
    const monthInvoices = invoices.filter((i) => i.date.startsWith(thisMonth));
    const omzetBulanIni = monthInvoices.reduce((acc, curr) => acc + curr.total, 0);

    // Total Piutang Aktif
    const totalPiutang = totalReceivablesSummary.total;

    // Produk Stok Menipis (stok <= minStock)
    const lowStockProducts = products.filter(
      (p) => p.stock > 0 && p.stock <= p.minStock
    );
    const outOfStockProducts = products.filter((p) => p.stock === 0);

    return {
      omzetHariIni,
      omzetBulanIni,
      totalPiutang,
      lowStockProducts,
      outOfStockProducts,
      lowStockCount: lowStockProducts.length + outOfStockProducts.length,
    };
  }, [invoices, products, totalReceivablesSummary]);

  // Chart data
  const chartData = useMemo(() => {
    if (chartMode === 'Harian') {
      return [
        { label: '01 Okt', value: 1250000, orders: 8 },
        { label: '02 Okt', value: 3420000, orders: 14 },
        { label: '03 Okt', value: 1800000, orders: 11 },
        { label: '04 Okt', value: 2450000, orders: 16 },
        { label: '05 Okt', value: 1150000, orders: 9 },
        { label: '06 Okt', value: 2980000, orders: 18 },
        { label: '07 Okt (Hari Ini)', value: metrics.omzetHariIni || 2130000, orders: 12 },
      ];
    } else {
      return [
        { label: 'Mei 26', value: 38200000, orders: 180 },
        { label: 'Jun 26', value: 45400000, orders: 210 },
        { label: 'Jul 26', value: 52100000, orders: 245 },
        { label: 'Agu 26', value: 49800000, orders: 230 },
        { label: 'Sep 26', value: 58600000, orders: 275 },
        { label: 'Okt 26', value: metrics.omzetBulanIni || 62400000, orders: 125 },
      ];
    }
  }, [chartMode, metrics.omzetHariIni, metrics.omzetBulanIni]);

  const maxChartVal = useMemo(() => {
    return Math.max(...chartData.map((d) => d.value), 1000000);
  }, [chartData]);

  // Recent Due Dates
  const upcomingReceivables = useMemo(() => {
    return invoices
      .filter((i) => i.paymentMethod === 'Kredit' && i.remainingBalance > 0)
      .slice(0, 5);
  }, [invoices]);

  // Recent Transactions
  const recentTransactions = useMemo(() => {
    return invoices.slice(0, 5);
  }, [invoices]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsSavedMessage(true);
    setTimeout(() => setSettingsSavedMessage(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex">
      {/* 1. SIDEBAR (Kiri) - DESKTOP */}
      <aside className="w-64 bg-white border-r border-gray-200 flex-col justify-between shrink-0 hidden md:flex z-20 sticky top-0 h-screen">
        <div className="flex flex-col min-h-0 flex-1">
          {/* Header */}
          <div className="p-5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black italic text-blue-900 tracking-wider">
                TUMIN
              </span>
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">
                OWNER
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-0.5">
              Tino Underwear Information System
            </p>
          </div>

          {/* Menu Navigasi */}
          <nav className="p-3 space-y-1 text-xs sm:text-sm font-medium overflow-y-auto flex-1">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-xs sm:text-sm cursor-pointer ${
                activeNav === 'dashboard'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveNav('pos')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-xs sm:text-sm cursor-pointer ${
                activeNav === 'pos'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Layar Kasir (POS)</span>
            </button>

            <button
              onClick={() => setActiveNav('produk')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-xs sm:text-sm cursor-pointer ${
                activeNav === 'produk'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Produk</span>
            </button>

            <button
              onClick={() => setActiveNav('stok')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-xs sm:text-sm cursor-pointer ${
                activeNav === 'stok'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Archive className="w-4 h-4" />
                <span>Kontrol Stok</span>
              </div>
              <span className="bg-yellow-400 text-yellow-900 font-bold px-1.5 py-0.5 rounded-full text-xs">
                4
              </span>
            </button>

            <button
              onClick={() => setActiveNav('seller')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-xs sm:text-sm cursor-pointer ${
                activeNav === 'seller'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Mitra Seller</span>
              </div>
              <span className="bg-yellow-400 text-yellow-900 font-bold px-1.5 py-0.5 rounded-full text-xs">
                {pendingSellersCount || 2}
              </span>
            </button>

            <button
              onClick={() => setActiveNav('piutang')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-xs sm:text-sm cursor-pointer ${
                activeNav === 'piutang'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Buku Piutang</span>
            </button>

            <button
              onClick={() => setActiveNav('laporan-penjualan')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-xs sm:text-sm cursor-pointer ${
                activeNav === 'laporan-penjualan'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Laporan Penjualan</span>
            </button>

            <button
              onClick={() => setActiveNav('laporan-keuangan')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-xs sm:text-sm cursor-pointer ${
                activeNav === 'laporan-keuangan'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Laporan Keuangan</span>
            </button>

            <button
              onClick={() => setActiveNav('pengaturan')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-xs sm:text-sm cursor-pointer ${
                activeNav === 'pengaturan'
                  ? 'bg-teal-600 text-white font-semibold'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Pengaturan Toko</span>
            </button>
          </nav>
        </div>

        {/* Footer Sidebar (Sticky bottom) */}
        <div className="p-3 border-t border-gray-200 sticky bottom-0 bg-white shrink-0">
          <div className="p-2 rounded-lg flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-200 text-green-900 font-bold flex items-center justify-center text-xs shrink-0">
              PT
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-gray-900 truncate">
                Pak Tino <span className="font-normal text-gray-500">(Owner)</span>
              </p>
              <p className="text-[11px] text-gray-500 truncate">
                owner@tinounderwear.id
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            className="mt-2 w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Log Out)</span>
          </button>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-white h-full flex flex-col justify-between shadow-xl z-10">
            <div className="flex flex-col min-h-0 flex-1">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black italic text-blue-900">TUMIN</span>
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded">OWNER</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 text-gray-400 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-3 space-y-1 text-xs font-medium overflow-y-auto flex-1">
                {[
                  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                  { id: 'pos', label: 'Layar Kasir (POS)', icon: ShoppingCart },
                  { id: 'produk', label: 'Produk', icon: Layers },
                  { id: 'stok', label: 'Kontrol Stok', icon: Archive, badge: 4 },
                  { id: 'seller', label: 'Mitra Seller', icon: Users, badge: 2 },
                  { id: 'piutang', label: 'Buku Piutang', icon: CreditCard },
                  { id: 'laporan-penjualan', label: 'Laporan Penjualan', icon: BarChart3 },
                  { id: 'laporan-keuangan', label: 'Laporan Keuangan', icon: FileSpreadsheet },
                  { id: 'pengaturan', label: 'Pengaturan Toko', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveNav(item.id as any);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-xs ${
                        isActive
                          ? 'bg-teal-600 text-white font-semibold'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="bg-yellow-400 text-yellow-900 font-bold px-1.5 py-0.5 rounded-full text-[10px]">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="p-3 border-t border-gray-200">
              <button
                onClick={logout}
                className="w-full py-2 px-3 bg-red-50 text-red-600 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar (Log Out)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile Header Bar */}
        <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1 -ml-1 text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xl font-black italic text-blue-900">TUMIN</span>
            <span className="bg-green-100 text-green-800 text-[10px] font-semibold px-2 py-0.5 rounded">OWNER</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveNav('pos')}
              className="px-2.5 py-1 bg-teal-600 text-white rounded text-xs font-semibold flex items-center gap-1"
            >
              <ShoppingCart className="w-3 h-3" />
              <span>POS</span>
            </button>
            <button
              onClick={logout}
              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* VIEW ROUTER FOR OWNER */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 0: POS KASIR */}
          {activeNav === 'pos' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-teal-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                  Mode Kasir Terintegrasi (Akses Owner Langsung)
                </span>
                <button
                  onClick={() => setActiveNav('dashboard')}
                  className="text-gray-600 hover:text-gray-900 underline font-medium cursor-pointer"
                >
                  ← Kembali ke Dashboard
                </button>
              </div>
              <PosScreen onLogout={() => setActiveNav('dashboard')} />
            </div>
          )}

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeNav === 'dashboard' && (
            <div className="space-y-6">
              {/* Header Dashboard Overview */}
              <div className="pb-1">
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Dashboard Operasional &amp; Ringkasan
                  </h1>
                  <span className="bg-teal-100 text-teal-800 font-semibold text-xs px-2 py-0.5 rounded">
                    LIVE MONITOR
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Selamat datang kembali, Pak Tino. Pantau performa omzet bisnis dan pergerakan stok toko Tino Underwear.
                </p>
              </div>

              {/* 4 Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Omzet Hari Ini */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      OMZET HARI INI
                    </span>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-bold text-green-600 tracking-tight font-mono">
                      Rp {metrics.omzetHariIni.toLocaleString('id-ID')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Penjualan kasir ritel &amp; order tempo
                    </p>
                  </div>
                </div>

                {/* 2. Omzet Bulan Ini */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      OMZET BULAN INI
                    </span>
                    <DollarSign className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-bold text-purple-700 tracking-tight font-mono">
                      Rp {metrics.omzetBulanIni.toLocaleString('id-ID')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      Bulan berjalan tahun 2026
                    </p>
                  </div>
                </div>

                {/* 3. Total Piutang Aktif */}
                <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      TOTAL PIUTANG AKTIF
                    </span>
                    <CreditCard className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-bold text-rose-700 tracking-tight font-mono">
                      Rp {metrics.totalPiutang.toLocaleString('id-ID')}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {totalReceivablesSummary.unpaid + totalReceivablesSummary.partiallyPaid} faktur belum lunas
                    </p>
                  </div>
                </div>

                {/* 4. Produk Stok Menipis */}
                <div
                  onClick={() => setActiveNav('stok')}
                  className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-amber-400 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      PERINGATAN STOK MENIPIS
                    </span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-bold text-amber-500 tracking-tight font-mono">
                      {metrics.lowStockCount} SKU
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {metrics.outOfStockProducts.length} habis · {metrics.lowStockProducts.length} menipis
                    </p>
                  </div>
                </div>
              </div>

              {/* SALES CHART WITH HARIAN / BULANAN TOGGLE */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      Tren Penjualan &amp; Performa Omzet
                    </h3>
                    <p className="text-xs text-gray-500">
                      Statistik transaksi gabungan kasir ritel dan piutang reseller.
                    </p>
                  </div>

                  {/* Segmented control: Harian / Bulanan */}
                  <div className="flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200">
                    <button
                      onClick={() => setChartMode('Harian')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        chartMode === 'Harian'
                          ? 'bg-white text-teal-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Harian (7 Hari Terakhir)
                    </button>
                    <button
                      onClick={() => setChartMode('Bulanan')}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                        chartMode === 'Bulanan'
                          ? 'bg-white text-teal-700 shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Bulanan (Tahun 2026)
                    </button>
                  </div>
                </div>

                {/* SVG Bar Chart Visualization */}
                <div className="pt-4 pb-2">
                  <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-gray-200">
                    {chartData.map((d, index) => {
                      const heightPercent = Math.max(12, Math.round((d.value / maxChartVal) * 100));
                      const isHovered = activeChartHoverIndex === index;

                      return (
                        <div
                          key={d.label}
                          onMouseEnter={() => setActiveChartHoverIndex(index)}
                          onMouseLeave={() => setActiveChartHoverIndex(null)}
                          className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                        >
                          {/* Tooltip */}
                          {isHovered && (
                            <div className="absolute -top-12 z-30 bg-gray-900 text-white px-2.5 py-1.5 rounded-lg text-xs shadow-lg whitespace-nowrap animate-in fade-in duration-100">
                              <p className="font-bold font-mono">
                                Rp {d.value.toLocaleString('id-ID')}
                              </p>
                              <p className="text-[10px] text-gray-300">
                                {d.orders} transaksi
                              </p>
                            </div>
                          )}

                          {/* Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full max-w-[48px] rounded-t-md transition-all duration-200 ${
                              isHovered
                                ? 'bg-teal-700'
                                : index === chartData.length - 1
                                ? 'bg-teal-600'
                                : 'bg-teal-500/80 hover:bg-teal-600'
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* X Axis Labels */}
                  <div className="flex items-center justify-between text-xs text-gray-500 px-2 pt-2.5 font-mono">
                    {chartData.map((d) => (
                      <span key={d.label} className="truncate max-w-[70px] text-center">
                        {d.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* THREE LISTS: Produk Stok Menipis, Piutang Terbaru, Transaksi Kasir */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* 1. PRODUK STOK MENIPIS */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h4 className="font-bold text-sm text-gray-900">
                          Produk Stok Menipis
                        </h4>
                      </div>
                      <button
                        onClick={() => setActiveNav('stok')}
                        className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
                      >
                        Lihat Semua
                      </button>
                    </div>

                    <div className="space-y-2 mt-3">
                      {metrics.lowStockProducts.concat(metrics.outOfStockProducts).slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                        >
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-gray-900 truncate">
                              {p.name}
                            </p>
                            <p className="text-[11px] text-gray-500 font-mono">
                              {p.sku} · Min: {p.minStock} {p.unit}
                            </p>
                          </div>
                          <span
                            className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                              p.stock === 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {p.stock === 0 ? 'Habis (0)' : `Sisa ${p.stock}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveNav('stok')}
                    className="w-full mt-3 py-2 text-xs text-teal-700 hover:bg-teal-50 rounded-lg font-semibold transition-colors border border-dashed border-teal-300 cursor-pointer"
                  >
                    + Buka Kontrol Stok Gudang
                  </button>
                </div>

                {/* 2. PIUTANG JATUH TEMPO */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <h4 className="font-bold text-sm text-gray-900">
                          Piutang Jatuh Tempo
                        </h4>
                      </div>
                      <button
                        onClick={() => setActiveNav('piutang')}
                        className="text-xs text-purple-700 hover:underline font-semibold cursor-pointer"
                      >
                        Buku Piutang
                      </button>
                    </div>

                    <div className="space-y-2 mt-3">
                      {upcomingReceivables.length === 0 ? (
                        <p className="py-6 text-center text-xs text-gray-400">
                          Semua piutang telah lunas.
                        </p>
                      ) : (
                        upcomingReceivables.map((inv) => (
                          <div
                            key={inv.id}
                            className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1"
                          >
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-gray-900 truncate">
                                {inv.sellerName}
                              </span>
                              <span className="font-mono font-bold text-rose-700">
                                Rp {inv.remainingBalance.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                              <span>{inv.invoiceNumber}</span>
                              <span className="text-amber-800 font-semibold">
                                Tempo: {inv.dueDate}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveNav('piutang')}
                    className="w-full mt-3 py-2 text-xs text-purple-700 hover:bg-purple-50 rounded-lg font-semibold transition-colors border border-dashed border-purple-300 cursor-pointer"
                  >
                    Buka Buku Piutang Reseller
                  </button>
                </div>

                {/* 3. TRANSAKSI TERBARU */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-teal-600" />
                        <h4 className="font-bold text-sm text-gray-900">
                          Transaksi Kasir Terkini
                        </h4>
                      </div>
                      <button
                        onClick={() => setActiveNav('laporan-penjualan')}
                        className="text-xs text-teal-700 hover:underline font-semibold cursor-pointer"
                      >
                        Rekapitulasi
                      </button>
                    </div>

                    <div className="space-y-2 mt-3">
                      {recentTransactions.map((inv) => {
                        const hasProof = inv.paymentMethod === 'Transfer Bank' || !!inv.paymentProofImage;
                        return (
                          <div
                            key={inv.id}
                            className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="text-xs font-bold font-mono text-gray-900">
                                {inv.invoiceNumber}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                {inv.paymentMethod} · {inv.cashierName}
                              </p>
                              {hasProof && (
                                <button
                                  type="button"
                                  onClick={() => setSelectedProofInvoice(inv)}
                                  className="mt-1 px-2 py-0.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
                                  title="Lihat foto bukti transfer bank rekening owner"
                                >
                                  <ImageIcon className="w-3 h-3" />
                                  <span>Lihat Bukti Transfer</span>
                                </button>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs font-bold font-mono text-teal-700">
                                Rp {inv.total.toLocaleString('id-ID')}
                              </p>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                                {inv.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveNav('laporan-keuangan')}
                    className="w-full mt-3 py-2 text-xs text-teal-700 hover:bg-teal-50 rounded-lg font-semibold transition-colors border border-dashed border-teal-300 cursor-pointer"
                  >
                    Buka Laporan Keuangan Lengkap
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KATALOG PRODUK */}
          {activeNav === 'produk' && <ProductManagement />}

          {/* TAB 2B: KONTROL STOK */}
          {activeNav === 'stok' && <StockControl />}

          {/* TAB 3: MITRA SELLER */}
          {activeNav === 'seller' && <SellerManagement />}

          {/* TAB 4: BUKU PIUTANG */}
          {activeNav === 'piutang' && <ReceivablesManagement />}

          {/* TAB 5A: LAPORAN PENJUALAN & PERFORMA PRODUK */}
          {activeNav === 'laporan-penjualan' && <SalesReport />}

          {/* TAB 5B: LAPORAN KEUANGAN */}
          {activeNav === 'laporan-keuangan' && <FinancialReports />}

          {/* TAB 6: PENGATURAN TOKO */}
          {activeNav === 'pengaturan' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                      Pengaturan Toko &amp; Sistem
                    </h1>
                    <span className="bg-teal-100 text-teal-800 font-semibold text-xs px-2 py-0.5 rounded">
                      KONFIGURASI
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Kelola profil usaha Tino Underwear, jam operasional, rekening bank pembayaran, dan struk kasir.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={resetToDefaultData}
                    className="px-3.5 py-2 border border-red-300 text-red-600 hover:bg-red-50 font-medium rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reset Data Demo</span>
                  </button>
                </div>
              </div>

              {settingsSavedMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs sm:text-sm text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                  <span>Pengaturan toko berhasil diperbarui dan tersimpan di sistem.</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-6">
                {/* 1. Informasi Bisnis UMKM */}
                <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                    <Store className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-base text-gray-900">
                      Identitas Toko Fisik Tino Underwear
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Nama Usaha / Merk Dagang
                      </label>
                      <input
                        type="text"
                        value={storeInfo.name}
                        onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Tagline / Slogan Toko
                      </label>
                      <input
                        type="text"
                        value={storeInfo.tagline}
                        onChange={(e) => setStoreInfo({ ...storeInfo, tagline: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-gray-700 mb-1">
                        Alamat Lengkap Toko Fisik (Bekasi)
                      </label>
                      <input
                        type="text"
                        value={storeInfo.address}
                        onChange={(e) => setStoreInfo({ ...storeInfo, address: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Nomor WhatsApp Resmi
                      </label>
                      <input
                        type="text"
                        value={storeInfo.phone}
                        onChange={(e) => setStoreInfo({ ...storeInfo, phone: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Email Resmi Bisnis
                      </label>
                      <input
                        type="email"
                        value={storeInfo.email}
                        onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Rekening Pembayaran Transfer */}
                <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                    <CreditCard className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-base text-gray-900">
                      Rekening Bank Pembayaran Resmi
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Nama Bank
                      </label>
                      <input
                        type="text"
                        value={storeInfo.bankAccountOwner}
                        onChange={(e) => setStoreInfo({ ...storeInfo, bankAccountOwner: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Nomor Rekening &amp; Atas Nama
                      </label>
                      <input
                        type="text"
                        value={storeInfo.bankAccount}
                        onChange={(e) => setStoreInfo({ ...storeInfo, bankAccount: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Operasional & Struk Kasir */}
                <div className="bg-white p-5 sm:p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-gray-100">
                    <Printer className="w-5 h-5 text-teal-600" />
                    <h3 className="font-bold text-base text-gray-900">
                      Operasional &amp; Struk Kasir (POS)
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Jam Buka Toko
                      </label>
                      <input
                        type="time"
                        value={storeInfo.storeOpenTime}
                        onChange={(e) => setStoreInfo({ ...storeInfo, storeOpenTime: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Jam Tutup Toko
                      </label>
                      <input
                        type="time"
                        value={storeInfo.storeCloseTime}
                        onChange={(e) => setStoreInfo({ ...storeInfo, storeCloseTime: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">
                        Batas Minimum Stok Global (pcs)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={storeInfo.minStockDefault}
                        onChange={(e) => setStoreInfo({ ...storeInfo, minStockDefault: Number(e.target.value) })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <label className="block font-semibold text-gray-700 mb-1">
                        Pesan Catatan Kaki pada Struk Kasir (Receipt Footer)
                      </label>
                      <textarea
                        rows={2}
                        value={storeInfo.receiptFooter}
                        onChange={(e) => setStoreInfo({ ...storeInfo, receiptFooter: e.target.value })}
                        className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Versi Sistem: <strong className="text-gray-800">TUMIN v1.0 Production Release</strong>
                    </span>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan Pengaturan</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Payment Proof Modal for Owner */}
      <PaymentProofModal
        isOpen={!!selectedProofInvoice}
        onClose={() => setSelectedProofInvoice(null)}
        invoice={selectedProofInvoice}
      />
    </div>
  );
};
