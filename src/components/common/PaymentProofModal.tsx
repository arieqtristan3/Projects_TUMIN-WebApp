import React from 'react';
import { ChamferCard } from './ChamferCard';
import { X, Download, Building2, CheckCircle2, Calendar, User, FileText, ExternalLink } from 'lucide-react';
import { Invoice } from '../../types';

interface PaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  paymentProofImage?: string;
}

export const PaymentProofModal: React.FC<PaymentProofModalProps> = ({
  isOpen,
  onClose,
  invoice,
  paymentProofImage,
}) => {
  if (!isOpen || !invoice) return null;

  const imageSrc = paymentProofImage || invoice.paymentProofImage;

  const handleDownload = () => {
    if (!imageSrc) return;
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `Bukti_Transfer_${invoice.invoiceNumber.replace('#', '')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto">
        <ChamferCard dark={false} className="p-5 sm:p-6 bg-white border border-[#047857]/40 shadow-2xl space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between pb-3 border-b border-stone-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-purple-100 text-[#6D28D9] flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#047857] font-semibold">
                  Verifikasi Pembayaran
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#10241D]">
                  Bukti Transfer Bank ke Rekening Owner
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 rounded transition-colors"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Rekening Owner Banner */}
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <div>
              <span className="text-[11px] text-[#6D28D9] font-medium block">
                Rekening Tujuan Resmi Owner:
              </span>
              <span className="font-bold font-mono-num text-sm text-[#10241D]">
                BCA 521-089-2234
              </span>
              <span className="text-[11px] text-stone-600 ml-1.5 font-medium">
                a.n Tino (Owner Tino Underwear)
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full self-start sm:self-center">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Rekening Terverifikasi
            </span>
          </div>

          {/* Photo / Receipt Display */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-700 block">
              Foto Bukti Transfer yang Diunggah Kasir:
            </span>

            {imageSrc ? (
              <div className="rounded-lg border border-stone-300 overflow-hidden bg-stone-900/5 flex items-center justify-center max-h-[380px] p-2 relative group">
                <img
                  src={imageSrc}
                  alt="Bukti Transfer Bank"
                  className="max-h-[360px] w-auto object-contain rounded shadow-xs"
                />
              </div>
            ) : (
              <div className="p-8 rounded-lg border-2 border-dashed border-stone-300 text-center text-xs text-stone-400">
                Tidak ada foto bukti bayar terlampir untuk transaksi ini.
              </div>
            )}
          </div>

          {/* Transaction Metadata Grid */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200 text-xs font-mono-num">
            <div>
              <span className="text-[10px] text-stone-500 block uppercase font-sans">No. Faktur</span>
              <span className="font-bold text-[#10241D]">{invoice.invoiceNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block uppercase font-sans">Total Transfer</span>
              <span className="font-bold text-[#047857] text-sm">
                Rp {invoice.total.toLocaleString('id-ID')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block uppercase font-sans">Waktu Transaksi</span>
              <span className="text-stone-700">{invoice.date}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 block uppercase font-sans">Kasir Bertugas</span>
              <span className="text-stone-700">{invoice.cashierName}</span>
            </div>
            {invoice.transferReference && (
              <div className="col-span-2 pt-1 border-t border-stone-200 text-stone-700 font-sans">
                <span className="text-[10px] text-stone-500 block uppercase">Catatan / Referensi:</span>
                <span className="font-medium text-xs text-stone-800">{invoice.transferReference}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            {imageSrc ? (
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#047857] hover:bg-emerald-50 rounded border border-emerald-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Bukti Bayar</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold rounded transition-colors"
            >
              Selesai / Tutup
            </button>
          </div>
        </ChamferCard>
      </div>
    </div>
  );
};
