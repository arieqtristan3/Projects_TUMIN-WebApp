import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { ChamferCard } from '../common/ChamferCard';
import { SellerRegisterModal } from './SellerRegisterModal';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export const PublicPortal: React.FC = () => {
  const { authenticateUser } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [identifier, setIdentifier] = useState('owner@tinounderwear.id');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registeredSuccessNotification, setRegisteredSuccessNotification] = useState(false);

  const roleDescriptions: Record<UserRole, string> = {
    owner: 'Akses penuh: analitik penjualan harian/bulanan, approval seller, kontrol piutang & ekspor laporan.',
    kasir: 'Akses operasional: langsung ke layar POS, kasir ritel & kredit, input cicilan, tanpa data omzet rahasia.',
    seller: 'Akses reseller web: cek stok barang tempo, faktur piutang berjalan, dan riwayat setoran di smartphone maupun desktop.',
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setErrorMessage('');
    setPassword('');
    if (role === 'owner') {
      setIdentifier('owner@tinounderwear.id');
    } else if (role === 'kasir') {
      setIdentifier('kasir');
    } else {
      setIdentifier('budi88');
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const result = await authenticateUser(selectedRole, identifier, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Kredensial login tidak cocok.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal terhubung ke server autentikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleDisplayNames: Record<UserRole, string> = {
    owner: 'Owner',
    kasir: 'Kasir',
    seller: 'Seller',
  };

  return (
    <div className="relative min-h-screen min-h-[100dvh] lg:h-screen lg:max-h-screen lg:overflow-hidden overflow-y-auto w-full bg-portal-gradient text-white flex flex-col justify-between p-3 sm:p-5 lg:px-10 lg:py-3.5 select-none">
      {/* Background fabric weave subtle line texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, rgba(4, 120, 87, 0.4) 0px, rgba(4, 120, 87, 0.4) 1px, transparent 1px, transparent 12px), repeating-linear-gradient(-45deg, rgba(167, 139, 250, 0.3) 0px, rgba(167, 139, 250, 0.3) 1px, transparent 1px, transparent 12px)',
        }}
        aria-hidden="true"
      />

      {/* Top micro brand kicker */}
      <header className="relative z-10 flex items-center justify-between shrink-0 py-0.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#10B981] rounded-xs animate-pulse" />
          <span className="text-[11px] font-mono-num tracking-widest uppercase text-emerald-300/80">
            Sistem Operasional Terpadu UMKM
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-stone-300 font-medium">
          <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-stone-900/60 border border-emerald-500/30 rounded-full text-emerald-300 text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Sistem Aktif (v1.0)
          </span>
          <span className="hidden sm:inline text-stone-400 text-xs">Bekasi Timur, Jawa Barat</span>
        </div>
      </header>

      {/* Main 2-column layout in single viewport */}
      <main className="relative z-10 my-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-12 items-center max-w-7xl mx-auto w-full py-1 sm:py-2">
        {/* Left column: Wordmark & Stitched Description */}
        <div className="lg:col-span-7 space-y-3 sm:space-y-4 lg:space-y-5">
          <div className="space-y-1">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight font-display bg-gradient-to-r from-[#10B981] via-[#34D399] to-[#A78BFA] bg-clip-text text-transparent drop-shadow-xs">
              TUMIN
            </h1>
            <p className="text-lg sm:text-xl font-semibold text-emerald-200/90 tracking-tight">
              Tino Underwear UMKM Integration
            </p>
          </div>

          {/* Description with dashed stitched vertical line on left */}
          <div className="relative pl-4 py-0.5">
            <div
              className="absolute left-0 top-0 bottom-0 w-0 border-l-[2px] border-dashed border-[#10B981]/70"
              aria-hidden="true"
            />
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-normal max-w-xl">
              TUMIN merupakan sistem digital yang dirancang untuk membantu Tino Underwear mengelola operasional bisnis secara terintegrasi, mulai dari transaksi penjualan, pengelolaan stok, mitra seller, hingga pencatatan piutang.
            </p>
          </div>

          {/* Value props badges */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-stone-300">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
              <span>Otomatisasi Stok Kasir</span>
            </div>
            <div className="text-stone-500">·</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#A78BFA]" />
              <span>Buku Piutang & Cicilan</span>
            </div>
            <div className="text-stone-500">·</div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />
              <span>Portal Kemitraan atau Seller</span>
            </div>
          </div>
        </div>

        {/* Right column: Chamfered dark card with stitched inner border containing login form */}
        <div className="lg:col-span-5 w-full">
          <ChamferCard
            dark={true}
            className="p-5 sm:p-6 bg-[#130E26]/95 border border-[#10B981]/30 shadow-2xl backdrop-blur-md"
          >
            {registeredSuccessNotification && (
              <div className="mb-3 p-2.5 bg-emerald-950/80 border border-emerald-500/50 rounded-sm text-xs text-emerald-200 flex items-center justify-between">
                <span>Pengajuan berhasil dikirim & menunggu verifikasi.</span>
                <button
                  onClick={() => setRegisteredSuccessNotification(false)}
                  className="text-stone-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="space-y-3 sm:space-y-3.5">
              <div>
                <span className="text-[11px] font-mono tracking-widest text-[#A78BFA] uppercase">
                  Pintu Masuk Sistem
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white mt-0.5">
                  Masuk ke Portal TUMIN
                </h2>
              </div>

              {/* Role selector (segmented tabs) */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                  Pilih Peran Pengguna
                </label>
                <div className="grid grid-cols-3 p-1 bg-[#1E1738] rounded-md border border-[#A78BFA]/20">
                  {(['owner', 'kasir', 'seller'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleSelect(role)}
                      className={`py-1 text-xs font-semibold rounded-xs transition-all text-center ${
                        selectedRole === role
                          ? 'bg-[#047857] text-white shadow-xs'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {roleDisplayNames[role]}
                    </button>
                  ))}
                </div>
                {/* One-line hint of what each role can access */}
                <p className="text-[11px] text-emerald-300/80 mt-1 leading-snug italic line-clamp-1">
                  {roleDescriptions[selectedRole]}
                </p>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-2.5 bg-rose-950/90 border border-rose-500/70 rounded-xs text-xs text-rose-200 flex items-start gap-2 animate-fadeIn shadow-md">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {/* Login form */}
              <form onSubmit={handleLoginSubmit} className="space-y-2.5 sm:space-y-3 pt-0.5">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-0.5">
                    {selectedRole === 'seller' ? 'Username atau No. WhatsApp' : 'Email / Username'}
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder={
                        selectedRole === 'seller'
                          ? 'budi88 atau 0812-8899-7711'
                          : selectedRole === 'kasir'
                          ? 'kasir'
                          : 'owner@tinounderwear.id'
                      }
                      className="w-full pl-8 pr-3 py-1.5 text-sm text-stone-100 input-stitch-dark transition-colors font-sans"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-0.5">
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <Lock className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="Kata Sandi"
                      className="w-full pl-8 pr-3 py-1.5 text-sm text-stone-100 input-stitch-dark transition-colors font-sans"
                      required
                    />
                  </div>
                </div>

                {/* Ingat saya */}
                <div className="pt-0.5">
                  <label className="flex items-center gap-1.5 text-stone-300 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-[#A78BFA]/40 bg-[#1A1433] text-[#047857] focus:ring-[#047857] text-xs"
                    />
                    <span>Ingat saya di sesi ini</span>
                  </label>
                </div>

                {/* Primary button "Masuk sebagai [role]" */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2 px-4 bg-[#047857] hover:bg-[#065F46] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-xs chamfer-btn transition-colors shadow-md flex items-center justify-center gap-2 group mt-1 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi kredensial...</span>
                    </span>
                  ) : (
                    <>
                      <span>Masuk sebagai {roleDisplayNames[selectedRole]}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>

                {/* Divider & Opsi Pendaftaran Seller: HANYA tampil jika role Seller dipilih */}
                {selectedRole === 'seller' && (
                  <div className="pt-1.5 animate-fadeIn space-y-2">
                    <div className="relative flex items-center justify-center my-1 text-center">
                      <div className="absolute inset-0 flex items-center" aria-hidden="true">
                        <div className="w-full border-t border-dashed border-stone-700/70" />
                      </div>
                      <span className="relative bg-[#130E26] px-3 text-[10px] text-stone-400 uppercase font-mono tracking-wider">
                        atau belum terdaftar?
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowRegisterModal(true)}
                      className="w-full py-2 px-3 bg-[#6D28D9]/30 hover:bg-[#6D28D9]/50 border border-dashed border-[#A78BFA]/50 hover:border-[#A78BFA] text-purple-200 text-xs font-semibold rounded-xs chamfer-btn transition-colors text-center block cursor-pointer"
                    >
                      Daftar sebagai Seller (Mitra Baru Tanpa Email)
                    </button>

                    <div className="text-center pt-1">
                      <a
                        href="https://wa.me/6281298765432?text=Halo%20Owner%20Tino%20Underwear,%20saya%20mitra%20seller%20ingin%20menanyakan%20akun%20login%20saya"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-stone-400 hover:text-emerald-300 underline inline-flex items-center gap-1 transition-colors"
                      >
                        Lupa kata sandi? Hubungi Owner via WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </ChamferCard>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 pt-2 pb-0.5 border-t border-stone-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-1 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-200">Tino Underwear · Bekasi</span>
          <span>·</span>
          <span>Pusat Grosir & Eceran Celana Dalam Berkualitas</span>
        </div>
        <div className="text-stone-400 text-[11px]">
          <span>© 2026 TUMIN Information System & POS · Hak Cipta Dilindungi</span>
        </div>
      </footer>

      {/* Modals */}
      <SellerRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSuccess={() => setRegisteredSuccessNotification(true)}
      />
    </div>
  );
};
