import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/Badge';
import { ChamferCard } from '../common/ChamferCard';
import { StitchDivider } from '../common/StitchDivider';
import { PaymentProofModal } from '../common/PaymentProofModal';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  TrendingUp,
  DollarSign,
  AlertCircle,
  FileText,
  CreditCard,
  PieChart,
  Image as ImageIcon,
  X,
  CheckCircle2,
  Building2,
  BadgePercent,
  Check,
} from 'lucide-react';

export const FinancialReports: React.FC = () => {
  const { invoices, products, sellers } = useApp();

  const [timeframe, setTimeframe] = useState<'30days' | 'thisMonth' | 'all'>('thisMonth');
  const [selectedProofInvoice, setSelectedProofInvoice] = useState<any | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfPeriod, setPdfPeriod] = useState<'thisMonth' | '30days' | 'all'>('thisMonth');

  // Compute metrics
  const financialData = useMemo(() => {
    let grossSales = 0;
    let totalDiscount = 0;
    let netSales = 0;
    let totalEstimatedHpp = 0;

    for (const inv of invoices) {
      grossSales += inv.subtotal;
      totalDiscount += inv.discount;
      netSales += inv.total;

      for (const item of inv.items) {
        const prod = products.find((p) => p.id === item.productId);
        const hpp = prod ? prod.costPrice : item.unitPrice * 0.6;
        totalEstimatedHpp += hpp * item.quantity;
      }
    }

    const grossProfit = Math.max(0, netSales - totalEstimatedHpp);
    const profitMargin = netSales > 0 ? ((grossProfit / netSales) * 100).toFixed(1) : '0';

    const cashSales = invoices
      .filter((i) => i.paymentMethod === 'Tunai')
      .reduce((a, b) => a + b.total, 0);

    const bankSales = invoices
      .filter((i) => i.paymentMethod === 'Transfer Bank')
      .reduce((a, b) => a + b.total, 0);

    const creditSales = invoices
      .filter((i) => i.paymentMethod === 'Kredit')
      .reduce((a, b) => a + b.total, 0);

    const creditPaid = invoices
      .filter((i) => i.paymentMethod === 'Kredit')
      .reduce((a, b) => a + b.amountPaid, 0);

    const remainingReceivables = invoices
      .filter((i) => i.paymentMethod === 'Kredit')
      .reduce((a, b) => a + b.remainingBalance, 0);

    return {
      grossSales,
      totalDiscount,
      netSales,
      totalEstimatedHpp,
      grossProfit,
      profitMargin,
      cashSales,
      bankSales,
      creditSales,
      creditPaid,
      remainingReceivables,
    };
  }, [invoices, products]);

  // Export CSV / Excel function
  const handleExportCSV = () => {
    const headers = [
      'No. Faktur',
      'Tanggal',
      'Kasir',
      'Metode Pembayaran',
      'Mitra Seller',
      'Total Penjualan (Rp)',
      'Terbayar (Rp)',
      'Sisa Piutang (Rp)',
      'Status Pembayaran',
    ];

    const rows = invoices.map((inv) => [
      inv.invoiceNumber,
      `"${inv.date}"`,
      `"${inv.cashierName}"`,
      inv.paymentMethod,
      `"${inv.sellerName || '-'}"`,
      inv.total,
      inv.amountPaid,
      inv.remainingBalance,
      inv.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Laporan_Keuangan_TinoUnderwear_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    setIsPdfModalOpen(true);
  };

  // Download printable standalone HTML report
  const handleDownloadHtmlPdf = () => {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const rowsHtml = invoices
      .map(
        (inv) => `
        <tr>
          <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">${inv.invoiceNumber}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${inv.date}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${inv.sellerName || 'Pelanggan Ritel'}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb;">${inv.paymentMethod}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">Rp ${inv.total.toLocaleString('id-ID')}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; color: #047857;">Rp ${inv.amountPaid.toLocaleString('id-ID')}</td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; color: ${inv.remainingBalance > 0 ? '#b91c1c' : '#4b5563'};">
            ${inv.remainingBalance > 0 ? 'Rp ' + inv.remainingBalance.toLocaleString('id-ID') : '-'}
          </td>
          <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${inv.status}</td>
        </tr>`
      )
      .join('');

    const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Rekap Keuangan Tino Underwear - ${todayStr}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1f2937; margin: 30px; font-size: 13px; line-height: 1.4; }
    .header { border-bottom: 3px double #047857; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
    .title { font-size: 22px; font-weight: 900; color: #1e3a8a; font-style: italic; margin: 0; }
    .subtitle { font-size: 13px; font-weight: bold; color: #111827; margin: 2px 0; }
    .meta { font-size: 11px; color: #4b5563; }
    .badge { display: inline-block; background: #ecfdf5; color: #065f46; font-weight: bold; font-size: 11px; padding: 3px 8px; border-radius: 4px; border: 1px solid #a7f3d0; margin-bottom: 15px; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; padding: 12px; border-radius: 6px; }
    .card-title { font-size: 11px; color: #6b7280; margin-bottom: 4px; font-weight: 600; text-transform: uppercase; }
    .card-val { font-size: 16px; font-weight: bold; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    th { background: #f3f4f6; padding: 8px; text-align: left; border: 1px solid #e5e7eb; font-weight: bold; text-transform: uppercase; }
    .sign-box { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; font-size: 12px; }
    .sign-line { height: 50px; }
    @media print { body { margin: 10mm; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 class="title">TUMIN</h1>
      <p class="subtitle">Tino Underwear Information System</p>
      <p class="meta">Toko Pusat Bekasi • Terminal Kasir POS-01 & Distributor Pakaian Dalam</p>
      <p class="meta">Alamat: Ruko Sentra Niaga Blok B-12, Bekasi Utara • Telp/WA: 0812-9844-3321</p>
    </div>
    <div style="text-align: right;">
      <h3 style="margin: 0; color: #047857; font-size: 14px;">REKAPITULASI LAPORAN KEUANGAN</h3>
      <p class="meta" style="margin-top: 4px;">No. Dokumen: <strong>REKAP-FIN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}</strong></p>
      <p class="meta">Tanggal Cetak: <strong>${todayStr}</strong></p>
      <p class="meta">Otorisasi: <strong>Pak Tino (Owner)</strong></p>
    </div>
  </div>

  <div class="badge">DOKUMEN RESMI REKAPITULASI KEUANGAN & LABA RUGI UMKM</div>

  <div class="grid">
    <div class="card" style="border-top: 3px solid #059669;">
      <div class="card-title">Omzet Penjualan Bersih</div>
      <div class="card-val" style="color: #059669;">Rp ${financialData.netSales.toLocaleString('id-ID')}</div>
      <div class="meta" style="margin-top: 4px;">Total dari ${invoices.length} transaksi</div>
    </div>
    <div class="card" style="border-top: 3px solid #6b7280;">
      <div class="card-title">Estimasi HPP (Modal)</div>
      <div class="card-val">Rp ${financialData.totalEstimatedHpp.toLocaleString('id-ID')}</div>
      <div class="meta" style="margin-top: 4px;">Bahan baku & konveksi</div>
    </div>
    <div class="card" style="border-top: 3px solid #7c3aed;">
      <div class="card-title">Laba Kotor (Gross Profit)</div>
      <div class="card-val" style="color: #7c3aed;">Rp ${financialData.grossProfit.toLocaleString('id-ID')}</div>
      <div class="meta" style="margin-top: 4px; font-weight: bold; color: #6d28d9;">Margin: ${financialData.profitMargin}%</div>
    </div>
    <div class="card" style="border-top: 3px solid #e11d48;">
      <div class="card-title">Sisa Piutang Berjalan</div>
      <div class="card-val" style="color: #e11d48;">Rp ${financialData.remainingReceivables.toLocaleString('id-ID')}</div>
      <div class="meta" style="margin-top: 4px;">Tertagih: Rp ${financialData.creditPaid.toLocaleString('id-ID')}</div>
    </div>
  </div>

  <h4 style="margin: 20px 0 6px 0; text-transform: uppercase; font-size: 12px; color: #374151;">Daftar Faktur Penjualan & Pembayaran</h4>
  <table>
    <thead>
      <tr>
        <th>No. Faktur</th>
        <th>Tanggal</th>
        <th>Pelanggan / Mitra</th>
        <th>Metode</th>
        <th style="text-align: right;">Total Penjualan</th>
        <th style="text-align: right;">Terbayar</th>
        <th style="text-align: right;">Sisa Piutang</th>
        <th style="text-align: center;">Status</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="sign-box">
    <div style="width: 220px;">
      <p>Petugas Administrasi & Kasir</p>
      <div class="sign-line"></div>
      <p><strong>( Kasir POS Tino Underwear )</strong></p>
    </div>
    <div style="width: 220px;">
      <p>Mengetahui & Menyetujui, Owner</p>
      <div class="sign-line"></div>
      <p><strong>( Pak Tino )</strong></p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rekap_Keuangan_PDF_TinoUnderwear_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Export CTAs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#10241D]">
            Laporan Keuangan & Rekapitulasi Piutang
          </h2>
          <p className="text-xs text-[#4B6359]">
            Khusus Owner: Analisis omzet, estimasi HPP, margin laba kotor, dan rekapitulasi pelunasan tempo.
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-800 text-xs font-semibold rounded-sm chamfer-btn transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#047857]" />
            <span>Export Excel / CSV</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="px-3.5 py-2 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold rounded-sm chamfer-btn transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Rekap PDF</span>
          </button>
        </div>
      </div>

      {/* Main KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-[#047857]/30 shadow-xs">
          <span className="text-xs text-[#4B6359] block font-medium">
            Omzet Penjualan Bersih
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono-num text-[#047857] block mt-0.5">
            Rp {financialData.netSales.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Dari {invoices.length} transaksi toko & reseller
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-stone-200 shadow-xs">
          <span className="text-xs text-[#4B6359] block font-medium">
            Estimasi Modal (HPP)
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono-num text-stone-700 block mt-0.5">
            Rp {financialData.totalEstimatedHpp.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Harga pokok kain & produksi
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-purple-200 shadow-xs">
          <span className="text-xs text-[#6D28D9] block font-medium">
            Estimasi Laba Kotor
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono-num text-[#6D28D9] block mt-0.5">
            Rp {financialData.grossProfit.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-purple-700 font-semibold mt-1 block">
            Margin: {financialData.profitMargin}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-lg border border-rose-200 shadow-xs">
          <span className="text-xs text-rose-800 block font-medium">
            Sisa Piutang Berjalan
          </span>
          <span className="text-lg sm:text-2xl font-bold font-mono-num text-rose-700 block mt-0.5">
            Rp {financialData.remainingReceivables.toLocaleString('id-ID')}
          </span>
          <span className="text-[11px] text-stone-500 mt-1 block">
            Tertagih: Rp {financialData.creditPaid.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Breakdown by Payment Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <ChamferCard dark={false} className="p-4 border border-emerald-200">
          <span className="text-xs font-semibold text-[#047857] block">
            1. Transaksi Tunai (Cash)
          </span>
          <p className="text-lg font-bold font-mono-num text-[#10241D] mt-1">
            Rp {financialData.cashSales.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Kas langsung diterima di laci kasir toko
          </p>
        </ChamferCard>

        <ChamferCard dark={false} className="p-4 border border-purple-200">
          <span className="text-xs font-semibold text-[#6D28D9] block">
            2. Transfer Bank (BCA)
          </span>
          <p className="text-lg font-bold font-mono-num text-[#10241D] mt-1">
            Rp {financialData.bankSales.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Dana masuk rekening BCA Tino Underwear
          </p>
        </ChamferCard>

        <ChamferCard dark={false} className="p-4 border border-amber-200">
          <span className="text-xs font-semibold text-amber-800 block">
            3. Penjualan Tempo Kredit
          </span>
          <p className="text-lg font-bold font-mono-num text-[#10241D] mt-1">
            Rp {financialData.creditSales.toLocaleString('id-ID')}
          </p>
          <p className="text-[11px] text-stone-500 mt-1">
            Faktur kredit mitra seller dengan jatuh tempo
          </p>
        </ChamferCard>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-lg border border-[#047857]/20 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-[#10241D]">
            Daftar Lengkap Faktur & Buku Kas Masuk
          </h3>
          <span className="text-xs text-stone-500">
            {invoices.length} Faktur Tercatat
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-stone-50 border-b border-stone-200 text-[#4B6359] uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-2.5 px-3">No. Faktur</th>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3">Keterangan / Seller</th>
                <th className="py-2.5 px-3">Subtotal</th>
                <th className="py-2.5 px-3">Diskon</th>
                <th className="py-2.5 px-3">Total Akhir</th>
                <th className="py-2.5 px-3">Pelunasan</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-stone-50/80">
                  <td className="py-2.5 px-3 font-mono-num font-bold text-[#10241D]">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-2.5 px-3 text-stone-600 font-mono-num text-[11px]">
                    {inv.date}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-stone-800">
                      {inv.paymentMethod}
                    </span>
                    {(inv.paymentMethod === 'Transfer Bank' || inv.paymentProofImage) && (
                      <button
                        type="button"
                        onClick={() => setSelectedProofInvoice(inv)}
                        className="mt-1 flex items-center gap-1 text-[10px] text-[#6D28D9] hover:underline font-semibold bg-purple-50 hover:bg-purple-100 px-1.5 py-0.5 rounded border border-purple-200 transition-colors"
                        title="Lihat foto bukti transfer bank ke rekening owner"
                      >
                        <ImageIcon className="w-2.5 h-2.5" />
                        <span>Bukti Transfer</span>
                      </button>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-stone-700">
                    {inv.sellerName || 'Pelanggan Ritel'}
                  </td>
                  <td className="py-2.5 px-3 font-mono-num text-stone-600">
                    Rp {inv.subtotal.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 font-mono-num text-rose-600">
                    {inv.discount > 0 ? `-Rp ${inv.discount.toLocaleString('id-ID')}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 font-mono-num font-bold text-[#047857]">
                    Rp {inv.total.toLocaleString('id-ID')}
                  </td>
                  <td className="py-2.5 px-3 font-mono-num">
                    <span className="text-emerald-700 font-semibold">
                      Rp {inv.amountPaid.toLocaleString('id-ID')}
                    </span>
                    {inv.remainingBalance > 0 && (
                      <span className="block text-[10px] text-rose-600">
                        Sisa: Rp {inv.remainingBalance.toLocaleString('id-ID')}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={inv.status} size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Proof Modal for Owner */}
      <PaymentProofModal
        isOpen={!!selectedProofInvoice}
        onClose={() => setSelectedProofInvoice(null)}
        invoice={selectedProofInvoice}
      />

      {/* ================= MODAL PRATINJAU CETAK REKAP PDF ================= */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 printable-doc-modal-overlay">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col border border-gray-300 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header Toolbar (Hidden when printed) */}
            <div className="bg-[#064e3b] text-white px-6 py-4 flex items-center justify-between shrink-0 no-print rounded-t-xl">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#043828] rounded-lg text-emerald-300 border border-emerald-700/50">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    Pratinjau Cetak Rekapitulasi PDF Keuangan
                  </h3>
                  <p className="text-xs text-emerald-200">
                    Dokumen Resmi Tino Underwear Information System • Rekapitulasi Laba Rugi &amp; Arus Kas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPdfModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800/50 transition-colors cursor-pointer"
                title="Tutup Pratinjau"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Periode Bar inside Modal (Hidden when printed) */}
            <div className="bg-stone-50 border-b border-stone-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
              <div className="flex items-center gap-2 text-stone-600 font-medium">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>Pilih Periode Rekap:</span>
                <div className="inline-flex rounded-md shadow-2xs border border-stone-200 bg-white p-0.5">
                  <button
                    type="button"
                    onClick={() => setPdfPeriod('thisMonth')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      pdfPeriod === 'thisMonth'
                        ? 'bg-[#047857] text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Bulan Ini (Okt 2026)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfPeriod('30days')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      pdfPeriod === '30days'
                        ? 'bg-[#047857] text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    30 Hari Terakhir
                  </button>
                  <button
                    type="button"
                    onClick={() => setPdfPeriod('all')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer ${
                      pdfPeriod === 'all'
                        ? 'bg-[#047857] text-white'
                        : 'text-stone-600 hover:bg-stone-100'
                    }`}
                  >
                    Semua Data
                  </button>
                </div>
              </div>

              <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Total {invoices.length} Faktur Siap Cetak
              </span>
            </div>

            {/* Printable Document Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-gray-900 printable-doc-root bg-white">
              {/* Kop Surat Resmi */}
              <div className="border-b-2 border-stone-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black italic text-blue-900 tracking-wider">
                      TUMIN
                    </span>
                    <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200">
                      OFFICIAL INFORMATION SYSTEM
                    </span>
                  </div>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">
                    Tino Underwear Information System
                  </p>
                  <p className="text-xs text-gray-600">
                    Toko Pusat Bekasi • Terminal Kasir POS-01 &amp; Distributor Garment
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Ruko Sentra Niaga Blok B-12, Bekasi Utara • WA/Telp: 0812-9844-3321
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs space-y-1">
                  <div className="font-extrabold text-[#047857] text-sm tracking-tight uppercase">
                    Rekapitulasi Laporan Keuangan
                  </div>
                  <p className="text-gray-600 font-mono text-[11px]">
                    No. Dok: <strong>REKAP-FIN-202610-09</strong>
                  </p>
                  <p className="text-gray-600">
                    Periode: <strong>{pdfPeriod === 'thisMonth' ? 'Bulan Ini (Okt 2026)' : pdfPeriod === '30days' ? '30 Hari Terakhir' : 'Semua Waktu'}</strong>
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    Dicetak: {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} • Otorisasi: <strong>Pak Tino (Owner)</strong>
                  </p>
                </div>
              </div>

              {/* Dokumen Resmi Badge */}
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-md px-3.5 py-2 text-xs">
                <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  DOKUMEN RESMI REKAPITULASI KEUANGAN &amp; LABA RUGI USAHA
                </span>
                <span className="text-emerald-700 font-mono text-[11px]">
                  Status: Terverifikasi Sistem
                </span>
              </div>

              {/* Ringkasan Eksekutif Keuangan (4 Kotak) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-stone-50 rounded-lg border-t-2 border-[#047857] border-stone-200">
                  <span className="text-gray-500 block text-[11px] font-semibold uppercase">Omzet Bersih</span>
                  <span className="text-base sm:text-lg font-black text-[#047857] block mt-0.5">
                    Rp {financialData.netSales.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-1">
                    {invoices.length} Faktur Tercatat
                  </span>
                </div>

                <div className="p-3 bg-stone-50 rounded-lg border-t-2 border-stone-500 border-stone-200">
                  <span className="text-gray-500 block text-[11px] font-semibold uppercase">Estimasi Modal (HPP)</span>
                  <span className="text-base sm:text-lg font-bold text-gray-800 block mt-0.5">
                    Rp {financialData.totalEstimatedHpp.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-1">
                    Biaya Pokok Produksi
                  </span>
                </div>

                <div className="p-3 bg-purple-50/60 rounded-lg border-t-2 border-purple-600 border-purple-200">
                  <span className="text-purple-700 block text-[11px] font-semibold uppercase">Laba Kotor</span>
                  <span className="text-base sm:text-lg font-black text-purple-700 block mt-0.5">
                    Rp {financialData.grossProfit.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-purple-700 font-bold block mt-1">
                    Margin: {financialData.profitMargin}%
                  </span>
                </div>

                <div className="p-3 bg-rose-50/60 rounded-lg border-t-2 border-rose-600 border-rose-200">
                  <span className="text-rose-800 block text-[11px] font-semibold uppercase">Sisa Piutang</span>
                  <span className="text-base sm:text-lg font-black text-rose-700 block mt-0.5">
                    Rp {financialData.remainingReceivables.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-1">
                    Tertagih: Rp {financialData.creditPaid.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Rincian Arus Kas & Saluran Penerimaan */}
              <div className="border border-stone-200 rounded-lg p-3.5 bg-stone-50/50 text-xs space-y-2">
                <h4 className="font-bold text-gray-800 uppercase text-[11px] tracking-wider">
                  Rincian Penerimaan Kas &amp; Bank
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2 bg-white rounded border border-stone-200">
                    <span className="text-gray-500 block text-[10px]">1. Kas Tunai (Laci Kasir)</span>
                    <span className="font-bold text-gray-900 text-xs">
                      Rp {financialData.cashSales.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-stone-200">
                    <span className="text-gray-500 block text-[10px]">2. Transfer Rekening BCA</span>
                    <span className="font-bold text-gray-900 text-xs">
                      Rp {financialData.bankSales.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="p-2 bg-white rounded border border-stone-200">
                    <span className="text-gray-500 block text-[10px]">3. Penjualan Tempo Kredit</span>
                    <span className="font-bold text-amber-800 text-xs">
                      Rp {financialData.creditSales.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabel Rekapitulasi Faktur */}
              <div>
                <h4 className="font-bold text-gray-800 uppercase text-[11px] tracking-wider mb-2">
                  Daftar Transaksi Faktur &amp; Piutang
                </h4>
                <div className="border border-stone-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-stone-100 border-b border-stone-200 font-bold text-gray-700 text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5">No. Faktur</th>
                        <th className="p-2.5">Tanggal</th>
                        <th className="p-2.5">Pelanggan / Mitra</th>
                        <th className="p-2.5">Metode</th>
                        <th className="p-2.5 text-right">Total Transaksi</th>
                        <th className="p-2.5 text-right">Terbayar</th>
                        <th className="p-2.5 text-right">Sisa Piutang</th>
                        <th className="p-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 font-mono-num text-[11px]">
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td className="p-2.5 font-bold text-gray-900">{inv.invoiceNumber}</td>
                          <td className="p-2.5 text-gray-600">{inv.date}</td>
                          <td className="p-2.5 font-sans text-gray-800 font-medium">
                            {inv.sellerName || 'Pelanggan Ritel'}
                          </td>
                          <td className="p-2.5 font-sans text-gray-700">{inv.paymentMethod}</td>
                          <td className="p-2.5 text-right font-bold text-gray-900">
                            Rp {inv.total.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2.5 text-right text-emerald-700 font-semibold">
                            Rp {inv.amountPaid.toLocaleString('id-ID')}
                          </td>
                          <td className="p-2.5 text-right text-rose-700 font-semibold">
                            {inv.remainingBalance > 0 ? `Rp ${inv.remainingBalance.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="p-2.5 text-center font-sans">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === 'PAID'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : inv.status === 'PARTIALLY_PAID'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tanda Tangan Pengesahan */}
              <div className="pt-8 grid grid-cols-2 text-center text-xs text-gray-700">
                <div>
                  <p className="font-semibold">Petugas Administrasi &amp; Kasir</p>
                  <div className="h-14" />
                  <p className="font-bold text-gray-900">( Kasir POS Tino Underwear )</p>
                  <p className="text-[10px] text-gray-500">Terminal POS-01 Bekasi</p>
                </div>
                <div>
                  <p className="font-semibold">Mengetahui &amp; Menyetujui,</p>
                  <div className="h-14" />
                  <p className="font-bold text-gray-900">( Pak Tino )</p>
                  <p className="text-[10px] text-gray-500">Owner Tino Underwear</p>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer (Hidden when printed) */}
            <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0 no-print rounded-b-xl">
              <span className="text-xs text-stone-500">
                Tip: Pilih <em>"Save as PDF"</em> pada jendela print browser untuk menyimpan file PDF resmi.
              </span>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleDownloadHtmlPdf}
                  className="px-4 py-2 bg-white border border-stone-300 text-stone-800 hover:bg-stone-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Unduh berkas dokumen siap cetak langsung"
                >
                  <Download className="w-3.5 h-3.5 text-stone-600" />
                  <span>Unduh File HTML/PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4.5 py-2 bg-[#047857] hover:bg-[#065F46] text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-emerald-200" />
                  <span>Cetak Dokumen Sekarang / Simpan PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
