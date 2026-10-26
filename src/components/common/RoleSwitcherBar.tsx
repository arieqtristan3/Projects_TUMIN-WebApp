import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import {
  Layers,
  LayoutDashboard,
  ShoppingCart,
  Smartphone,
  Store,
  LogOut,
  RefreshCw,
  Users,
} from 'lucide-react';

interface RoleSwitcherBarProps {
  onOpenFigma?: () => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = ({ onOpenFigma }) => {
  const { currentUser, currentRole, loginAs, logout, resetToDefaultData, pendingSellersCount } =
    useApp();

  return (
    <aside
      aria-label="Demo Role Switcher"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 bg-[#10241D]/95 text-white backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#047857]/40 shadow-2xl flex items-center gap-2 sm:gap-2.5 text-xs"
    >
      <span className="hidden sm:inline-block font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold px-1.5">
        Peran Demo:
      </span>

      {/* Screen 1: Portal (Logged out) */}
      <button
        onClick={() => logout()}
        className={`px-3 py-1.5 rounded-full font-semibold transition-all duration-150 cursor-pointer select-none active:scale-95 flex items-center gap-1 text-[11px] ${
          currentUser === null
            ? 'bg-stone-700 text-white shadow-xs ring-1 ring-stone-400'
            : 'text-stone-300 hover:text-white hover:bg-stone-800 hover:scale-105'
        }`}
        title="Screen 1: Portal Masuk & Login"
      >
        <span>Portal</span>
      </button>

      {/* Screen 2: Kasir (POS) */}
      <button
        onClick={() => loginAs('kasir')}
        className={`px-3 py-1.5 rounded-full font-semibold transition-all duration-150 cursor-pointer select-none active:scale-95 flex items-center gap-1.5 text-[11px] ${
          currentRole === 'kasir'
            ? 'bg-[#047857] text-white shadow-xs ring-2 ring-emerald-400/50'
            : 'text-stone-300 hover:text-white hover:bg-stone-800 hover:scale-105'
        }`}
        title="Screen 2: Kasir / Layar POS"
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        <span>Kasir (POS)</span>
      </button>

      {/* Screen 3: Owner */}
      <button
        onClick={() => loginAs('owner')}
        className={`px-3 py-1.5 rounded-full font-semibold transition-all duration-150 cursor-pointer select-none active:scale-95 flex items-center gap-1.5 text-[11px] relative ${
          currentRole === 'owner'
            ? 'bg-[#047857] text-white shadow-xs ring-2 ring-emerald-400/50'
            : 'text-stone-300 hover:text-white hover:bg-stone-800 hover:scale-105'
        }`}
        title="Screen 3: Owner Information System Dashboard"
      >
        <LayoutDashboard className="w-3.5 h-3.5" />
        <span>Owner</span>
        {pendingSellersCount > 0 && (
          <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 ring-2 ring-stone-900" />
        )}
      </button>

      {/* Screen 4: Seller (Web Responsif Smartphone & Desktop) */}
      <button
        onClick={() => loginAs('seller')}
        className={`px-3 py-1.5 rounded-full font-semibold transition-all duration-150 cursor-pointer select-none active:scale-95 flex items-center gap-1.5 text-[11px] ${
          currentRole === 'seller'
            ? 'bg-[#6D28D9] text-white shadow-xs ring-2 ring-purple-400/50'
            : 'text-stone-300 hover:text-white hover:bg-stone-800 hover:scale-105'
        }`}
        title="Screen 4: Portal Mitra Seller (Smartphone & Desktop)"
      >
        <Store className="w-3.5 h-3.5" />
        <span>Seller (Web)</span>
      </button>

      {/* Divider */}
      <span className="text-stone-600 hidden sm:inline px-1" aria-hidden="true">
        |
      </span>

      {/* Figma Canvas Mode Button */}
      {onOpenFigma && (
        <button
          onClick={onOpenFigma}
          className="px-3 py-1.5 rounded-full font-semibold transition-all duration-150 cursor-pointer select-none active:scale-95 flex items-center gap-1.5 text-[11px] bg-gradient-to-r from-[#A259FF] to-[#0ACF83] text-white hover:opacity-95 hover:scale-105 shadow-xs"
          title="Buka Mode Kanvas Desain Figma (Multi-Artboard & Export SVG)"
        >
          <span className="font-bold text-[10px]">❖</span>
          <span>Kanvas Figma</span>
        </button>
      )}

      {/* Quick Reset Demo Data */}
      <button
        onClick={() => {
          if (confirm('Reset seluruh data transaksi, stok, dan mitra ke data default awal?')) {
            resetToDefaultData();
          }
        }}
        className="p-1.5 text-stone-400 hover:text-emerald-400 hover:bg-stone-800 rounded-full transition-all duration-150 cursor-pointer select-none active:scale-90 hidden sm:flex items-center"
        title="Reset Data Demo"
        aria-label="Reset Data Demo"
      >
        <RefreshCw className="w-3.5 h-3.5" />
      </button>
    </aside>
  );
};
