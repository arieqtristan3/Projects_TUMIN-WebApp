import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice } from '../../types';
import { StatusBadge, Badge } from '../common/Badge';
import { ChamferCard } from '../common/ChamferCard';
import { StitchDivider } from '../common/StitchDivider';
import { getProductSampleImage } from '../../utils/productImages';
import {
  Home,
  Package,
  Receipt,
  History,
  User,
  CreditCard,
  Calendar,
  AlertCircle,
  Phone,
  Store,
  MapPin,
  ChevronRight,
  Sparkles,
  LogOut,
  Clock,
  CheckCircle2,
  ExternalLink,
  X,
  Search,
  Filter,
  TrendingUp,
  Building2,
  ArrowUpRight,
  ShieldCheck,
  Check,
  Copy,
  Layers,
  ShoppingBag,
  Info,
} from 'lucide-react';

interface SellerPortalProps {
  onLogout?: () => void;
}

export const SellerPortal: React.FC<SellerPortalProps> = ({ onLogout }) => {
  const { currentUser, sellers, invoices, consignedItems, products, logout } = useApp();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'beranda' | 'stok' | 'tagihan' | 'riwayat' | 'profil'>(() => {
    return (sessionStorage.getItem('tumin_seller_active_tab') as any) || 'beranda';
  });

  useEffect(() => {
    sessionStorage.setItem('tumin_seller_active_tab', activeTab);
  }, [activeTab]);

  // Search & filter states
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('Semua');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState<'semua' | 'unpaid' | 'paid'>('semua');
  const [copiedBank, setCopiedBank] = useState(false);

  // Invoice Detail Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Identify current seller
  const currentSeller = useMemo(() => {
    if (!currentUser) return sellers[0];
    const match = sellers.find(
      (s) =>
        s.id === currentUser.id ||
        (currentUser.username && s.username === currentUser.username) ||
        (currentUser.phone && s.phone === currentUser.phone) ||
        (currentUser.email && s.email === currentUser.email)
    );
    return match || sellers[0];
  }, [currentUser, sellers]);

  // Seller's invoices
  const sellerInvoices = useMemo(() => {
    return invoices.filter(
      (inv) =>
        inv.sellerId === currentSeller.id ||
        (inv.sellerName && inv.sellerName.toLowerCase().includes(currentSeller.name.toLowerCase()))
    );
  }, [invoices, currentSeller]);

  // Filtered invoices for Tab 3
  const filteredInvoices = useMemo(() => {
    return sellerInvoices.filter((inv) => {
      if (invoiceFilterStatus === 'unpaid') return inv.remainingBalance > 0;
      if (invoiceFilterStatus === 'paid') return inv.remainingBalance === 0;
      return true;
    });
  }, [sellerInvoices, invoiceFilterStatus]);

  // Seller's consigned stock items
  const myConsignedItems = useMemo(() => {
    return consignedItems.filter((item) => item.sellerId === currentSeller.id);
  }, [consignedItems, currentSeller]);

  // Filtered consigned stock
  const filteredStock = useMemo(() => {
    return myConsignedItems.filter(
      (item) =>
        item.productName.toLowerCase().includes(stockSearchQuery.toLowerCase()) ||
        item.productSku.toLowerCase().includes(stockSearchQuery.toLowerCase())
    );
  }, [myConsignedItems, stockSearchQuery]);

  // Synchronized available products from central inventory (Owner & Cashier)
  const filteredAvailableProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchCategory =
        catalogCategory === 'Semua' || prod.category === catalogCategory;
      const matchSearch =
        catalogSearch.trim() === '' ||
        prod.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        prod.sku.toLowerCase().includes(catalogSearch.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [products, catalogCategory, catalogSearch]);

  // Metric stats
  const metrics = useMemo(() => {
    const totalTagihan = sellerInvoices.reduce((acc, curr) => acc + curr.total, 0);
    const tagihanBelumDibayar = sellerInvoices.reduce((acc, curr) => acc + curr.remainingBalance, 0);
    const totalSudahDibayar = sellerInvoices.reduce((acc, curr) => acc + curr.amountPaid, 0);
    const totalStokPcs = myConsignedItems.reduce((acc, curr) => acc + curr.quantityHeld, 0);

    // Closest unpaid due date
    const unpaidInvoices = sellerInvoices.filter((i) => i.remainingBalance > 0 && i.dueDate);
    const closestDue = unpaidInvoices.length > 0 ? unpaidInvoices[0].dueDate : '-';

    return {
      totalTagihan,
      tagihanBelumDibayar,
      totalSudahDibayar,
      totalStokPcs: totalStokPcs || 43,
      closestDue,
    };
  }, [sellerInvoices, myConsignedItems]);

  // Payment history for this seller
  const paymentHistory = useMemo(() => {
    const history: {
      id: string;
      invoiceNumber: string;
      date: string;
      amount: number;
      method: string;
      recordedBy: string;
      notes?: string;
    }[] = [];

    for (const inv of sellerInvoices) {
      for (const inst of inv.installments) {
        history.push({
          id: inst.id,
          invoiceNumber: inv.invoiceNumber,
          date: inst.date,
          amount: inst.amount,
          method: inst.method,
          recordedBy: inst.recordedBy,
          notes: inst.notes,
        });
      }
    }

    return history.sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [sellerInvoices]);

  const handleCopyAccount = () => {
    navigator.clipboard.writeText('5210892234');
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleLogoutAction = () => {
    if (onLogout) onLogout();
    else logout();
  };

  const navItems = [
    { key: 'beranda' as const, label: 'Beranda', shortLabel: 'Beranda', icon: Home },
    { key: 'stok' as const, label: 'Stok Barang Tempo', shortLabel: 'Barang Tempo', icon: Package, badge: `${metrics.totalStokPcs} pcs` },
    { key: 'tagihan' as const, label: 'Tagihan & Piutang', shortLabel: 'Tagihan', icon: Receipt, badge: metrics.tagihanBelumDibayar > 0 ? 'Aktif' : undefined },
    { key: 'riwayat' as const, label: 'Riwayat Setoran', shortLabel: 'Setoran', icon: History },
    { key: 'profil' as const, label: 'Profil Kios', shortLabel: 'Profil', icon: Store },
  ];

  return (
    <div className="min-h-screen bg-fabric-pattern bg-[#F8FAF9] text-[#10241D] flex flex-col font-sans">
      {/* ================= DESKTOP & TABLET TOP NAVIGATION BAR ================= */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#047857]/20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Portal Title (neat & uncluttered) */}
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold font-display bg-gradient-to-r from-[#047857] to-[#6D28D9] bg-clip-text text-transparent tracking-tight">
                TUMIN
              </span>
              <span className="hidden sm:inline-block text-[11px] font-mono font-semibold text-[#047857] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Portal Mitra Seller
              </span>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-2 lg:gap-2.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveTab(item.key)}
                    className={`px-3.5 py-2 lg:px-4 lg:py-2 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer select-none active:scale-95 flex items-center gap-2 ${
                      isActive
                        ? 'bg-[#047857] text-white shadow-sm ring-1 ring-emerald-500/50'
                        : 'text-[#4B6359] hover:text-[#10241D] hover:bg-stone-100/90 hover:scale-103'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                          isActive
                            ? 'bg-emerald-800 text-emerald-100'
                            : 'bg-stone-200 text-stone-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* User Profile & Logout Action */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden sm:block text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span className="text-xs font-bold text-[#10241D] truncate max-w-[150px]">
                    {currentSeller.name}
                  </span>
                  <StatusBadge status={currentSeller.status} size="sm" />
                </div>
                <span className="text-[10px] text-[#4B6359] font-mono-num">
                  {currentSeller.phone}
                </span>
              </div>

              <div className="sm:hidden flex items-center gap-1">
                <span className="text-xs font-bold text-[#10241D]">
                  {currentSeller.name.split(' ')[0]}
                </span>
              </div>

              <div className="h-6 w-px bg-stone-200 hidden sm:block" />

              <button
                onClick={handleLogoutAction}
                className="px-2.5 py-1.5 text-stone-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium border border-transparent hover:border-rose-200"
                title="Keluar dari Akun Seller"
                aria-label="Keluar Akun"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN CONTENT VIEWPORT ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-10">
        {/* ================= TAB 1: BERANDA ================= */}
        {activeTab === 'beranda' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Welcome banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-purple-950 text-white rounded-xl shadow-md border border-emerald-500/30">
              <div>
                <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kemitraan Resmi Tino Underwear</span>
                </div>
                <h2 className="text-lg sm:text-2xl font-bold mt-1">
                  Selamat Datang, {currentSeller.name.split(' ')[0]} 👋
                </h2>
                <p className="text-xs sm:text-sm text-stone-300 mt-1">
                  Kios <span className="text-white font-semibold">{currentSeller.storeName}</span> · {currentSeller.address}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <a
                  href="https://wa.me/6281298765432"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Hubungi Admin Gudang</span>
                </a>
              </div>
            </div>

            {/* THREE KPI METRIC CARDS (Desktop 3-columns, Mobile stacked) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Tagihan Belum Dibayar (Highlighted) */}
              <ChamferCard
                dark={false}
                className="p-5 bg-white border-2 border-rose-300 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-rose-800 font-semibold mb-1">
                    <span>Sisa Tagihan Belum Lunas</span>
                    <CreditCard className="w-4 h-4 text-rose-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold font-mono-num text-rose-700 mt-1">
                    Rp {metrics.tagihanBelumDibayar.toLocaleString('id-ID')}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Dari total tagihan Rp {metrics.totalTagihan.toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-dashed border-rose-200 flex items-center justify-between text-xs">
                  <span className="text-stone-600">Jatuh Tempo Terdekat:</span>
                  <span className="font-bold font-mono-num text-rose-700">
                    {metrics.closestDue}
                  </span>
                </div>
              </ChamferCard>

              {/* Card 2: Total Setoran Masuk */}
              <ChamferCard
                dark={false}
                className="p-5 bg-white border border-[#047857]/30 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#047857] font-semibold mb-1">
                    <span>Total Cicilan Telah Disetor</span>
                    <TrendingUp className="w-4 h-4 text-[#047857]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono-num text-[#047857] mt-1">
                    Rp {metrics.totalSudahDibayar.toLocaleString('id-ID')}
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    Tercatat {paymentHistory.length} kali setoran cicilan
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-dashed border-emerald-200 flex items-center justify-between text-xs">
                  <span className="text-stone-600">Total Transaksi:</span>
                  <span className="font-semibold text-stone-800 font-mono-num">
                    {sellerInvoices.length} Faktur
                  </span>
                </div>
              </ChamferCard>

              {/* Card 3: Stok Barang Tempo Dipegang */}
              <ChamferCard
                dark={false}
                className="p-5 bg-white border border-[#6D28D9]/30 shadow-sm sm:col-span-2 lg:col-span-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#6D28D9] font-semibold mb-1">
                    <span>Stok Barang Tempo di Kios Anda</span>
                    <Package className="w-4 h-4 text-[#6D28D9]" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono-num text-[#6D28D9] mt-1">
                    {metrics.totalStokPcs} pcs
                  </div>
                  <p className="text-xs text-stone-500 mt-1">
                    {myConsignedItems.length} jenis SKU celana dalam & pakaian dalam
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-dashed border-purple-200 flex items-center justify-between text-xs">
                  <span className="text-stone-600">Status Stok:</span>
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Siap Dijual
                  </span>
                </div>
              </ChamferCard>
            </div>

            {/* TWO-COLUMN SECTION ON DESKTOP: Invoices & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Tagihan Aktif & Faktur Tempo (2 cols on lg) */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#047857]" />
                    <h3 className="font-bold text-sm text-[#10241D]">
                      Daftar Faktur & Tagihan Berjalan
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('tagihan')}
                    className="text-xs font-semibold text-[#047857] hover:underline"
                  >
                    Lihat Semua Faktur &rarr;
                  </button>
                </div>

                {sellerInvoices.length === 0 ? (
                  <p className="py-8 text-center text-xs text-stone-400">
                    Belum ada faktur piutang untuk toko Anda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sellerInvoices.slice(0, 4).map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-3.5 bg-stone-50 hover:bg-emerald-50/50 rounded-lg border border-stone-200 hover:border-[#047857] transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono-num font-bold text-xs text-[#10241D]">
                              {inv.invoiceNumber}
                            </span>
                            <StatusBadge status={inv.status} size="sm" />
                          </div>
                          <p className="text-xs text-stone-500 mt-1">
                            {inv.items.length} item barang · Diambil pada {inv.date}
                          </p>
                          <p className="text-xs text-rose-700 font-semibold font-mono-num mt-0.5">
                            Jatuh Tempo: {inv.dueDate}
                          </p>
                        </div>

                        <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                          <span className="text-[11px] text-stone-500 block">Total Faktur:</span>
                          <span className="text-sm font-bold font-mono-num text-[#10241D]">
                            Rp {inv.total.toLocaleString('id-ID')}
                          </span>
                          <span className="text-xs font-bold font-mono-num text-rose-700 block mt-0.5">
                            Sisa: Rp {inv.remainingBalance.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: Rekening Pembayaran & Info Kemitraan */}
              <div className="space-y-4">
                {/* Rekening Transfer Owner */}
                <ChamferCard dark={false} className="p-5 bg-purple-50/70 border border-purple-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#6D28D9]">
                      <Building2 className="w-4 h-4 text-[#6D28D9]" />
                      <span>Rekening Transfer Resmi Owner</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAccount}
                      className="text-[11px] font-semibold text-[#6D28D9] hover:underline flex items-center gap-1"
                    >
                      {copiedBank ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Salin Rekening</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-3 bg-white rounded-lg border border-purple-200 font-mono-num">
                    <p className="font-extrabold text-sm text-[#10241D]">
                      BCA: 521-089-2234
                    </p>
                    <p className="text-xs text-stone-600 font-sans mt-0.5 font-medium">
                      a.n Tino (Owner Tino Underwear)
                    </p>
                  </div>

                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Setoran cicilan atau pelunasan faktur dapat ditransfer ke rekening di atas, lalu konfirmasikan bukti transfer ke kasir atau admin toko.
                  </p>
                </ChamferCard>

                {/* Aktivitas Terkini */}
                <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-stone-700">
                    Aktivitas Terbaru
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-[#047857] flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">
                          Setoran Cicilan Tervalidasi
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono-num">
                          Rp 350.000 · Kasir: Siti Rahma
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5 pt-2 border-t border-dashed border-stone-100">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-[#6D28D9] flex items-center justify-center shrink-0 mt-0.5">
                        <Package className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="font-semibold text-stone-900">
                          Faktur Barang Tempo Aktif
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono-num">
                          #INV-20261004-001 (Kranji, Bekasi)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: STOK BARANG TEMPO & KATALOG PRODUK TERSEDIA ================= */}
        {activeTab === 'stok' && (
          <div className="space-y-8 animate-in fade-in duration-150">
            {/* SECTION A: Stok Barang Tempo yang Sedang Dipegang Kios */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-[#047857] uppercase tracking-wider flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5" />
                    Inventaris Titip Jual Kios Anda
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#10241D] mt-0.5">
                    Stok Barang Tempo yang Dipegang
                  </h2>
                  <p className="text-xs text-[#4B6359] mt-0.5">
                    Produk resmi Tino Underwear yang saat ini dititipkan dan aktif dijual di kios Anda.
                  </p>
                </div>

                {/* Search bar for held stock */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={stockSearchQuery}
                    onChange={(e) => setStockSearchQuery(e.target.value)}
                    placeholder="Cari SKU atau nama barang dipegang..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-lg shadow-xs focus:outline-none focus:border-[#047857]"
                  />
                </div>
              </div>

              {/* Desktop Table View / Mobile Cards */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
                  <span className="text-xs font-semibold text-stone-700">
                    Daftar Barang Tempo Dipegang ({filteredStock.length} SKU)
                  </span>
                  <span className="text-xs text-[#047857] font-mono-num font-semibold">
                    Total: {metrics.totalStokPcs} pcs
                  </span>
                </div>

                {filteredStock.length === 0 ? (
                  <div className="p-10 text-center text-xs text-stone-400">
                    Tidak ada barang tempo yang sesuai pencarian.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-stone-50/80 text-[#4B6359] uppercase font-semibold border-b border-stone-200">
                        <tr>
                          <th className="py-3 px-4">Foto & Produk</th>
                          <th className="py-3 px-4 text-center">Stok Dipegang</th>
                          <th className="py-3 px-4">Harga Modal Mitra</th>
                          <th className="py-3 px-4">Rekomendasi Jual</th>
                          <th className="py-3 px-4">Estimasi Untung / pcs</th>
                          <th className="py-3 px-4">Tanggal Titip</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {filteredStock.map((item) => {
                          const margin = item.recommendedSellPrice - item.unitPrice;
                          const sampleImg = getProductSampleImage('', item.productSku);
                          return (
                            <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={sampleImg}
                                    alt={item.productName}
                                    className="w-12 h-12 object-cover rounded-lg border border-stone-200 bg-white shrink-0 shadow-xs"
                                  />
                                  <div>
                                    <span className="font-mono-num font-bold text-[#047857] text-[11px] block">
                                      {item.productSku}
                                    </span>
                                    <span className="font-semibold text-stone-900 text-xs">
                                      {item.productName}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className="font-mono-num font-bold px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-full border border-emerald-300">
                                  {item.quantityHeld} pcs
                                </span>
                              </td>
                              <td className="py-3.5 px-4 font-mono-num text-stone-700">
                                Rp {item.unitPrice.toLocaleString('id-ID')}
                              </td>
                              <td className="py-3.5 px-4 font-mono-num font-bold text-[#047857]">
                                Rp {item.recommendedSellPrice.toLocaleString('id-ID')}
                              </td>
                              <td className="py-3.5 px-4 font-mono-num text-[#6D28D9] font-semibold">
                                +Rp {margin.toLocaleString('id-ID')}
                              </td>
                              <td className="py-3.5 px-4 font-mono-num text-stone-500">
                                {item.assignedDate}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION B: KATALOG PRODUK TERSEDIA DI GUDANG PUSAT (TERSINKRON KASIR & OWNER) */}
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-dashed border-stone-300 pt-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#6D28D9] uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="w-3.5 h-3.5" />
                      Katalog Gudang Pusat Tino Underwear
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-[#047857] font-bold px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live Sinkron Kasir & Owner
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-[#10241D] mt-0.5">
                    Produk Tersedia untuk Pengambilan Barang Tempo
                  </h3>
                  <p className="text-xs text-[#4B6359] mt-0.5">
                    Seluruh produk dan stok realtime yang tersinkronisasi langsung dari sistem kasir POS dan pantauan Owner.
                  </p>
                </div>

                {/* Filter and Search */}
                <div className="flex items-center gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Cari varian atau SKU gudang..."
                      className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-lg shadow-xs focus:outline-none focus:border-[#047857]"
                    />
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {['Semua', 'CD Pria', 'CD Wanita', 'Anak-Anak', 'Korset'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCatalogCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer select-none active:scale-95 whitespace-nowrap ${
                      catalogCategory === cat
                        ? 'bg-[#6D28D9] text-white shadow-sm ring-1 ring-purple-400/50'
                        : 'bg-white text-stone-600 border border-stone-200 hover:border-[#6D28D9]/40 hover:text-stone-900'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Product Cards Grid with Realtime Stock & Sample Images */}
              {filteredAvailableProducts.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed border-stone-300 text-xs text-stone-500">
                  Tidak ada produk yang sesuai filter.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredAvailableProducts.map((prod) => {
                    const sampleImage = getProductSampleImage(prod.category, prod.sku);
                    const isOutOfStock = prod.stock <= 0;
                    const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock;

                    return (
                      <div
                        key={prod.id}
                        className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md ${
                          isOutOfStock
                            ? 'border-stone-200 opacity-60'
                            : 'border-stone-200 hover:border-[#047857]/40'
                        }`}
                      >
                        <div>
                          {/* Image Thumbnail with Category Badge */}
                          <div className="relative aspect-square w-full bg-stone-100 overflow-hidden border-b border-stone-100">
                            <img
                              src={sampleImage}
                              alt={prod.name}
                              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                            />
                            <div className="absolute top-2 left-2">
                              <span className="text-[10px] font-semibold font-mono px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-xs text-stone-800 shadow-xs border border-stone-200/60">
                                {prod.category}
                              </span>
                            </div>
                            <div className="absolute top-2 right-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${
                                  isOutOfStock
                                    ? 'bg-rose-600 text-white'
                                    : isLowStock
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-emerald-600 text-white'
                                }`}
                              >
                                {isOutOfStock
                                  ? 'Stok Habis'
                                  : isLowStock
                                  ? `Sisa ${prod.stock} (Menipis)`
                                  : `Tersedia: ${prod.stock} ${prod.unit}`}
                              </span>
                            </div>
                          </div>

                          {/* Product Info */}
                          <div className="p-3.5 space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-mono-num font-bold text-[#047857]">
                                {prod.sku}
                              </span>
                              <span className="text-stone-400 text-[10px] font-mono-num">
                                Update: {prod.lastUpdated.split(' ')[0]}
                              </span>
                            </div>

                            <h4 className="text-xs sm:text-sm font-bold text-[#10241D] line-clamp-2 leading-snug">
                              {prod.name}
                            </h4>

                            {prod.description && (
                              <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                                {prod.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price & Action Footer */}
                        <div className="p-3.5 pt-2 border-t border-stone-100 bg-stone-50/50 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-stone-500 block">
                                Rekomendasi Jual:
                              </span>
                              <span className="text-xs sm:text-sm font-bold font-mono-num text-[#047857]">
                                Rp {prod.price.toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-stone-500 block">
                                Modal Tempo Mitra:
                              </span>
                              <span className="text-xs font-mono-num font-semibold text-stone-700">
                                Rp {Math.round(prod.price * 0.8).toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>

                          <a
                            href={`https://wa.me/6281298765432?text=${encodeURIComponent(
                              `Halo Admin Tino Underwear, saya dari kios ${currentSeller.storeName} (${currentSeller.name}) ingin reservasi pengambilan barang tempo produk: ${prod.name} (${prod.sku}). Apakah stok tersedia?`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-1.5 px-3 bg-white hover:bg-emerald-50 text-[#047857] hover:text-[#065F46] border border-emerald-300 hover:border-emerald-400 text-[11px] font-semibold rounded-lg shadow-xs flex items-center justify-center gap-1.5 transition-all duration-150 cursor-pointer select-none active:scale-95"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Reservasi Tempo ke Admin</span>
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Restock CTA Card */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-50 to-purple-50 rounded-xl border border-emerald-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[#10241D]">
                  Butuh Tambahan Stok atau Varian Baru?
                </h4>
                <p className="text-xs text-stone-600">
                  Hubungi admin gudang Tino Underwear untuk reservasi pengambilan barang tempo baru ke kios Anda.
                </p>
              </div>

              <a
                href="https://wa.me/6281298765432"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-2 self-start sm:self-center transition-colors shrink-0 cursor-pointer select-none active:scale-95"
              >
                <Phone className="w-4 h-4" />
                <span>Kirim Pesan WA ke Admin</span>
              </a>
            </div>
          </div>
        )}

        {/* ================= TAB 3: TAGIHAN & PIUTANG ================= */}
        {activeTab === 'tagihan' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">
                  Kewajiban Pembayaran
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#10241D] mt-0.5">
                  Daftar Faktur & Riwayat Piutang
                </h2>
                <p className="text-xs text-[#4B6359] mt-0.5">
                  Pantau tagihan jatuh tempo, rincian produk yang diambil, dan progres pelunasan cicilan.
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-200/70 rounded-lg">
                <button
                  onClick={() => setInvoiceFilterStatus('semua')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    invoiceFilterStatus === 'semua'
                      ? 'bg-white text-[#10241D] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Semua ({sellerInvoices.length})
                </button>
                <button
                  onClick={() => setInvoiceFilterStatus('unpaid')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    invoiceFilterStatus === 'unpaid'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Belum Lunas
                </button>
                <button
                  onClick={() => setInvoiceFilterStatus('paid')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    invoiceFilterStatus === 'paid'
                      ? 'bg-white text-[#047857] shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Lunas
                </button>
              </div>
            </div>

            {/* Invoices List / Table */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-50 border-b border-stone-200 text-[#4B6359] uppercase font-semibold">
                    <tr>
                      <th className="py-3 px-4">No. Faktur</th>
                      <th className="py-3 px-4">Tanggal Pengambilan</th>
                      <th className="py-3 px-4">Jatuh Tempo</th>
                      <th className="py-3 px-4">Total Faktur</th>
                      <th className="py-3 px-4">Sudah Dibayar</th>
                      <th className="py-3 px-4">Sisa Piutang</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-stone-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono-num font-bold text-[#10241D]">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-3.5 px-4 font-mono-num text-stone-600">
                          {inv.date}
                        </td>
                        <td className="py-3.5 px-4 font-mono-num font-bold text-rose-700">
                          {inv.dueDate}
                        </td>
                        <td className="py-3.5 px-4 font-mono-num font-semibold text-stone-900">
                          Rp {inv.total.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 font-mono-num text-emerald-700 font-semibold">
                          Rp {inv.amountPaid.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4 font-mono-num font-bold text-rose-700">
                          Rp {inv.remainingBalance.toLocaleString('id-ID')}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={inv.status} size="sm" />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-[#047857] hover:text-white text-stone-700 font-semibold rounded text-[11px] transition-colors"
                          >
                            Rincian
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 4: RIWAYAT SETORAN ================= */}
        {activeTab === 'riwayat' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div>
              <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">
                Catatan Transaksi Uang
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#10241D] mt-0.5">
                Riwayat Pembayaran & Setoran Cicilan
              </h2>
              <p className="text-xs text-[#4B6359] mt-0.5">
                Semua uang setoran yang telah diserahkan dan divalidasi oleh kasir Tino Underwear Bekasi.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700">
                  Log Setoran Valid ({paymentHistory.length} Kali)
                </span>
                <span className="text-xs font-mono-num font-bold text-[#047857]">
                  Total Terbayar: Rp {metrics.totalSudahDibayar.toLocaleString('id-ID')}
                </span>
              </div>

              {paymentHistory.length === 0 ? (
                <div className="p-10 text-center text-xs text-stone-400">
                  Belum ada log setoran cicilan yang tercatat.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-stone-50/80 text-[#4B6359] uppercase font-semibold border-b border-stone-200">
                      <tr>
                        <th className="py-3 px-4">Waktu Setor</th>
                        <th className="py-3 px-4">No. Faktur Terkait</th>
                        <th className="py-3 px-4">Metode Pembayaran</th>
                        <th className="py-3 px-4">Jumlah Setoran</th>
                        <th className="py-3 px-4">Kasir yang Mencatat</th>
                        <th className="py-3 px-4">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {paymentHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono-num text-stone-700">
                            {item.date}
                          </td>
                          <td className="py-3 px-4 font-mono-num font-bold text-[#10241D]">
                            {item.invoiceNumber}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-800 rounded font-semibold text-[11px]">
                              {item.method}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono-num font-bold text-[#047857] text-sm">
                            +Rp {item.amount.toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 text-stone-700">
                            {item.recordedBy}
                          </td>
                          <td className="py-3 px-4 text-stone-500 italic text-[11px]">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: PROFIL KIOS & KEMITRAAN ================= */}
        {activeTab === 'profil' && (
          <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl">
            <div>
              <span className="text-xs font-bold text-[#047857] uppercase tracking-wider">
                Informasi Akun
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#10241D] mt-0.5">
                Profil Mitra Reseller & Ketentuan
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile Card */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                  <h3 className="font-bold text-sm text-[#10241D]">
                    Identitas Kios & Pemilik
                  </h3>
                  <StatusBadge status={currentSeller.status} size="sm" />
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-stone-400 text-[11px] block">Nama Pemilik:</span>
                    <span className="font-bold text-sm text-[#10241D]">
                      {currentSeller.name}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] block">Nama Toko / Kios:</span>
                    <span className="font-semibold text-stone-800">
                      {currentSeller.storeName}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] block">Nomor WhatsApp:</span>
                    <span className="font-mono-num font-semibold text-[#047857]">
                      {currentSeller.phone}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] block">Email:</span>
                    <span className="font-mono-num text-stone-700">
                      {currentSeller.email}
                    </span>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] block">Alamat Usaha:</span>
                    <p className="text-stone-700 leading-relaxed mt-0.5">
                      {currentSeller.address}
                    </p>
                  </div>

                  <div>
                    <span className="text-stone-400 text-[11px] block">Bergabung Sejak:</span>
                    <span className="font-mono-num text-stone-600">
                      {currentSeller.registeredDate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Terms & Guidelines */}
              <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-[#10241D] pb-3 border-b border-stone-200">
                    SOP & Ketentuan Barang Tempo
                  </h3>

                  <ul className="space-y-2.5 text-xs text-stone-600 mt-3 list-disc pl-4 leading-relaxed">
                    <li>
                      <strong>Jatuh Tempo:</strong> Pembayaran cicilan dilakukan maksimal sesuai tanggal jatuh tempo faktur (14-30 hari).
                    </li>
                    <li>
                      <strong>Retur Barang Rusak:</strong> Produk cacat produksi dapat ditukar langsung ke toko pusat dengan SKU sejenis.
                    </li>
                    <li>
                      <strong>Metode Pembayaran:</strong> Bisa setor tunai langsung di kasir toko atau transfer bank ke rekening BCA Owner Tino.
                    </li>
                    <li>
                      <strong>Penambahan Stok:</strong> Dapat diajukan setiap hari kerja melalui WhatsApp admin gudang.
                    </li>
                  </ul>
                </div>

                <div className="pt-4 border-t border-stone-200 space-y-2">
                  <a
                    href="https://wa.me/6281298765432"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 px-4 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold rounded-md shadow-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Hubungi Admin Toko via WhatsApp</span>
                  </a>

                  <button
                    onClick={handleLogoutAction}
                    className="w-full py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-md transition-colors"
                  >
                    Keluar dari Akun Seller
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ================= MOBILE BOTTOM NAVIGATION BAR (<md screens only) ================= */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 py-2 px-3 flex items-center justify-around gap-1 shadow-lg">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;
          return (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className={`flex flex-col items-center py-1 px-2.5 min-w-[56px] rounded-lg transition-all duration-150 cursor-pointer select-none active:scale-90 relative ${
                isActive
                  ? 'text-[#047857] font-bold bg-emerald-50/70 shadow-xs ring-1 ring-emerald-200/50'
                  : 'text-[#4B6359] hover:text-[#10241D] hover:bg-stone-100/80'
              }`}
            >
              <Icon className="w-5 h-5 transition-transform duration-150 active:scale-110" />
              <span className="text-[10px] font-semibold mt-0.5">{item.shortLabel}</span>
              {item.badge && isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#047857] absolute top-1 right-2.5 ring-1 ring-white" />
              )}
            </button>
          );
        })}
      </nav>

      {/* ================= INVOICE DETAIL MODAL ================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <ChamferCard dark={false} className="p-6 bg-white border border-[#047857]/40 shadow-2xl">
              <div className="flex items-start justify-between pb-3 border-b border-stone-200">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#047857] font-semibold">
                    Rincian Faktur Barang Tempo
                  </span>
                  <h3 className="text-base sm:text-lg font-bold font-mono-num text-[#10241D]">
                    {selectedInvoice.invoiceNumber}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
                  aria-label="Tutup Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 pt-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Status Faktur:</span>
                  <StatusBadge status={selectedInvoice.status} size="sm" />
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Jatuh Tempo:</span>
                  <span className="font-semibold font-mono-num text-rose-700">
                    {selectedInvoice.dueDate}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Tanggal Pengambilan:</span>
                  <span className="font-mono-num text-stone-800">{selectedInvoice.date}</span>
                </div>

                {/* Items list */}
                <div className="py-2 border-y border-dashed border-stone-200 space-y-2">
                  <p className="font-semibold text-stone-700 text-xs">Item Barang yang Diambil:</p>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {selectedInvoice.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-stone-50 rounded">
                        <div className="min-w-0 pr-2">
                          <p className="font-semibold text-stone-900 truncate">{it.productName}</p>
                          <p className="text-[10px] text-stone-500 font-mono-num">
                            {it.productSku} · {it.quantity} pcs @ Rp {it.unitPrice.toLocaleString('id-ID')}
                          </p>
                        </div>
                        <span className="font-mono-num font-bold text-stone-900 shrink-0">
                          Rp {it.subtotal.toLocaleString('id-ID')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Calculation summary */}
                <div className="space-y-1.5 bg-stone-50 p-3 rounded-lg border border-stone-200">
                  <div className="flex justify-between text-stone-600">
                    <span>Total Tagihan:</span>
                    <span className="font-mono-num font-bold">
                      Rp {selectedInvoice.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Sudah Dibayar:</span>
                    <span className="font-mono-num">
                      Rp {selectedInvoice.amountPaid.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-700 font-bold border-t border-stone-300 pt-1 text-sm">
                    <span>Sisa Piutang:</span>
                    <span className="font-mono-num">
                      Rp {selectedInvoice.remainingBalance.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Installments History */}
                {selectedInvoice.installments.length > 0 && (
                  <div>
                    <p className="font-semibold text-stone-700 text-xs mb-1.5">
                      Catatan Setoran Cicilan Masuk:
                    </p>
                    <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                      {selectedInvoice.installments.map((inst) => (
                        <div
                          key={inst.id}
                          className="p-2 bg-emerald-50 rounded border border-emerald-200 text-xs flex justify-between items-center font-mono-num"
                        >
                          <div>
                            <span className="font-semibold text-stone-800">{inst.date}</span>
                            <span className="text-[10px] text-stone-500 block">
                              {inst.method} · Kasir: {inst.recordedBy}
                            </span>
                          </div>
                          <span className="font-bold text-[#047857]">
                            +Rp {inst.amount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bank Account for Payment Reminder */}
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-[11px] text-purple-950 flex items-center justify-between">
                  <div>
                    <span className="font-semibold block text-[#6D28D9]">Transfer ke Rekening Owner:</span>
                    <span className="font-mono-num font-bold">BCA 521-089-2234 a.n Tino</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="px-2 py-1 bg-white border border-purple-300 text-[#6D28D9] font-semibold rounded text-[10px]"
                  >
                    {copiedBank ? 'Tersalin' : 'Salin Rek'}
                  </button>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="w-full py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </ChamferCard>
          </div>
        </div>
      )}
    </div>
  );
};
