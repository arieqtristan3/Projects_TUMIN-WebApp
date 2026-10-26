import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Seller, SellerStatus } from '../../types';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Store,
  Phone,
  Mail,
  MapPin,
  Clock,
  AlertCircle,
  X,
  CreditCard,
  Plus,
  Download,
  ShieldCheck,
  Building,
  UserCheck,
  Sliders,
  DollarSign,
  Receipt,
  FileText,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  MessageCircle,
} from 'lucide-react';

export const SellerManagement: React.FC = () => {
  const { sellers, approveSeller, rejectSeller, updateSeller, registerSeller } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | SellerStatus>('Semua');
  const [selectedSellerDetail, setSelectedSellerDetail] = useState<Seller | null>(null);

  // Modals
  const [isAddSellerOpen, setIsAddSellerOpen] = useState(false);
  const [editingCreditSeller, setEditingCreditSeller] = useState<Seller | null>(null);
  const [newCreditLimit, setNewCreditLimit] = useState<number | ''>('');

  // Approval Modal state
  const [approvalModalSeller, setApprovalModalSeller] = useState<Seller | null>(null);
  const [approvalCreditLimit, setApprovalCreditLimit] = useState<number>(5000000);
  const [showApprovalPassword, setShowApprovalPassword] = useState(false);
  const [copiedApprovalText, setCopiedApprovalText] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // New seller form state
  const [newSellerData, setNewSellerData] = useState({
    username: '',
    name: '',
    storeName: '',
    phone: '',
    address: '',
    creditLimit: 5000000,
    password: 'seller123',
  });

  // Pending seller requests
  const pendingSellers = useMemo(() => {
    return sellers.filter((s) => s.status === 'Pending');
  }, [sellers]);

  const activeSellers = useMemo(() => {
    return sellers.filter((s) => s.status === 'Aktif');
  }, [sellers]);

  const totalPiutangAllSellers = useMemo(() => {
    return sellers.reduce((acc, s) => acc + s.totalReceivables, 0);
  }, [sellers]);

  const avgCreditLimit = useMemo(() => {
    if (sellers.length === 0) return 0;
    return Math.round(
      sellers.reduce((acc, s) => acc + (s.creditLimit || 5000000), 0) / sellers.length
    );
  }, [sellers]);

  const filteredSellers = useMemo(() => {
    return sellers.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.storeName.toLowerCase().includes(search.toLowerCase()) ||
        (s.username && s.username.toLowerCase().includes(search.toLowerCase())) ||
        s.phone.includes(search) ||
        s.address.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Semua' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sellers, search, statusFilter]);

  const totalPages = Math.ceil(filteredSellers.length / itemsPerPage) || 1;
  const paginatedSellers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSellers.slice(start, start + itemsPerPage);
  }, [filteredSellers, currentPage]);

  const formatWhatsAppUrl = (phone: string, text: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    } else if (!cleaned.startsWith('62')) {
      cleaned = '62' + cleaned;
    }
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(text)}`;
  };

  const generateApprovalMessage = (seller: Seller, creditLimit: number) => {
    const limitFormatted = Number(creditLimit || 5000000).toLocaleString('id-ID');
    const loginUser = seller.username || seller.phone;
    const loginPass = seller.password || 'seller123';

    return `Halo Bapak/Ibu ${seller.name} (${seller.storeName}),\n\nSelamat! Pengajuan kemitraan toko Anda di Tino Underwear telah DISETUJUI oleh Owner dengan Plafon Kredit Awal sebesar Rp ${limitFormatted}.\n\nBerikut rincian akun login portal TUMIN Anda:\n• Username / No. HP: ${loginUser}\n• Kata Sandi: ${loginPass}\n\nSilakan gunakan akun tersebut untuk masuk ke portal TUMIN agar dapat melihat katalog produk grosir, mengecek stok barang tempo, dan memantau riwayat faktur piutang Anda.\n\nTerima kasih atas kerja samanya!\n— Manajemen Tino Underwear Bekasi`;
  };

  const handleExportCSV = () => {
    const headers = [
      'USERNAME',
      'NAMA MITRA',
      'NAMA TOKO',
      'TELEPON',
      'ALAMAT',
      'STATUS',
      'PLAFON KREDIT',
      'TOTAL PIUTANG',
    ];
    const rows = filteredSellers.map((s) => [
      `"${s.username || '-'}"`,
      `"${s.name}"`,
      `"${s.storeName}"`,
      `"${s.phone}"`,
      `"${s.address}"`,
      `"${s.status}"`,
      s.creditLimit || 5000000,
      s.totalReceivables,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Daftar_Mitra_Seller_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddSellerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSellerData.name || !newSellerData.storeName || !newSellerData.phone) return;

    const registered = registerSeller({
      username: newSellerData.username || newSellerData.phone.replace(/\D/g, ''),
      name: newSellerData.name,
      storeName: newSellerData.storeName,
      phone: newSellerData.phone,
      address: newSellerData.address || 'Bekasi',
      password: newSellerData.password || 'seller123',
    });

    if (registered && registered.id) {
      approveSeller(registered.id, newSellerData.creditLimit || 5000000);
    }

    setIsAddSellerOpen(false);
    setNewSellerData({
      username: '',
      name: '',
      storeName: '',
      phone: '',
      address: '',
      creditLimit: 5000000,
      password: 'seller123',
    });
  };

  const handleOpenApprovalModal = (seller: Seller) => {
    setApprovalModalSeller(seller);
    setApprovalCreditLimit(seller.creditLimit || 5000000);
    setShowApprovalPassword(false);
    setCopiedApprovalText(false);
  };

  const handleConfirmApproval = (openWhatsApp: boolean) => {
    if (!approvalModalSeller) return;

    approveSeller(approvalModalSeller.id, approvalCreditLimit);

    if (openWhatsApp) {
      const msg = generateApprovalMessage(approvalModalSeller, approvalCreditLimit);
      const url = formatWhatsAppUrl(approvalModalSeller.phone, msg);
      // Safe anchor click simulation
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    setApprovalModalSeller(null);
  };

  const handleCopyMessage = () => {
    if (!approvalModalSeller) return;
    const msg = generateApprovalMessage(approvalModalSeller, approvalCreditLimit);
    navigator.clipboard.writeText(msg);
    setCopiedApprovalText(true);
    setTimeout(() => setCopiedApprovalText(false), 2500);
  };

  const handleUpdateCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCreditSeller || newCreditLimit === '') return;

    updateSeller(editingCreditSeller.id, {
      creditLimit: Number(newCreditLimit),
    });

    setEditingCreditSeller(null);
    setNewCreditLimit('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Manajemen Mitra Seller
            </h1>
            <span className="bg-teal-100 text-teal-800 font-semibold text-xs px-2 py-0.5 rounded">
              KONSINYASI &amp; KREDIT
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Kelola data mitra barang tempo, verifikasi pendaftaran baru via Telepon/WhatsApp, dan kontrol plafon kredit.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddSellerOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Mitra Baru</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Mitra Aktif */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              TOTAL MITRA AKTIF
            </span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-teal-700 tracking-tight">
              {activeSellers.length} Mitra
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Reseller terverifikasi aktif berjualan
            </p>
          </div>
        </div>

        {/* Pengajuan Baru (Pending) */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              PENGAJUAN BARU
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-amber-500 tracking-tight">
              {pendingSellers.length} Pengajuan
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Menunggu persetujuan &amp; kontak WhatsApp
            </p>
          </div>
        </div>

        {/* Total Piutang Konsinyasi */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              TOTAL PIUTANG MITRA
            </span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-purple-700 tracking-tight font-mono">
              Rp {totalPiutangAllSellers.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Tagihan berjalan barang tempo konsinyasi
            </p>
          </div>
        </div>

        {/* Rata-Rata Plafon Kredit */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              RATA-RATA PLAFON
            </span>
            <DollarSign className="w-4 h-4 text-gray-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight font-mono">
              Rp {avgCreditLimit.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Batas rata-rata kredit tempo per seller
            </p>
          </div>
        </div>
      </div>

      {/* 3. Pending Seller Requests Alert Box */}
      {pendingSellers.length > 0 && (
        <div className="p-4 sm:p-5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-sm sm:text-base text-amber-900">
                Verifikasi Pengajuan Kemitraan Baru ({pendingSellers.length})
              </h3>
            </div>
            <span className="text-xs text-amber-800 font-medium hidden sm:inline">
              Hubungi via WhatsApp &amp; tentukan plafon kredit
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingSellers.map((seller) => (
              <div
                key={seller.id}
                className="p-4 bg-white border border-amber-200/80 rounded-xl shadow-xs flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-gray-900">
                        {seller.name}
                      </h4>
                      <p className="text-xs font-semibold text-teal-700 flex items-center gap-1 mt-0.5">
                        <Store className="w-3.5 h-3.5" />
                        <span>{seller.storeName}</span>
                      </p>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
                      Pending
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-gray-600">
                    <p className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                      <span>Username: <strong className="font-mono text-emerald-800">{seller.username || '-'}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-mono">{seller.phone}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{seller.address}</span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSellerDetail(seller)}
                    className="text-xs text-gray-500 hover:text-gray-900 underline font-medium cursor-pointer"
                  >
                    Detail Lengkap
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => rejectSeller(seller.id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenApprovalModal(seller)}
                      className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Setujui Mitra</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Filter & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama mitra, nama toko, username, telepon, atau alamat..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-gray-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'Semua' | SellerStatus);
              setCurrentPage(1);
            }}
            className="text-xs sm:text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-teal-600 cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aktif">Aktif</option>
            <option value="Pending">Pending (Menunggu)</option>
            <option value="Ditangguhkan">Ditangguhkan</option>
          </select>
        </div>
      </div>

      {/* 5. Master Data Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">NAMA MITRA &amp; TOKO</th>
                <th className="py-3 px-4">USERNAME &amp; KONTAK</th>
                <th className="py-3 px-4">PLAFON KREDIT</th>
                <th className="py-3 px-4">PIUTANG BERJALAN</th>
                <th className="py-3 px-4">SISA PLAFON</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-center">AKSI &amp; WHATSAPP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedSellers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Tidak ditemukan data mitra seller dengan filter tersebut.
                  </td>
                </tr>
              ) : (
                paginatedSellers.map((seller) => {
                  const creditLimit = seller.creditLimit || 5000000;
                  const sisaPlafon = Math.max(0, creditLimit - seller.totalReceivables);
                  const isLimitExceeded = seller.totalReceivables >= creditLimit && creditLimit > 0;
                  const waUrl = formatWhatsAppUrl(
                    seller.phone,
                    `Halo ${seller.name} (${seller.storeName}), kami dari Owner Tino Underwear ingin mengonfirmasi terkait akun dan operasional kemitraan Anda di TUMIN.`
                  );

                  return (
                    <tr key={seller.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div>
                          <p className="font-semibold text-gray-900 leading-snug">
                            {seller.name}
                          </p>
                          <p className="text-xs font-medium text-teal-700 flex items-center gap-1 mt-0.5">
                            <Store className="w-3 h-3 text-teal-600" />
                            <span>{seller.storeName}</span>
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        <p className="font-mono text-xs font-semibold text-emerald-800">
                          @{seller.username || seller.id}
                        </p>
                        <p className="font-mono text-xs text-gray-700">{seller.phone}</p>
                        <p className="text-xs text-gray-400 line-clamp-1 max-w-[180px]">
                          {seller.address}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                        Rp {creditLimit.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={seller.totalReceivables > 0 ? 'text-purple-700' : 'text-gray-400'}>
                          Rp {seller.totalReceivables.toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`font-semibold ${
                            isLimitExceeded
                              ? 'text-red-600'
                              : sisaPlafon < 1000000
                              ? 'text-amber-600'
                              : 'text-gray-700'
                          }`}
                        >
                          Rp {sisaPlafon.toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {seller.status === 'Aktif' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Aktif
                          </span>
                        )}
                        {seller.status === 'Pending' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Pending
                          </span>
                        )}
                        {seller.status === 'Ditangguhkan' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            Ditangguhkan
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {seller.status === 'Pending' ? (
                            <button
                              type="button"
                              onClick={() => handleOpenApprovalModal(seller)}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Setujui</span>
                            </button>
                          ) : (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                              title="Chat WhatsApp Mitra"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedSellerDetail(seller)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-md font-semibold text-xs whitespace-nowrap transition-colors cursor-pointer"
                          >
                            Detail
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setEditingCreditSeller(seller);
                              setNewCreditLimit(creditLimit);
                            }}
                            className="p-1.5 text-gray-400 hover:text-teal-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                            title="Atur Limit Plafon Kredit"
                          >
                            <Sliders className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Menampilkan {paginatedSellers.length} dari {filteredSellers.length} mitra seller
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Sebelumnya
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => {
              const isActive = pageNumber === currentPage;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: PERSETUJUAN MITRA & HUBUNGI WHATSAPP */}
      {approvalModalSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-xl w-full overflow-hidden max-h-[92vh] flex flex-col">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-teal-50/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Persetujuan Kemitraan Seller
                  </h3>
                  <p className="text-xs text-teal-800">
                    Konfirmasi akun dan hubungi mitra via Telepon / WhatsApp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setApprovalModalSeller(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {/* Ringkasan Data yang didaftarkan */}
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-2 text-xs">
                <span className="font-bold text-gray-800 block text-xs uppercase tracking-wider">
                  Rincian Akun yang Diajukan Mitra:
                </span>
                <div className="grid grid-cols-2 gap-2 text-stone-700">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Nama Pemilik:</span>
                    <strong className="text-gray-900">{approvalModalSeller.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Nama Toko / Usaha:</span>
                    <strong className="text-teal-800">{approvalModalSeller.storeName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">No. WhatsApp / Telepon:</span>
                    <strong className="font-mono text-gray-900">{approvalModalSeller.phone}</strong>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Username Login:</span>
                    <strong className="font-mono text-emerald-800">
                      @{approvalModalSeller.username || approvalModalSeller.id}
                    </strong>
                  </div>
                  <div className="col-span-2 flex items-center justify-between bg-white p-2 rounded-lg border border-stone-200">
                    <div>
                      <span className="text-gray-400 block text-[11px]">Kata Sandi yang Didaftarkan:</span>
                      <strong className="font-mono text-gray-900">
                        {showApprovalPassword
                          ? approvalModalSeller.password || 'seller123'
                          : '••••••••'}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowApprovalPassword(!showApprovalPassword)}
                      className="px-2 py-1 text-[11px] text-stone-600 hover:text-teal-700 flex items-center gap-1 cursor-pointer"
                    >
                      {showApprovalPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showApprovalPassword ? 'Sembunyikan' : 'Lihat'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Input Plafon Kredit Awal */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Plafon Kredit Awal yang Diberikan (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-gray-400">Rp</span>
                  <input
                    type="number"
                    min="0"
                    step="500000"
                    value={approvalCreditLimit}
                    onChange={(e) => setApprovalCreditLimit(Number(e.target.value) || 0)}
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono font-bold bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600"
                    required
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Batas maksimum pengambilan barang tempo awal untuk toko ini.
                </p>
              </div>

              {/* Preview Pesan WhatsApp */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Format Pesan Konfirmasi WhatsApp ke Mitra:</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleCopyMessage}
                    className="text-[11px] text-teal-700 hover:text-teal-900 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    {copiedApprovalText ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin Pesan</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs font-sans text-emerald-950 whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                  {generateApprovalMessage(approvalModalSeller, approvalCreditLimit)}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setApprovalModalSeller(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer text-center"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => handleConfirmApproval(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center"
              >
                Setujui Tanpa WhatsApp
              </button>

              <button
                type="button"
                onClick={() => handleConfirmApproval(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Setujui &amp; Buka WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TAMBAH MITRA BARU */}
      {isAddSellerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Tambah Mitra Seller Baru
                  </h3>
                  <p className="text-xs text-gray-500">
                    Daftarkan toko atau reseller baru ke sistem TUMIN (Tanpa Email)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSellerOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSellerSubmit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Username Login *
                  </label>
                  <input
                    type="text"
                    value={newSellerData.username}
                    onChange={(e) => setNewSellerData({ ...newSellerData, username: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="Contoh: toko_jaya"
                    className="w-full px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nomor WhatsApp / HP *
                  </label>
                  <input
                    type="text"
                    value={newSellerData.phone}
                    onChange={(e) => setNewSellerData({ ...newSellerData, phone: e.target.value })}
                    placeholder="0812-3456-7890"
                    className="w-full px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nama Pemilik / Mitra *
                  </label>
                  <input
                    type="text"
                    value={newSellerData.name}
                    onChange={(e) => setNewSellerData({ ...newSellerData, name: e.target.value })}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nama Toko / Usaha *
                  </label>
                  <input
                    type="text"
                    value={newSellerData.storeName}
                    onChange={(e) => setNewSellerData({ ...newSellerData, storeName: e.target.value })}
                    placeholder="Contoh: Toko Jaya Busana"
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Plafon Kredit Awal (Rp)
                  </label>
                  <input
                    type="number"
                    value={newSellerData.creditLimit}
                    onChange={(e) => setNewSellerData({ ...newSellerData, creditLimit: Number(e.target.value) })}
                    min="0"
                    placeholder="5000000"
                    className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kata Sandi Login Awal *
                  </label>
                  <input
                    type="text"
                    value={newSellerData.password}
                    onChange={(e) => setNewSellerData({ ...newSellerData, password: e.target.value })}
                    placeholder="seller123"
                    className="w-full px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Alamat Lengkap Toko / Pengiriman
                </label>
                <textarea
                  value={newSellerData.address}
                  onChange={(e) => setNewSellerData({ ...newSellerData, address: e.target.value })}
                  rows={2}
                  placeholder="Pasar Baru Bekasi Blok A No. 12, Bekasi Timur..."
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddSellerOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  Simpan &amp; Aktifkan Mitra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DETAIL MITRA SELLER */}
      {selectedSellerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedSellerDetail.storeName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Detail profil mitra &amp; akses portal
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSellerDetail(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Nama Pemilik:</span>
                  <span className="font-semibold text-gray-800">{selectedSellerDetail.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Status:</span>
                  <span className="font-semibold text-teal-700">{selectedSellerDetail.status}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Username Login:</span>
                  <span className="font-mono font-bold text-emerald-800">
                    @{selectedSellerDetail.username || selectedSellerDetail.id}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Nomor WhatsApp:</span>
                  <span className="font-mono text-gray-800">{selectedSellerDetail.phone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 block text-[11px]">Kata Sandi Login:</span>
                  <span className="font-mono text-stone-700">{selectedSellerDetail.password || 'seller123'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-400 block text-[11px]">Alamat:</span>
                  <span className="text-gray-800">{selectedSellerDetail.address}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <span className="text-purple-800 text-[11px] block font-semibold">Total Piutang Berjalan</span>
                  <span className="text-base font-bold font-mono text-purple-950 mt-1 block">
                    Rp {selectedSellerDetail.totalReceivables.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="p-3 bg-teal-50 rounded-xl border border-teal-200">
                  <span className="text-teal-800 text-[11px] block font-semibold">Limit Plafon Kredit</span>
                  <span className="text-base font-bold font-mono text-teal-950 mt-1 block">
                    Rp {(selectedSellerDetail.creditLimit || 5000000).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                <a
                  href={formatWhatsAppUrl(
                    selectedSellerDetail.phone,
                    `Halo ${selectedSellerDetail.name} (${selectedSellerDetail.storeName}), kami dari Owner Tino Underwear ingin berkomunikasi mengenai transaksi kemitraan Anda di TUMIN.`
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Hubungi via WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedSellerDetail(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: UBAH LIMIT PLAFON */}
      {editingCreditSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-sm w-full overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Atur Limit Plafon Kredit
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingCreditSeller.storeName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingCreditSeller(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCreditSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                <span className="text-gray-500 block">Piutang Saat Ini:</span>
                <span className="font-mono font-bold text-purple-900 text-sm">
                  Rp {editingCreditSeller.totalReceivables.toLocaleString('id-ID')}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Batas Plafon Kredit Baru (Rp) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={newCreditLimit}
                  onChange={(e) =>
                    setNewCreditLimit(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 transition-all"
                  required
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingCreditSeller(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer"
                >
                  Simpan Plafon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
