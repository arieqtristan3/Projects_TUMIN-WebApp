import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Invoice, InvoicePaymentStatus } from '../../types';
import {
  CreditCard,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  History,
  Receipt,
  Building2,
  Calendar,
  Download,
  Plus,
  ArrowUpRight,
  DollarSign,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { PaymentProofModal } from '../common/PaymentProofModal';

export const ReceivablesManagement: React.FC = () => {
  const { invoices, recordInstallment } = useApp();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | InvoicePaymentStatus>('Semua');

  // Modals
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<Invoice | null>(null);
  const [selectedProofInvoice, setSelectedProofInvoice] = useState<Invoice | null>(null);

  // Form states for installment
  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState<'Tunai' | 'Transfer Bank'>('Tunai');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Credit invoices only
  const creditInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.paymentMethod === 'Kredit');
  }, [invoices]);

  const summary = useMemo(() => {
    const totalPiutang = creditInvoices.reduce((acc, inv) => acc + inv.remainingBalance, 0);
    const unpaidCount = creditInvoices.filter((i) => i.status === 'UNPAID').length;
    const partialCount = creditInvoices.filter((i) => i.status === 'PARTIALLY_PAID').length;
    const paidCount = creditInvoices.filter((i) => i.status === 'PAID').length;

    return { totalPiutang, unpaidCount, partialCount, paidCount };
  }, [creditInvoices]);

  const filteredInvoices = useMemo(() => {
    return creditInvoices.filter((inv) => {
      const matchSearch =
        inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
        (inv.sellerName && inv.sellerName.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = statusFilter === 'Semua' || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [creditInvoices, search, statusFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage) || 1;
  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || !amount) return;

    const res = recordInstallment({
      invoiceId: payingInvoice.id,
      amount: Number(amount),
      method,
      notes,
    });

    if (res.success) {
      setPayingInvoice(null);
      setAmount('');
      setNotes('');
      setError('');
    } else {
      setError(res.error || 'Gagal menyimpan cicilan.');
    }
  };

  const handleExportCSV = () => {
    const headers = ['NO FAKTUR', 'NAMA MITRA SELLER', 'TANGGAL FAKTUR', 'JATUH TEMPO', 'TOTAL FAKTUR', 'SISA TAGIHAN', 'STATUS'];
    const rows = filteredInvoices.map((inv) => [
      `"${inv.invoiceNumber}"`,
      `"${inv.sellerName || '-'}"`,
      `"${inv.date}"`,
      `"${inv.dueDate || '-'}"`,
      inv.total,
      inv.remainingBalance,
      `"${inv.status}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Buku_Piutang_TUMIN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Buku Piutang &amp; Setoran Cicilan
            </h1>
            <span className="bg-teal-100 text-teal-800 font-semibold text-xs px-2 py-0.5 rounded">
              INVOICE TEMPO
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Pantau seluruh faktur tempo kredit reseller, jadwal jatuh tempo, dan pencatatan cicilan masuk.
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
        </div>
      </div>

      {/* 2. 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Piutang Berjalan */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              TOTAL PIUTANG BERJALAN
            </span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-purple-700 tracking-tight font-mono">
              Rp {summary.totalPiutang.toLocaleString('id-ID')}
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Akumulasi tagihan tempo yang belum terlunasi
            </p>
          </div>
        </div>

        {/* Belum Dibayar (UNPAID) */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              BELUM DIBAYAR (UNPAID)
            </span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-red-600 tracking-tight">
              {summary.unpaidCount} Faktur
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Belum ada setoran cicilan pertama
            </p>
          </div>
        </div>

        {/* Sebagian Dibayar */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              SEBAGIAN DIBAYAR
            </span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-amber-500 tracking-tight">
              {summary.partialCount} Faktur
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Sudah mencicil, sisa saldo berjalan
            </p>
          </div>
        </div>

        {/* Sudah Lunas */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              SUDAH LUNAS (PAID)
            </span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-green-600 tracking-tight">
              {summary.paidCount} Faktur
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Faktur kredit yang telah selesai dibayar
            </p>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter */}
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
            placeholder="Cari nomor faktur atau nama seller..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-gray-800"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Status Pembayaran:</span>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'Semua' | InvoicePaymentStatus);
              setCurrentPage(1);
            }}
            className="text-xs sm:text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-teal-600"
          >
            <option value="Semua">Semua Status</option>
            <option value="UNPAID">Belum Dibayar (UNPAID)</option>
            <option value="PARTIALLY_PAID">Sebagian Dibayar</option>
            <option value="PAID">Sudah Lunas (PAID)</option>
          </select>
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">NO FAKTUR</th>
                <th className="py-3 px-4">MITRA SELLER</th>
                <th className="py-3 px-4">TANGGAL &amp; JATUH TEMPO</th>
                <th className="py-3 px-4">TOTAL NILAI</th>
                <th className="py-3 px-4">SISA TAGIHAN</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    Tidak ditemukan data faktur tempo dengan filter tersebut.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => {
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                        {inv.invoiceNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-gray-900 leading-snug">
                          {inv.sellerName || 'Pelanggan Kredit'}
                        </p>
                        <p className="text-xs text-gray-400">
                          Kasir: {inv.cashierName}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">
                        <p className="font-mono text-xs text-gray-700">{inv.date.slice(0, 10)}</p>
                        <p className="text-xs font-semibold text-amber-700 mt-0.5">
                          Tempo: {inv.dueDate || '-'}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-medium text-gray-700">
                        Rp {inv.total.toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className={inv.remainingBalance > 0 ? 'text-purple-700' : 'text-green-700'}>
                          Rp {inv.remainingBalance.toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {inv.status === 'PAID' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Sudah Lunas
                          </span>
                        )}
                        {inv.status === 'PARTIALLY_PAID' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Sebagian Dibayar
                          </span>
                        )}
                        {inv.status === 'UNPAID' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Belum Dibayar
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {inv.remainingBalance > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingInvoice(inv);
                                setAmount(inv.remainingBalance);
                                setError('');
                              }}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-semibold text-xs whitespace-nowrap transition-colors shadow-xs"
                            >
                              Catat Cicilan
                            </button>
                          ) : (
                            <span className="text-xs text-green-600 font-semibold px-2 py-1 bg-green-50 rounded">
                              Lunas
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => setHistoryInvoice(inv)}
                            className="p-1.5 text-gray-400 hover:text-teal-700 hover:bg-gray-100 rounded-md transition-colors"
                            title="Lihat Riwayat Pembayaran"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {(inv.paymentMethod === 'Transfer Bank' || inv.paymentProofImage) && (
                            <button
                              type="button"
                              onClick={() => setSelectedProofInvoice(inv)}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                              title="Lihat Bukti Transfer"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Footer Pagination */}
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-500">
          <div>
            Menampilkan{' '}
            <span className="font-semibold text-gray-800">
              {filteredInvoices.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            hingga{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(currentPage * itemsPerPage, filteredInvoices.length)}
            </span>{' '}
            dari{' '}
            <span className="font-semibold text-gray-800">{filteredInvoices.length}</span> faktur tempo
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Sebelumnya
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNumber = idx + 1;
              const isActive = currentPage === pageNumber;
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

      {/* MODAL CATAT CICILAN */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Catat Setoran Cicilan
                  </h3>
                  <p className="text-xs text-gray-500">
                    {payingInvoice.invoiceNumber} · {payingInvoice.sellerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPayingInvoice(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="m-5 mb-0 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleInstallmentSubmit} className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Faktur:</span>
                  <span className="font-mono font-bold text-gray-900">
                    Rp {payingInvoice.total.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sisa Tagihan Belum Dibayar:</span>
                  <span className="font-mono font-bold text-purple-700">
                    Rp {payingInvoice.remainingBalance.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nominal Pembayaran / Cicilan (Rp) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={payingInvoice.remainingBalance}
                  value={amount}
                  onChange={(e) =>
                    setAmount(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="Contoh: 500000"
                  className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as 'Tunai' | 'Transfer Bank')}
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 transition-all"
                >
                  <option value="Tunai">Tunai (Kas Toko)</option>
                  <option value="Transfer Bank">Transfer Bank (BCA Tino Underwear)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Setoran tahap 1 dititip ke kurir"
                  className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 transition-all"
                />
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
                >
                  Simpan Setoran
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RIWAYAT CICILAN */}
      {historyInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Riwayat Pembayaran Cicilan
                  </h3>
                  <p className="text-xs text-gray-500">
                    {historyInvoice.invoiceNumber} · {historyInvoice.sellerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHistoryInvoice(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 text-center text-xs">
                <div>
                  <span className="text-gray-400 block text-[11px]">Total Tagihan</span>
                  <span className="font-mono font-bold text-gray-900">
                    Rp {historyInvoice.total.toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Sudah Dibayar</span>
                  <span className="font-mono font-bold text-green-700">
                    Rp {(historyInvoice.amountPaid || (historyInvoice.total - historyInvoice.remainingBalance)).toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[11px]">Sisa Piutang</span>
                  <span className="font-mono font-bold text-purple-700">
                    Rp {historyInvoice.remainingBalance.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-gray-700 mb-2">
                  Daftar Pembayaran Masuk
                </h4>

                {!historyInvoice.installments || historyInvoice.installments.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400 bg-gray-50 rounded-lg border border-gray-200">
                    Belum ada catatan cicilan yang masuk pada faktur ini.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {historyInvoice.installments.map((inst, index) => (
                      <div
                        key={inst.id || index}
                        className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            Rp {inst.amount.toLocaleString('id-ID')}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {inst.date.slice(0, 10)} · {inst.method}
                            {inst.notes && ` · "${inst.notes}"`}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded font-semibold text-[11px]">
                          Tercatat
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-gray-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setHistoryInvoice(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL BUKTI TRANSFER */}
      <PaymentProofModal
        isOpen={!!selectedProofInvoice}
        onClose={() => setSelectedProofInvoice(null)}
        invoice={selectedProofInvoice}
      />
    </div>
  );
};
