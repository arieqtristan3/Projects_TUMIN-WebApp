import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UserProfile,
  UserRole,
  Product,
  Seller,
  Invoice,
  CartItem,
  ConsignedItem,
  PaymentMethod,
  InstallmentPayment,
  StockMutation,
} from '../types';
import {
  apiFetch,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
  registerAuthErrorHandler,
} from '../services/apiService';

interface AppContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole | null;
  setCurrentUser: (user: UserProfile | null) => void;
  authenticateUser: (
    role: UserRole,
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  logout: () => void;

  // Products & Stock
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated'>) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  adjustStock: (id: string, newStock: number, reason?: string) => Promise<void>;
  stockMutations: StockMutation[];
  restockProduct: (productId: string, quantity: number, notes?: string, supplier?: string, reference?: string) => Promise<void>;
  applyStockOpname: (adjustments: { productId: string; physicalStock: number; reason: string }[]) => Promise<void>;

  // Sellers
  sellers: Seller[];
  registerSeller: (data: {
    username?: string;
    name: string;
    storeName: string;
    phone: string;
    address: string;
    email?: string;
    password?: string;
  }) => Promise<Seller>;
  approveSeller: (id: string, creditLimit?: number) => Promise<void>;
  rejectSeller: (id: string) => Promise<void>;
  deleteSeller: (id: string) => Promise<void>;
  updateSeller: (id: string, updates: Partial<Seller>) => Promise<void>;

  // Invoices & Receivables (Piutang)
  invoices: Invoice[];
  createSaleTransaction: (params: {
    items: CartItem[];
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    sellerId?: string;
    dueDate?: string;
    discount?: number;
    paymentProofImage?: string;
    bankName?: string;
    transferReference?: string;
  }) => Promise<{ success: boolean; invoice?: Invoice; error?: string }>;
  recordInstallment: (params: {
    invoiceId: string;
    amount: number;
    method: 'Tunai' | 'Transfer Bank';
    notes?: string;
    paymentProofImage?: string;
  }) => Promise<{ success: boolean; error?: string }>;

  // Consigned Items
  consignedItems: ConsignedItem[];

  // System helpers & Security notifications
  dbConnected: boolean;
  dataReady: boolean;
  dbNoticeMessage: string | null;
  authWarningMessage: string | null;
  clearAuthWarning: () => void;
  pendingSellersCount: number;
  totalReceivablesSummary: {
    total: number;
    unpaid: number;
    partiallyPaid: number;
    paid: number;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'tumin_app_state_v1';

// Helper broadcast channel untuk notifikasi instan antar tab
const broadcastTabMessage = (payload: { type: string; [key: string]: any }) => {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('tumin_multi_tab_sync');
      channel.postMessage(payload);
      channel.close();
    }
  } catch {}
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Sesi pengguna: Simpan HANYA di sessionStorage (tab-isolated)
  // 1. Refresh tab (F5): sessionStorage tetap bertahan, pengguna TIDAK keluar dari role aktif.
  // 2. Buka tab baru di browser: sessionStorage kosong secara default, aplikasi otomatis mulai dari Portal Login.
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      // Hapus data sesi lama di localStorage (jika ada dari versi sebelumnya) agar tidak bocor ke tab baru
      localStorage.removeItem(STORAGE_KEY + '_currentUser');

      // Ambil sesi unik hanya untuk tab browser ini
      const sessionUser = sessionStorage.getItem(STORAGE_KEY + '_currentUser');
      if (sessionUser) return JSON.parse(sessionUser);
    } catch (e) {
      console.warn('Gagal memuat sesi pengguna tersimpan:', e);
    }
    return null;
  });

  // Simpan sesi HANYA di sessionStorage saat currentUser berubah.
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY + '_currentUser');
    if (currentUser) {
      sessionStorage.setItem(STORAGE_KEY + '_currentUser', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(STORAGE_KEY + '_currentUser');
    }
  }, [currentUser]);

  // Data bisnis selalu dimuat dari PostgreSQL. Tidak ada fallback ke data demo/localStorage.
  const [products, setProducts] = useState<Product[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [consignedItems, setConsignedItems] = useState<ConsignedItem[]>([]);
  const [stockMutations, setStockMutations] = useState<StockMutation[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const loadBackendDataRef = useRef<() => Promise<void>>(async () => {});

  // Sinkronisasi antar-tab hanya memberi sinyal untuk membaca ulang PostgreSQL.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('tumin_multi_tab_sync');
    channel.onmessage = (event) => {
      if (event.data?.type === 'STATE_REFRESH' || event.data?.type === 'NEW_TRANSACTION') {
        void loadBackendDataRef.current();
      }
    };
    return () => channel.close();
  }, []);

  const [dbConnected, setDbConnected] = useState(false);
  const [dbNoticeMessage, setDbNoticeMessage] = useState<string | null>(null);
  const [authWarningMessage, setAuthWarningMessage] = useState<string | null>(null);
  const clearAuthWarning = () => setAuthWarningMessage(null);

  // Penanganan Event Error Autentikasi Terpusat (401, 403, 503)
  useEffect(() => {
    const unregister = registerAuthErrorHandler((event) => {
      if (event.type === 'UNAUTHORIZED') {
        // HTTP 401: Sesi tidak valid / token kedaluwarsa -> hapus token & sesi, arahkan ke login
        clearStoredToken();
        sessionStorage.removeItem(STORAGE_KEY + '_currentUser');
        localStorage.removeItem(STORAGE_KEY + '_currentUser');
        setCurrentUser(null);
        setAuthWarningMessage('Sesi login telah kedaluwarsa. Silakan masuk kembali.');
      } else if (event.type === 'FORBIDDEN') {
        // HTTP 403: Hak akses ditolak / akun dinonaktifkan
        setAuthWarningMessage(event.message || 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.');
      } else if (event.type === 'SERVICE_UNAVAILABLE') {
        // HTTP 503: Database offline (Fail-Closed) -> tampilkan pemberitahuan tanpa logout
        setDbConnected(false);
        setDbNoticeMessage(
          event.message || 'Layanan database PostgreSQL sedang tidak tersedia (Database Offline). Akses data privat dilindungi (Fail-Closed).'
        );
      }
    });

    return () => {
      unregister();
    };
  }, []);

  // PostgreSQL adalah satu-satunya sumber data bisnis. Semua koleksi dimuat bersama.
  async function loadBackendData() {
    if (!getStoredToken()) { setDataReady(true); return; }
    const isSeller = currentUser?.role === 'seller';
    const endpoints = ['/api/produk', '/api/mitra-seller', '/api/faktur', '/api/mutasi-stok', '/api/cicilan', '/api/barang-konsinyasi'];
    const results = await Promise.all([
      apiFetch('/api/produk', { suppressGlobalError: true }),
      apiFetch('/api/mitra-seller', { suppressGlobalError: true }),
      apiFetch('/api/faktur', { suppressGlobalError: true }),
      isSeller ? Promise.resolve({ ok: true, source: 'postgresql', data: [] } as any) : apiFetch('/api/mutasi-stok', { suppressGlobalError: true }),
      apiFetch('/api/cicilan', { suppressGlobalError: true }),
      apiFetch('/api/barang-konsinyasi', { suppressGlobalError: true }),
    ]);
    const [prodRes, sellerRes, invRes, mutRes, installmentRes, consignedRes] = results;
    const allSucceeded = results.every((result) => result.ok && result.source === 'postgresql' && Array.isArray(result.data));
    if (!allSucceeded) {
      if (results.some((result) => result.status === 401)) {
        clearStoredToken();
        sessionStorage.removeItem(STORAGE_KEY + '_currentUser');
        setCurrentUser(null);
        setAuthWarningMessage('Sesi login berakhir. Silakan masuk kembali.');
      } else {
        const failed = endpoints.filter((_, index) => !results[index].ok);
        setAuthWarningMessage(`Data belum dapat dimuat lengkap dari database: ${failed.join(', ')}. Silakan coba muat ulang.`);
        if (results.some((result) => result.status === 503)) setDbConnected(false);
      }
      setDataReady(true);
      return;
    }
    const installmentRows = installmentRes.data as any[];
    const mappedInstallments = new Map<string, InstallmentPayment[]>();
    for (const row of installmentRows) {
      const invoiceId = row.invoiceId ?? row.id_faktur;
      const item: InstallmentPayment = {
        id: row.id, date: row.date ?? row.tanggal, amount: Number(row.amount ?? row.nominal_cicilan),
        method: row.method ?? row.metode_pembayaran, recordedBy: row.recordedBy ?? row.dicatat_oleh,
        notes: row.notes ?? row.catatan ?? undefined,
        paymentProofImage: row.paymentProofImage ?? row.foto_bukti_transfer ?? undefined,
      };
      const existing = mappedInstallments.get(invoiceId) || [];
      existing.push(item);
      mappedInstallments.set(invoiceId, existing);
    }
    setProducts(prodRes.data as Product[]);
    setSellers(sellerRes.data as Seller[]);
    setInvoices((invRes.data as Invoice[]).map((invoice) => ({
      ...invoice, installments: mappedInstallments.get(invoice.id) || [],
    })));
    setStockMutations(mutRes.data as StockMutation[]);
    setConsignedItems(consignedRes.data as ConsignedItem[]);
    setAuthWarningMessage(null);
    setDataReady(true);
  }
  loadBackendDataRef.current = loadBackendData;

  useEffect(() => {
    if (!currentUser) {
      setDataReady(true);
      return;
    }
    if (getStoredToken()) {
      setDataReady(false);
      void loadBackendData();
    } else {
      setCurrentUser(null);
      setDataReady(true);
      setAuthWarningMessage('Sesi autentikasi tidak ditemukan. Silakan masuk kembali.');
    }
  }, [currentUser]);

  // Auto-sync ke backend jika status server terhubung
  useEffect(() => {
    apiFetch('/api/status', { isPublic: true, suppressGlobalError: true })
      .then((stRes) => {
        if (stRes.ok && stRes.data?.database === 'connected') {
          setDbConnected(true);
          setDbNoticeMessage(null);
          console.log('🔗 [TUMIN App] Terhubung langsung ke Database PostgreSQL.');
        } else {
          setDbConnected(false);
          if (stRes.data?.database === 'offline_fallback') {
            setDbNoticeMessage('Database PostgreSQL offline. Sistem beroperasi dalam mode aman (Fail-Closed pada data privat).');
          }
        }
      })
      .catch(() => {
        setDbConnected(false);
      });

    // Refresh data dari PostgreSQL secara berkala untuk menjaga konsistensi antar perangkat.
    const pollTimer = setInterval(() => {
      if (getStoredToken()) void loadBackendDataRef.current();
    }, 15000);

    return () => clearInterval(pollTimer);
  }, [currentUser]);

  const authenticateUser = async (
    role: UserRole,
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    const cleanId = identifier.trim();
    // Password harus dikirim persis seperti yang diketik; spasi bisa menjadi bagian password.
    const suppliedPassword = password;

    if (!cleanId || suppliedPassword.length === 0) {
      return { success: false, error: 'Silakan isi Email/Username dan Kata Sandi.' };
    }

    try {
      const res = await apiFetch<{
        success: boolean;
        token?: string;
        user?: any;
        error?: string;
      }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          role,
          identifier: cleanId,
          password: suppliedPassword,
        }),
        isPublic: true,
      });

      if (res.ok && res.data?.success && res.data?.user) {
        // Simpan JWT di sessionStorage secara aman
        if (res.data.token) {
          setStoredToken(res.data.token);
        }

        // Simpan profil pengguna di sessionStorage (Kredensial password dihapus sepenuhnya)
        const safeUser: UserProfile = {
          id: res.data.user.id,
          username: res.data.user.username,
          name: res.data.user.name,
          email: res.data.user.email,
          role: res.data.user.role,
          shift: res.data.user.shift,
          phone: res.data.user.phone,
          storeName: res.data.user.storeName,
        };

        sessionStorage.setItem(STORAGE_KEY + '_currentUser', JSON.stringify(safeUser));
        localStorage.removeItem(STORAGE_KEY + '_currentUser');
        setProducts([]); setSellers([]); setInvoices([]); setConsignedItems([]); setStockMutations([]);
        setDataReady(false);
        setCurrentUser(safeUser);
        setAuthWarningMessage(null);

        // Data terbaru dimuat oleh effect setelah currentUser berubah.

        return { success: true, user: safeUser };
      }

      return {
        success: false,
        error: res.error || res.data?.error || 'Email/Username atau Kata Sandi salah.',
      };
    } catch {
      return {
        success: false,
        error: 'Tidak dapat terhubung ke server autentikasi TUMIN.',
      };
    }
  };


  const logout = () => {
    clearStoredToken();
    sessionStorage.removeItem(STORAGE_KEY + '_currentUser');
    localStorage.removeItem(STORAGE_KEY + '_currentUser');
    sessionStorage.removeItem('tumin_owner_active_nav');
    sessionStorage.removeItem('tumin_kasir_active_tab');
    sessionStorage.removeItem('tumin_seller_active_tab');
    setCurrentUser(null);
    setProducts([]); setSellers([]); setInvoices([]); setConsignedItems([]); setStockMutations([]);
    setDataReady(true);
    setAuthWarningMessage(null);
  };

  // Product CRUD: state hanya berubah setelah server mengonfirmasi penyimpanan.
  const addProduct = async (data: Omit<Product, 'id' | 'lastUpdated'>) => {
    const now = new Date();
    const newProduct: Product = { ...data, id: `prod-${crypto.randomUUID()}`, lastUpdated: now.toISOString() };
    const response = await apiFetch('/api/produk', { method: 'POST', body: JSON.stringify(newProduct), suppressGlobalError: true });
    if (!response.ok) {
      const message = response.error || 'Produk gagal disimpan ke PostgreSQL.';
      setAuthWarningMessage(message); throw new Error(message);
    }
    await loadBackendData();
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const current = products.find((product) => product.id === id);
    if (!current) throw new Error('Produk tidak ditemukan.');
    const response = await apiFetch('/api/produk', {
      method: 'POST', body: JSON.stringify({ ...current, ...updates, stock: current.stock, id, lastUpdated: new Date().toISOString() }), suppressGlobalError: true,
    });
    if (!response.ok) {
      const message = response.error || 'Perubahan produk gagal disimpan ke PostgreSQL.';
      setAuthWarningMessage(message); throw new Error(message);
    }
    await loadBackendData();
  };


  const adjustStock = async (id: string, newStock: number, reason?: string) => {
    const target = products.find((product) => product.id === id);
    if (!target || !Number.isInteger(newStock) || newStock < 0) throw new Error('Jumlah stok tidak valid.');
    const response = await apiFetch(`/api/produk/${encodeURIComponent(id)}/stock-adjustment`, {
      method: 'POST', body: JSON.stringify({ newStock, reason: reason || 'Penyesuaian stok manual' }), suppressGlobalError: true,
    });
    if (!response.ok) {
      const message = response.error || 'Penyesuaian stok gagal disimpan.';
      setAuthWarningMessage(message); throw new Error(message);
    }
    await loadBackendData();
  };

  const restockProduct = async (productId: string, quantity: number, notes?: string, supplier?: string, reference?: string) => {
    const target = products.find((product) => product.id === productId);
    if (!target || !Number.isInteger(quantity) || quantity <= 0) throw new Error('Jumlah restok tidak valid.');
    const response = await apiFetch(`/api/produk/${encodeURIComponent(productId)}/stock-adjustment`, {
      method: 'POST', body: JSON.stringify({ change: quantity, type: 'RESTOCK', reference: reference || supplier || '', reason: notes || `Restok dari ${supplier || 'pemasok'}` }), suppressGlobalError: true,
    });
    if (!response.ok) {
      const message = response.error || 'Restok gagal disimpan.';
      setAuthWarningMessage(message); throw new Error(message);
    }
    await loadBackendData();
  };

  const applyStockOpname = async (adjustments: { productId: string; physicalStock: number; reason: string }[]) => {
    const response = await apiFetch('/api/stok/opname', { method: 'POST', body: JSON.stringify({ adjustments }), suppressGlobalError: true });
    if (!response.ok) {
      const message = response.error || 'Stock opname gagal disimpan.';
      setAuthWarningMessage(message); throw new Error(message);
    }
    await loadBackendData();
  };

  // Seller management
  const registerSeller = async (data: {
    username?: string;
    name: string;
    storeName: string;
    phone: string;
    address: string;
    email?: string;
    password?: string;
  }): Promise<Seller> => {
    const today = new Date().toISOString().slice(0, 10);
    const cleanUsername = data.username?.trim().toLowerCase() || data.phone.replace(/\D/g, '') || `seller_${Date.now().toString().slice(-4)}`;
    const newSeller: Seller = {
      id: 'sel-' + Date.now(),
      username: cleanUsername,
      name: data.name,
      storeName: data.storeName,
      phone: data.phone,
      email: data.email || undefined,
      address: data.address,
      status: 'Pending',
      creditLimit: 5000000,
      totalReceivables: 0,
      lastTransactionDate: '-',
      registeredDate: today,
      notes: 'Pengajuan pendaftaran mandiri - menunggu persetujuan Owner.',
    };

    const response = await apiFetch('/api/mitra-seller', {
      method: 'POST',
      body: JSON.stringify({ ...newSeller, password: data.password || '' }),
      suppressGlobalError: true,
    });
    if (!response.ok) throw new Error(response.error || response.data?.error || 'Pendaftaran Seller gagal disimpan.');
    await loadBackendData();
    return newSeller;
  };

  const updateSellerOnServer = async (id: string, updates: Partial<Seller>) => {
    const response = await apiFetch(`/api/mitra-seller/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      suppressGlobalError: true,
    });
    if (!response.ok) {
      const message = response.error || response.data?.error || 'Perubahan seller gagal disimpan ke database.';
      setAuthWarningMessage(message);
      throw new Error(message);
    }
    setAuthWarningMessage(null);
    await loadBackendData();
  };

  const approveSeller = async (id: string, creditLimit?: number) => {
    const seller = sellers.find((item) => item.id === id);
    if (!seller) throw new Error('Seller tidak ditemukan.');
    const updates: Partial<Seller> = {
      status: 'Aktif',
      creditLimit: creditLimit !== undefined ? creditLimit : (seller.creditLimit || 5000000),
    };
    await updateSellerOnServer(id, updates);
    setSellers((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  };

  const rejectSeller = async (id: string) => {
    await updateSellerOnServer(id, { status: 'Ditangguhkan' });
    setSellers((prev) => prev.map((item) => item.id === id ? { ...item, status: 'Ditangguhkan' } : item));
  };

  const deleteSeller = async (id: string) => {
    const response = await apiFetch(`/api/mitra-seller/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      suppressGlobalError: true,
    });
    if (!response.ok) {
      const message = response.error || response.data?.error || 'Seller gagal dihapus.';
      throw new Error(message);
    }
    await loadBackendData();
    broadcastTabMessage({ type: 'STATE_REFRESH' });
  };

  const updateSeller = async (id: string, updates: Partial<Seller>) => {
    await updateSellerOnServer(id, updates);
    setSellers((prev) => prev.map((item) => item.id === id ? { ...item, ...updates } : item));
  };

  // Sales and POS
  const createSaleTransaction = async ({
    items,
    paymentMethod,
    cashReceived,
    sellerId,
    dueDate,
    discount = 0,
    paymentProofImage,
    bankName,
    transferReference,
  }: {
    items: CartItem[];
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    sellerId?: string;
    dueDate?: string;
    discount?: number;
    paymentProofImage?: string;
    bankName?: string;
    transferReference?: string;
  }): Promise<{ success: boolean; invoice?: Invoice; error?: string }> => {
    if (!items || items.length === 0) {
      return { success: false, error: 'Keranjang belanja masih kosong.' };
    }

    const subtotal = items.reduce((acc, curr) => acc + curr.subtotal, 0);
    const total = Math.max(0, subtotal - discount);

    // Validate cash payment
    if (paymentMethod === 'Tunai') {
      if (!cashReceived || cashReceived < total) {
        return {
          success: false,
          error: `Uang diterima (Rp ${(cashReceived || 0).toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${total.toLocaleString('id-ID')}).`,
        };
      }
    }

    // Validate credit payment
    let targetSeller: Seller | undefined;
    if (paymentMethod === 'Kredit') {
      if (!sellerId) {
        return { success: false, error: 'Silakan pilih mitra seller untuk transaksi kredit.' };
      }
      targetSeller = sellers.find((s) => s.id === sellerId);
      if (!targetSeller) {
        return { success: false, error: 'Mitra seller tidak ditemukan.' };
      }
      if (targetSeller.status !== 'Aktif') {
        return {
          success: false,
          error: `Transaksi kredit hanya dapat diberikan kepada mitra dengan status Aktif. Status ${targetSeller.name}: ${targetSeller.status}.`,
        };
      }
      if (!dueDate) {
        return { success: false, error: 'Tanggal jatuh tempo wajib diisi untuk transaksi kredit.' };
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      if (dueDate <= todayStr) {
        return { success: false, error: 'Tanggal jatuh tempo harus setelah hari ini.' };
      }
    }

    // Check inventory stock availability
    for (const item of items) {
      const currentProd = products.find((p) => p.id === item.product.id);
      if (!currentProd) {
        return { success: false, error: `Produk "${item.product.name}" tidak ditemukan.` };
      }
      if (currentProd.stock < item.quantity) {
        return {
          success: false,
          error: `Stok tidak mencukupi untuk "${currentProd.name}". Tersedia: ${currentProd.stock}, diminta: ${item.quantity}.`,
        };
      }
    }

    // Generate Invoice Number: #INV-YYYYMMDD-XXX
    const now = new Date();
    const yyyymmdd = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `#INV-${yyyymmdd}-${randomSuffix}`;
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      date: dateStr,
      cashierName: currentUser?.name || 'Kasir Toko',
      items: items.map((i) => ({
        productId: i.product.id,
        productSku: i.product.sku,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.price,
        subtotal: i.subtotal,
      })),
      subtotal,
      discount,
      total,
      paymentMethod,
      cashReceived: paymentMethod === 'Tunai' ? cashReceived : undefined,
      change: paymentMethod === 'Tunai' ? (cashReceived || 0) - total : undefined,
      paymentProofImage: paymentMethod === 'Transfer Bank' ? paymentProofImage : undefined,
      bankName:
        paymentMethod === 'Transfer Bank'
          ? bankName || undefined
          : undefined,
      transferReference: paymentMethod === 'Transfer Bank' ? transferReference : undefined,
      sellerId: paymentMethod === 'Kredit' ? sellerId : undefined,
      sellerName:
        paymentMethod === 'Kredit' && targetSeller
          ? `${targetSeller.name} (${targetSeller.storeName})`
          : undefined,
      dueDate: paymentMethod === 'Kredit' ? dueDate : undefined,
      amountPaid: paymentMethod === 'Kredit' ? 0 : total,
      remainingBalance: paymentMethod === 'Kredit' ? total : 0,
      status: paymentMethod === 'Kredit' ? 'UNPAID' : 'PAID',
      installments: [],
    };

    const apiResult = await apiFetch('/api/faktur', {
      method: 'POST',
      body: JSON.stringify(newInvoice),
      suppressGlobalError: true,
    });
    if (!apiResult.ok) {
      return { success: false, error: apiResult.error || apiResult.data?.error || 'Transaksi gagal disimpan ke database.' };
    }

    // Faktur, item, pengurangan stok, mutasi, dan piutang dicatat atomik oleh backend.
    await loadBackendData();
    broadcastTabMessage({ type: 'STATE_REFRESH' });
    return { success: true, invoice: newInvoice };
  };

  // Record installment payment (Catat Pembayaran Cicilan)
  const recordInstallment = async ({
    invoiceId,
    amount,
    method,
    notes,
    paymentProofImage,
  }: {
    invoiceId: string;
    amount: number;
    method: 'Tunai' | 'Transfer Bank';
    notes?: string;
    paymentProofImage?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const targetInvoice = invoices.find((inv) => inv.id === invoiceId);
    if (!targetInvoice) {
      return { success: false, error: 'Faktur tidak ditemukan.' };
    }

    if (targetInvoice.remainingBalance <= 0) {
      return { success: false, error: 'Faktur ini sudah lunas sepenuhnya.' };
    }

    if (amount <= 0) {
      return { success: false, error: 'Nominal pembayaran harus lebih besar dari 0.' };
    }

    if (amount > targetInvoice.remainingBalance) {
      return {
        success: false,
        error: `Nominal cicilan (Rp ${amount.toLocaleString('id-ID')}) melebihi sisa tagihan (Rp ${targetInvoice.remainingBalance.toLocaleString('id-ID')}).`,
      };
    }

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');

    const newInstallment: InstallmentPayment = {
      id: 'inst-' + Date.now(),
      date: dateStr,
      amount,
      method,
      recordedBy: currentUser?.name || 'Kasir',
      notes,
      paymentProofImage,
    };

    const response = await apiFetch('/api/cicilan', {
      method: 'POST',
      body: JSON.stringify({ ...newInstallment, invoiceId }),
      suppressGlobalError: true,
    });
    if (!response.ok) return { success: false, error: response.error || response.data?.error || 'Cicilan gagal disimpan.' };

    await loadBackendData();
    broadcastTabMessage({ type: 'STATE_REFRESH' });
    return { success: true };
  };


  const pendingSellersCount = sellers.filter((s) => s.status === 'Pending').length;

  const totalReceivablesSummary = {
    total: invoices.reduce((acc, inv) => {
      if (inv.paymentMethod !== 'Kredit') return acc;
      const bal =
        typeof inv.remainingBalance === 'number' && !isNaN(inv.remainingBalance)
          ? inv.remainingBalance
          : Math.max(0, (Number(inv.total) || 0) - (Number(inv.amountPaid) || 0));
      return acc + (isNaN(bal) ? 0 : bal);
    }, 0),
    unpaid: invoices.filter((i) => i.paymentMethod === 'Kredit' && (i.status === 'UNPAID' || (i as any).status === 'BELUM_LUNAS')).length,
    partiallyPaid: invoices.filter((i) => i.paymentMethod === 'Kredit' && (i.status === 'PARTIALLY_PAID' || (i as any).status === 'PARTIAL' || (i as any).status === 'SEBAGIAN')).length,
    paid: invoices.filter((i) => i.paymentMethod === 'Kredit' && (i.status === 'PAID' || (i as any).status === 'LUNAS')).length,
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || null,
        setCurrentUser,
        authenticateUser,
        logout,
        products,
        addProduct,
        updateProduct,
        adjustStock,
        stockMutations,
        restockProduct,
        applyStockOpname,
        sellers,
        registerSeller,
        approveSeller,
        rejectSeller,
        deleteSeller,
        updateSeller,
        invoices,
        createSaleTransaction,
        recordInstallment,
        consignedItems,
        dbConnected,
        dataReady,
        dbNoticeMessage,
        authWarningMessage,
        clearAuthWarning,
        pendingSellersCount,
        totalReceivablesSummary,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
