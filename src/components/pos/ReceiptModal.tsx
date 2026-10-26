import React, { useState } from 'react';
import { Invoice } from '../../types';
import { ChamferCard } from '../common/ChamferCard';
import { StitchDivider } from '../common/StitchDivider';
import { StatusBadge } from '../common/Badge';
import { PaymentProofModal } from '../common/PaymentProofModal';
import { Printer, PlusCircle, CheckCircle, Store, Calendar, CreditCard, Sparkles, X, Building2, Image as ImageIcon } from 'lucide-react';

interface ReceiptModalProps {
  isOpen: boolean;
  invoice: Invoice | null;
  onNewTransaction: () => void;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  invoice,
  onNewTransaction,
  onClose,
}) => {
  const [showProofModal, setShowProofModal] = useState<boolean>(false);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg max-h-[92vh] overflow-y-auto">
        <ChamferCard dark={false} className="p-6 md:p-7 border border-[#047857]/40 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-[#047857] flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[#047857] font-semibold">
                  Transaksi Berhasil
                </span>
                <h2 className="text-xl font-bold text-[#10241D]">
                  Struk Pembayaran
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 rounded-md"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Struk Box (Clean receipt print styling) */}
          <div id="print-area" className="mt-4 p-5 bg-stone-50/90 rounded-md border border-stone-200 font-mono text-xs text-stone-800 space-y-3">
            {/* Store branding */}
            <div className="text-center pb-2 border-b border-dashed border-stone-300">
              <h3 className="text-sm font-bold tracking-tight text-[#10241D]">
                TINO UNDERWEAR BEKASI
              </h3>
              <p className="text-[11px] text-stone-500">
                Pusat Grosir & Eceran Celana Dalam
              </p>
              <p className="text-[10px] text-stone-400">
                Jl. Pemuda No. 12 Kranji, Bekasi Barat · WA: 0812-9876-5432
              </p>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-1 text-[11px] pb-2 border-b border-dashed border-stone-300">
              <div>
                <span className="text-stone-500">No. Faktur: </span>
                <span className="font-bold text-[#10241D]">{invoice.invoiceNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-500">Tanggal: </span>
                <span>{invoice.date}</span>
              </div>
              <div>
                <span className="text-stone-500">Kasir: </span>
                <span>{invoice.cashierName}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-500">Metode: </span>
                <span className="font-semibold text-[#047857]">{invoice.paymentMethod}</span>
              </div>
            </div>

            {/* If Credit details */}
            {invoice.paymentMethod === 'Kredit' && (
              <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded text-[11px] space-y-1 text-purple-950">
                <div className="flex justify-between">
                  <span className="text-stone-600">Mitra Reseller:</span>
                  <span className="font-bold">{invoice.sellerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Jatuh Tempo:</span>
                  <span className="font-bold text-rose-700">{invoice.dueDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Status Piutang:</span>
                  <span className="font-bold text-amber-700">Dicatat ke Buku Piutang</span>
                </div>
              </div>
            )}

            {/* Items list */}
            <div className="space-y-1.5 py-1">
              <div className="flex justify-between font-bold text-[11px] text-stone-500 border-b border-stone-200 pb-1">
                <span>Item</span>
                <span>Qty x Harga</span>
                <span>Subtotal</span>
              </div>
              {invoice.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[11px]">
                  <div className="pr-2 max-w-[50%]">
                    <p className="font-semibold text-stone-900 truncate">{item.productName}</p>
                    <p className="text-[10px] text-stone-400 font-mono-num">{item.productSku}</p>
                  </div>
                  <div className="text-center text-stone-600 font-mono-num">
                    {item.quantity} x {item.unitPrice.toLocaleString('id-ID')}
                  </div>
                  <div className="font-bold text-right text-stone-900 font-mono-num">
                    Rp {item.subtotal.toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="border-t border-dashed border-stone-300 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span className="font-mono-num">Rp {invoice.subtotal.toLocaleString('id-ID')}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Diskon:</span>
                  <span className="font-mono-num">-Rp {invoice.discount.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#10241D] border-t border-stone-300 pt-1">
                <span>TOTAL AKHIR:</span>
                <span className="font-mono-num text-[#047857]">
                  Rp {invoice.total.toLocaleString('id-ID')}
                </span>
              </div>

              {/* Payment specifics */}
              {invoice.paymentMethod === 'Tunai' && (
                <>
                  <div className="flex justify-between text-stone-600 pt-1">
                    <span>Uang Diterima:</span>
                    <span className="font-mono-num">
                      Rp {(invoice.cashReceived || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>Kembalian:</span>
                    <span className="font-mono-num text-emerald-700">
                      Rp {(invoice.change || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}

              {invoice.paymentMethod === 'Transfer Bank' && (
                <div className="p-2.5 bg-purple-50/90 rounded border border-purple-200 text-left text-[11px] text-purple-950 space-y-1 mt-1 font-sans">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-1 text-[#6D28D9]">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Transfer Bank ke Rekening Owner</span>
                    </span>
                    <span className="font-mono-num font-bold text-[#6D28D9]">BCA 521-089-2234</span>
                  </div>
                  <p className="text-[10px] text-stone-600">
                    Penerima: Tino Underwear (Owner)
                    {invoice.transferReference ? ` · Ref: ${invoice.transferReference}` : ''}
                  </p>

                  {invoice.paymentProofImage && (
                    <div className="pt-1.5 flex items-center justify-between border-t border-purple-200/60 mt-1">
                      <span className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Bukti Bayar Tersimpan
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowProofModal(true)}
                        className="px-2 py-0.5 bg-white border border-purple-300 hover:bg-purple-100 text-[#6D28D9] font-semibold text-[10px] rounded flex items-center gap-1 transition-colors"
                      >
                        <ImageIcon className="w-3 h-3" />
                        <span>Lihat Bukti Foto</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Automatic stock deduction alert */}
            <div className="bg-emerald-50 border border-emerald-200 p-2 rounded text-[11px] text-emerald-900 flex items-center gap-1.5 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
              <span>Stok produk dalam gudang telah berkurang otomatis secara real-time.</span>
            </div>

            <div className="text-center text-[10px] text-stone-400 pt-1">
              Terima kasih atas kunjungan & kerja sama Anda.
            </div>
          </div>

          <StitchDivider color="emerald" />

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 bg-white border border-[#047857] text-[#047857] hover:bg-emerald-50 text-xs font-semibold rounded-sm chamfer-btn transition-colors flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>
            <button
              onClick={onNewTransaction}
              className="flex-1 py-2.5 px-4 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold rounded-sm chamfer-btn transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Transaksi Baru</span>
            </button>
          </div>
        </ChamferCard>
      </div>

      {/* Proof Modal */}
      <PaymentProofModal
        isOpen={showProofModal}
        invoice={invoice}
        onClose={() => setShowProofModal(false)}
      />
    </div>
  );
};
