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

function AppRouter() {
  const { currentUser, currentRole } = useApp();

  // Screen 1: Public Portal + Login (when not logged in)
  if (!currentUser) {
    return <PublicPortal />;
  }

  // Screen 2: Kasir / POS
  if (currentRole === 'kasir') {
    return <PosScreen />;
  }

  // Screen 3: Owner Dashboard
  if (currentRole === 'owner') {
    return <OwnerDashboard />;
  }

  // Screen 4: Seller Portal (Web Responsif Smartphone & Desktop)
  if (currentRole === 'seller') {
    return <SellerPortal />;
  }

  return <PublicPortal />;
}

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
    </AppProvider>
  );
}
