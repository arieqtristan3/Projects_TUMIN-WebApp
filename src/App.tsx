/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { PublicPortal } from './components/portal/PublicPortal';
import { PosScreen } from './components/pos/PosScreen';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { SellerPortal } from './components/seller/SellerPortal';

import { AlertCircle, ShieldAlert, X } from 'lucide-react';

function SecurityBanner() {
  const { authWarningMessage, dbNoticeMessage, clearAuthWarning } = useApp();

  if (!authWarningMessage && !dbNoticeMessage) {
    return null;
  }

  return (
    <div className="fixed top-3 right-3 z-50 max-w-md space-y-2 pointer-events-auto">
      {authWarningMessage && (
        <div className="flex items-start gap-3 p-3.5 bg-amber-900/90 border border-amber-500/50 rounded-xl shadow-xl text-amber-100 text-xs backdrop-blur-md">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-amber-200">Pemberitahuan Sistem</p>
            <p className="mt-0.5 leading-relaxed">{authWarningMessage}</p>
          </div>
          <button
            onClick={clearAuthWarning}
            className="p-1 text-amber-300 hover:text-white rounded-md transition-colors"
            title="Tutup pemberitahuan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {dbNoticeMessage && (
        <div className="flex items-start gap-3 p-3.5 bg-rose-950/90 border border-rose-500/50 rounded-xl shadow-xl text-rose-100 text-xs backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Status Database (Fail-Closed)</p>
            <p className="mt-0.5 leading-relaxed">{dbNoticeMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function AppRouter() {
  const { currentUser, currentRole, dataReady } = useApp();

  return (
    <>
      <SecurityBanner />
      {currentUser && !dataReady && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
          <div className="text-center"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" /><p className="text-sm font-semibold">Memuat data TUMIN dari PostgreSQL...</p></div>
        </div>
      )}
      {!currentUser && <PublicPortal />}
      {currentUser && dataReady && currentRole === 'kasir' && <PosScreen />}
      {currentUser && dataReady && currentRole === 'owner' && <OwnerDashboard />}
      {currentUser && dataReady && currentRole === 'seller' && <SellerPortal />}
      {currentUser && dataReady && currentRole !== 'kasir' && currentRole !== 'owner' && currentRole !== 'seller' && <PublicPortal />}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
