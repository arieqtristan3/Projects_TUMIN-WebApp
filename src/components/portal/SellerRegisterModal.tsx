import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ChamferCard } from '../common/ChamferCard';
import { Badge } from '../common/Badge';
import { StitchDivider } from '../common/StitchDivider';
import { X, CheckCircle2, Store, Phone, MapPin, User, Lock, AlertCircle, ShieldAlert, Sparkles } from 'lucide-react';

interface SellerRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SellerRegisterModal: React.FC<SellerRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerSeller } = useApp();

  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [storeName, setStoreName] = useState('');
  const [storeAddress, setStoreAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');

    if (!cleanUsername || !fullName.trim() || !phone.trim() || !storeName.trim() || !storeAddress.trim() || !password) {
      setErrorMessage('Harap lengkapi semua kolom yang bertanda bintang (*).');
      return;
    }

    if (cleanUsername.length < 3) {
      setErrorMessage('Username akun minimal 3 karakter (huruf/angka/garis bawah).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Anda harus menyetujui syarat & ketentuan kemitraan.');
      return;
    }

    // Call state register (no email required)
    registerSeller({
      username: cleanUsername,
      name: fullName.trim(),
      phone: phone.trim(),
      storeName: storeName.trim(),
      address: storeAddress.trim(),
      password,
    });

    setIsSubmitted(true);
  };

  const handleFinish = () => {
    setIsSubmitted(false);
    onClose();
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto">
        <ChamferCard dark={false} className="p-6 md:p-8 border border-[#047857]/30 shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between pb-3">
            <div>
              <span className="text-xs uppercase tracking-wider text-[#047857] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Kemitraan Reseller Grosir
              </span>
              <h2 className="text-xl font-bold text-[#10241D] mt-0.5">
                {isSubmitted ? 'Pengajuan Kemitraan Berhasil' : 'Pendaftaran Mitra Seller Baru'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-md transition-colors cursor-pointer"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <StitchDivider color="emerald" />

          {isSubmitted ? (
            /* Success State */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#047857]">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <div className="inline-block mb-2">
                  <Badge variant="warning" size="md">
                    PENDING (MENUNGGU PERSETUJUAN OWNER)
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-[#10241D]">
                  Pengajuan Kemitraan Berhasil Dikirim!
                </h3>
                <p className="text-sm text-[#4B6359] max-w-md mx-auto mt-2 leading-relaxed">
                  Pendaftaran akun mitra Anda saat ini sedang menunggu persetujuan Owner Tino Underwear.
                  Setelah disetujui, Owner akan menghubungi Anda langsung via nomor WhatsApp/Telepon{' '}
                  <span className="font-semibold text-[#10241D]">{phone}</span> untuk konfirmasi aktivasi akun.
                </p>
              </div>

              <div className="bg-stone-50 border border-dashed border-stone-200 p-4 rounded-lg text-left text-xs space-y-1.5 text-stone-700">
                <p className="font-semibold text-stone-900 border-b border-stone-200 pb-1.5 mb-2">
                  Ringkasan Akun Pendaftaran:
                </p>
                <p><span className="text-stone-500">Username Login:</span> <strong className="font-mono text-emerald-800">{username.trim().toLowerCase().replace(/\s+/g, '_')}</strong></p>
                <p><span className="text-stone-500">Nama Pemilik:</span> <strong>{fullName}</strong></p>
                <p><span className="text-stone-500">Nama Toko:</span> <strong>{storeName}</strong></p>
                <p><span className="text-stone-500">Nomor WhatsApp:</span> <span className="font-mono">{phone}</span></p>
                <p><span className="text-stone-500">Alamat Usaha:</span> {storeAddress}</p>
                <p><span className="text-stone-500">Status Akun:</span> <span className="text-amber-700 font-semibold">Menunggu Verifikasi &amp; Plafon Kredit dari Owner</span></p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-md text-left text-xs text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Harap simpan username dan kata sandi yang telah Anda buat. Anda dapat langsung menggunakannya untuk login setelah Owner mengonfirmasi persetujuan kemitraan via WhatsApp.
                </span>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleFinish}
                  className="w-full py-2.5 px-4 bg-[#047857] hover:bg-[#065F46] text-white font-medium rounded-md transition-colors chamfer-btn shadow-md cursor-pointer"
                >
                  Kembali ke Halaman Masuk Portal
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-900 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <span className="leading-snug">
                  Pendaftaran tanpa repot email! Cukup masukkan username &amp; nomor WhatsApp toko Anda. Owner akan menghubungi Anda langsung setelah permohonan disetujui.
                </span>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[13px] font-semibold text-[#10241D] mb-1">
                    Username Akun Login *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-2 top-2.5 text-[#4B6359]" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      placeholder="Contoh: budi88 / toko_berkah"
                      className="w-full pl-8 pr-3 py-1.5 text-[14px] input-stitch text-[#10241D] font-mono"
                      required
                    />
                  </div>
                  <span className="text-[11px] text-stone-500 mt-0.5 block">
                    Digunakan untuk masuk ke sistem (huruf kecil &amp; angka)
                  </span>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#10241D] mb-1">
                    Nomor Telepon / WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-2 top-2.5 text-[#4B6359]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full pl-8 pr-3 py-1.5 text-[14px] input-stitch text-[#10241D] font-mono-num"
                      required
                    />
                  </div>
                  <span className="text-[11px] text-stone-500 mt-0.5 block">
                    Owner akan menghubungi nomor ini saat akun disetujui
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[13px] font-semibold text-[#10241D] mb-1">
                    Nama Lengkap Pemilik *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-2 top-2.5 text-[#4B6359]" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Contoh: Budi Santoso"
                      className="w-full pl-8 pr-3 py-1.5 text-[14px] input-stitch text-[#10241D]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#10241D] mb-1">
                    Nama Toko / Kios Usaha *
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 absolute left-2 top-2.5 text-[#4B6359]" />
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Contoh: Toko Berkah Busana"
                      className="w-full pl-8 pr-3 py-1.5 text-[14px] input-stitch text-[#10241D]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold text-[#10241D] mb-1">
                  Alamat Usaha / Lokasi Kios (Bekasi &amp; Sekitarnya) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-2 top-2.5 text-[#4B6359]" />
                  <textarea
                    rows={2}
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Contoh: Jl. Pemuda No. 42, Kranji, Bekasi Barat atau Pasar Baru Bekasi Blok B..."
                    className="w-full pl-8 pr-3 py-1.5 text-[14px] input-stitch text-[#10241D] resize-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[13px] font-semibold text-[#10241D] mb-1">
                    Buat Kata Sandi *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-2 top-2.5 text-[#4B6359]" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      className="w-full pl-8 pr-3 py-1.5 text-[14px] input-stitch text-[#10241D]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[13px] font-semibold text-[#10241D] mb-1">
                    Konfirmasi Kata Sandi *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-2 top-2.5 text-[#4B6359]" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi kata sandi"
                      className="w-full pl-8 pr-3 py-1.5 text-[14px] input-stitch text-[#10241D]"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-[#4B6359] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-stone-300 text-[#047857] focus:ring-[#047857]"
                  />
                  <span>
                    Saya menyatakan data usaha ini benar dan bersedia mematuhi kesepakatan penjualan &amp; pembayaran barang tempo Tino Underwear.
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-[#4B6359] hover:text-[#10241D] rounded-sm transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold rounded-sm transition-colors chamfer-btn shadow-sm cursor-pointer"
                >
                  Ajukan Pendaftaran Kemitraan
                </button>
              </div>
            </form>
          )}
        </ChamferCard>
      </div>
    </div>
  );
};
