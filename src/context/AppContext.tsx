import React, { createContext, useContext, useState, useEffect } from 'react';
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
  INITIAL_PRODUCTS,
  INITIAL_SELLERS,
  INITIAL_INVOICES,
  INITIAL_CONSIGNED_ITEMS,
  INITIAL_STOCK_MUTATIONS,
} from '../data/initialData';

interface AppContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole | null;
  setCurrentUser: (user: UserProfile | null) => void;
  loginAs: (role: UserRole, customUser?: Partial<UserProfile>) => void;
  authenticateUser: (
    role: UserRole,
    identifier: string,
    password: string
  ) => Promise<{ success: boolean; user?: UserProfile; error?: string }>;
  logout: () => void;

  // Products & Stock
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'lastUpdated'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  adjustStock: (id: string, newStock: number, reason?: string) => void;
  stockMutations: StockMutation[];
  recordStockMutation: (mutation: Omit<StockMutation, 'id' | 'date'>) => void;
  restockProduct: (productId: string, quantity: number, notes?: string, supplier?: string) => void;
  applyStockOpname: (adjustments: { productId: string; physicalStock: number; reason: string }[]) => void;

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
  }) => Seller;
  approveSeller: (id: string, creditLimit?: number) => void;
  rejectSeller: (id: string) => void;
  updateSeller: (id: string, updates: Partial<Seller>) => void;

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
  }) => { success: boolean; invoice?: Invoice; error?: string };
  recordInstallment: (params: {
    invoiceId: string;
    amount: number;
    method: 'Tunai' | 'Transfer Bank';
    notes?: string;
    paymentProofImage?: string;
  }) => { success: boolean; error?: string };

  // Consigned Items
  consignedItems: ConsignedItem[];

  // System helpers
  dbConnected: boolean;
  resetToDefaultData: () => void;
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

  // Simpan sesi HANYA di sessionStorage saat currentUser berubah
  useEffect(() => {
    localStorage.removeItem(STORAGE_KEY + '_currentUser');
    if (currentUser) {
      sessionStorage.setItem(STORAGE_KEY + '_currentUser', JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(STORAGE_KEY + '_currentUser');
    }
  }, [currentUser]);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [sellers, setSellers] = useState<Seller[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_sellers');
    if (saved) {
      try {
        const parsed: Seller[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map((s) => s.id));
        const missing = INITIAL_SELLERS.filter((s) => !existingIds.has(s.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          localStorage.setItem(STORAGE_KEY + '_sellers', JSON.stringify(merged));
          return merged;
        }
        return parsed;
      } catch {
        return INITIAL_SELLERS;
      }
    }
    return INITIAL_SELLERS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [consignedItems, setConsignedItems] = useState<ConsignedItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_consigned');
    return saved ? JSON.parse(saved) : INITIAL_CONSIGNED_ITEMS;
  });

  const [stockMutations, setStockMutations] = useState<StockMutation[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY + '_mutations');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MUTATIONS;
  });

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_sellers', JSON.stringify(sellers));
  }, [sellers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_consigned', JSON.stringify(consignedItems));
  }, [consignedItems]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY + '_mutations', JSON.stringify(stockMutations));
  }, [stockMutations]);

  // =====================================================================
  // REAL-TIME MULTI-TAB SYNCHRONIZATION (BroadcastChannel & Storage Event)
  // =====================================================================
  useEffect(() => {
    // 1. Storage Event: Terpicu otomatis di tab lain saat satu tab menulis ke localStorage
    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEY + '_invoices') {
          const parsedInvoices: Invoice[] = JSON.parse(e.newValue);
          setInvoices(parsedInvoices);
        } else if (e.key === STORAGE_KEY + '_products') {
          const parsedProducts: Product[] = JSON.parse(e.newValue);
          setProducts(parsedProducts);
        } else if (e.key === STORAGE_KEY + '_sellers') {
          const parsedSellers: Seller[] = JSON.parse(e.newValue);
          setSellers(parsedSellers);
        } else if (e.key === STORAGE_KEY + '_mutations') {
          const parsedMutations: StockMutation[] = JSON.parse(e.newValue);
          setStockMutations(parsedMutations);
        }
      } catch (err) {
        console.warn('Gagal sinkron data dari storage event:', err);
      }
    };

    window.addEventListener('storage', handleStorage);

    // 2. BroadcastChannel: Komunikasi instan sub-milidetik antar tab
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        channel = new BroadcastChannel('tumin_multi_tab_sync');
        channel.onmessage = (event) => {
          const data = event.data;
          if (data?.type === 'NEW_TRANSACTION' && data.invoice) {
            setInvoices((prev) => {
              if (prev.some((inv) => inv.id === data.invoice.id || inv.invoiceNumber === data.invoice.invoiceNumber)) {
                return prev;
              }
              return [data.invoice, ...prev];
            });
            // Sinkronkan juga produk jika disertakan
            if (data.products && Array.isArray(data.products)) {
              setProducts(data.products);
            }
          } else if (data?.type === 'STATE_REFRESH') {
            const savedInv = localStorage.getItem(STORAGE_KEY + '_invoices');
            if (savedInv) setInvoices(JSON.parse(savedInv));
            const savedProd = localStorage.getItem(STORAGE_KEY + '_products');
            if (savedProd) setProducts(JSON.parse(savedProd));
          }
        };
      } catch (err) {
        console.warn('BroadcastChannel tidak didukung di browser ini', err);
      }
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      channel?.close();
    };
  }, []);

  const [dbConnected, setDbConnected] = useState(false);

  // Auto-sync ke PostgreSQL jika backend API aktif
  useEffect(() => {
    fetch('/api/status')
      .then((res) => res.json())
      .then((st) => {
        if (st.database === 'connected') {
          setDbConnected(true);
          console.log('🔗 [TUMIN App] Terhubung langsung ke Database PostgreSQL (tumin_db)');

          // Ambil produk dari PostgreSQL
          fetch('/api/produk')
            .then((r) => r.json())
            .then((res) => {
              if (res.source === 'postgresql' && Array.isArray(res.data) && res.data.length > 0) {
                setProducts(res.data);
              }
            })
            .catch(() => {});

          // Ambil mitra seller dari PostgreSQL
          fetch('/api/mitra-seller')
            .then((r) => r.json())
            .then((res) => {
              if (res.source === 'postgresql' && Array.isArray(res.data) && res.data.length > 0) {
                setSellers(res.data);
              }
            })
            .catch(() => {});

          // Ambil faktur dari PostgreSQL
          fetch('/api/faktur')
            .then((r) => r.json())
            .then((res) => {
              if (res.source === 'postgresql' && Array.isArray(res.data) && res.data.length > 0) {
                setInvoices(res.data);
              }
            })
            .catch(() => {});

          // Ambil mutasi stok dari PostgreSQL
          fetch('/api/mutasi-stok')
            .then((r) => r.json())
            .then((res) => {
              if (res.source === 'postgresql' && Array.isArray(res.data) && res.data.length > 0) {
                setStockMutations(res.data);
              }
            })
            .catch(() => {});
        } else {
          setDbConnected(false);
        }
      })
      .catch(() => {
        setDbConnected(false);
      });

    // Background auto-polling setiap 4 detik untuk memeriksa transaksi baru dari server / database
    const pollTimer = setInterval(() => {
      fetch('/api/faktur')
        .then((r) => r.json())
        .then((res) => {
          if (res.source === 'postgresql' && Array.isArray(res.data) && res.data.length > 0) {
            setInvoices((prev) => {
              const existingIds = new Set(prev.map((i) => i.id));
              const newItems = res.data.filter((i: Invoice) => !existingIds.has(i.id));
              if (newItems.length > 0) {
                return [...newItems, ...prev];
              }
              return prev;
            });
          }
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(pollTimer);
  }, []);

  const loginAs = (role: UserRole, customUser?: Partial<UserProfile>) => {
    let user: UserProfile;
    if (role === 'owner') {
      user = {
        id: 'usr-owner',
        name: 'Pak Tino',
        email: 'owner@tinounderwear.id',
        role: 'owner',
        phone: '0812-9876-5432',
        ...customUser,
      };
    } else if (role === 'kasir') {
      user = {
        id: 'usr-kasir',
        name: 'Siti Rahma',
        email: 'kasir@tinounderwear.id',
        role: 'kasir',
        shift: 'Shift Pagi (08:00 - 16:00)',
        ...customUser,
      };
    } else {
      // Seller
      const targetSeller = sellers.find((s) => s.id === 'sel-01') || sellers[0];
      user = {
        id: targetSeller ? targetSeller.id : 'usr-seller',
        username: targetSeller?.username || 'budi88',
        name: targetSeller ? targetSeller.name : 'Budi Santoso',
        email: (targetSeller && targetSeller.email) ? targetSeller.email : `${targetSeller?.phone || 'seller'}@tinounderwear.id`,
        role: 'seller',
        storeName: targetSeller ? targetSeller.storeName : 'Toko Budi Jaya',
        phone: targetSeller ? targetSeller.phone : '0812-8899-7711',
        ...customUser,
      };
    }
    sessionStorage.setItem(STORAGE_KEY + '_currentUser', JSON.stringify(user));
    localStorage.removeItem(STORAGE_KEY + '_currentUser');
    setCurrentUser(user);
  };

  const authenticateUser = async (
    role: UserRole,
    identifier: string,
    password: string
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> => {
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId || !cleanPass) {
      return { success: false, error: 'Silakan isi Email/Username dan Kata Sandi.' };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          identifier: cleanId,
          password: cleanPass,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        sessionStorage.setItem(STORAGE_KEY + '_currentUser', JSON.stringify(data.user));
        localStorage.removeItem(STORAGE_KEY + '_currentUser');
        setCurrentUser(data.user);
        return { success: true, user: data.user };
      }

      return {
        success: false,
        error: data.error || 'Email/Username atau Kata Sandi salah.',
      };
    } catch {
      return {
        success: false,
        error: 'Tidak dapat terhubung ke server autentikasi TUMIN.',
      };
    }
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY + '_currentUser');
    localStorage.removeItem(STORAGE_KEY + '_currentUser');
    sessionStorage.removeItem('tumin_owner_active_nav');
    sessionStorage.removeItem('tumin_kasir_active_tab');
    sessionStorage.removeItem('tumin_seller_active_tab');
    setCurrentUser(null);
  };

  // Product CRUD
  const addProduct = (data: Omit<Product, 'id' | 'lastUpdated'>) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
    const newProduct: Product = {
      ...data,
      id: 'prod-' + Date.now(),
      lastUpdated: dateStr,
    };
    setProducts((prev) => [newProduct, ...prev]);
    fetch('/api/produk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    }).catch(() => {});
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates, lastUpdated: dateStr };
          fetch('/api/produk', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});
          return updated;
        }
        return p;
      })
    );
  };

  const recordStockMutation = (mutation: Omit<StockMutation, 'id' | 'date'>) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
    const newMut: StockMutation = {
      ...mutation,
      id: 'mut-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      date: dateStr,
    };
    setStockMutations((prev) => [newMut, ...prev]);
    fetch('/api/mutasi-stok', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMut),
    }).catch(() => {});
  };

  const adjustStock = (id: string, newStock: number, reason?: string) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
    const target = products.find((p) => p.id === id);
    if (target) {
      const oldStock = target.stock;
      const safeNewStock = Math.max(0, newStock);
      const diff = safeNewStock - oldStock;
      if (diff !== 0) {
        const isDamaged = reason?.toLowerCase().includes('rusak') || reason?.toLowerCase().includes('reject');
        const mutType = diff > 0 ? 'RESTOCK' : (isDamaged ? 'RUSAK_REJECT' : 'OPNAME_KOREKSI');
        recordStockMutation({
          productId: target.id,
          productSku: target.sku,
          productName: target.name,
          type: mutType,
          change: diff,
          previousStock: oldStock,
          finalStock: safeNewStock,
          reference: 'ADJ-' + Date.now().toString().slice(-4),
          notes: reason || (diff > 0 ? 'Penambahan stok manual' : 'Pengurangan stok manual'),
          performedBy: currentUser?.name || 'Pak Tino (Owner)',
        });
      }
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock: Math.max(0, newStock), lastUpdated: dateStr } : p))
    );
  };

  const restockProduct = (productId: string, quantity: number, notes?: string, supplier?: string) => {
    if (quantity <= 0) return;
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    const oldStock = target.stock;
    const newStock = oldStock + quantity;

    recordStockMutation({
      productId: target.id,
      productSku: target.sku,
      productName: target.name,
      type: 'RESTOCK',
      change: quantity,
      previousStock: oldStock,
      finalStock: newStock,
      reference: supplier
        ? `SJ-${supplier.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`
        : `RESTOCK-${Date.now().toString().slice(-4)}`,
      notes: notes || `Penerimaan restok barang konveksi (+${quantity} ${target.unit})`,
      performedBy: currentUser?.name || 'Pak Tino (Owner)',
    });

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, stock: newStock, lastUpdated: dateStr } : p))
    );
  };

  const applyStockOpname = (adjustments: { productId: string; physicalStock: number; reason: string }[]) => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
    const opnameRef = `OPN-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    setProducts((prev) =>
      prev.map((prod) => {
        const adj = adjustments.find((a) => a.productId === prod.id);
        if (adj && adj.physicalStock !== prod.stock) {
          const oldStock = prod.stock;
          const newStock = Math.max(0, adj.physicalStock);
          const diff = newStock - oldStock;
          const isDamaged = adj.reason.toLowerCase().includes('rusak') || adj.reason.toLowerCase().includes('reject');

          recordStockMutation({
            productId: prod.id,
            productSku: prod.sku,
            productName: prod.name,
            type: diff < 0 && isDamaged ? 'RUSAK_REJECT' : 'OPNAME_KOREKSI',
            change: diff,
            previousStock: oldStock,
            finalStock: newStock,
            reference: opnameRef,
            notes: adj.reason || `Hasil stock opname fisik toko (${diff > 0 ? '+' : ''}${diff})`,
            performedBy: currentUser?.name || 'Pak Tino (Owner)',
          });

          return { ...prod, stock: newStock, lastUpdated: dateStr };
        }
        return prod;
      })
    );
  };

  // Seller management
  const registerSeller = (data: {
    username?: string;
    name: string;
    storeName: string;
    phone: string;
    address: string;
    email?: string;
    password?: string;
  }): Seller => {
    const today = new Date().toISOString().slice(0, 10);
    const cleanUsername = data.username?.trim().toLowerCase() || data.phone.replace(/\D/g, '') || `seller_${Date.now().toString().slice(-4)}`;
    const newSeller: Seller = {
      id: 'sel-' + Date.now(),
      username: cleanUsername,
      name: data.name,
      storeName: data.storeName,
      phone: data.phone,
      email: data.email || `${cleanUsername}@seller.tinounderwear.id`,
      address: data.address,
      status: 'Pending', // New registrations stay Pending until approved
      creditLimit: 5000000,
      totalReceivables: 0,
      lastTransactionDate: '-',
      registeredDate: today,
      notes: 'Pengajuan pendaftaran mandiri dari portal seller (Menunggu persetujuan Owner via Telepon/WhatsApp).',
      password: data.password || 'seller123',
    };

    setSellers((prev) => [newSeller, ...prev]);
    fetch('/api/mitra-seller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSeller),
    }).catch(() => {});
    return newSeller;
  };

  const approveSeller = (id: string, creditLimit?: number) => {
    setSellers((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = {
            ...s,
            status: 'Aktif' as const,
            creditLimit: creditLimit !== undefined ? creditLimit : (s.creditLimit || 5000000),
          };
          fetch('/api/mitra-seller', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});

          return updated;
        }
        return s;
      })
    );
  };

  const rejectSeller = (id: string) => {
    setSellers((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, status: 'Ditangguhkan' as const };
          fetch('/api/mitra-seller', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});
          return updated;
        }
        return s;
      })
    );
  };

  const updateSeller = (id: string, updates: Partial<Seller>) => {
    setSellers((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          const updated = { ...s, ...updates };
          fetch('/api/mitra-seller', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          }).catch(() => {});
          return updated;
        }
        return s;
      })
    );
  };

  // Sales and POS
  const createSaleTransaction = ({
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
  }) => {
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
          ? bankName || 'BCA 521-089-2234 a.n Tino Underwear (Owner)'
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

    // 1. Reduce stock automatically and record stock mutation
    setProducts((prev) =>
      prev.map((prod) => {
        const boughtItem = items.find((i) => i.product.id === prod.id);
        if (boughtItem) {
          const updatedStock = Math.max(0, prod.stock - boughtItem.quantity);
          return {
            ...prod,
            stock: updatedStock,
            lastUpdated: dateStr,
          };
        }
        return prod;
      })
    );

    // Record mutation for each sold product
    items.forEach((item) => {
      const prod = products.find((p) => p.id === item.product.id);
      if (prod) {
        const oldStock = prod.stock;
        const finalStock = Math.max(0, oldStock - item.quantity);
        recordStockMutation({
          productId: prod.id,
          productSku: prod.sku,
          productName: prod.name,
          type: 'PENJUALAN',
          change: -item.quantity,
          previousStock: oldStock,
          finalStock,
          reference: invoiceNumber,
          notes: `Transaksi kasir ${paymentMethod} (${item.quantity} ${prod.unit})`,
          performedBy: currentUser?.name || 'Kasir Toko',
        });
      }
    });

    // 2. If credit, increase seller's totalReceivables in real-time
    if (paymentMethod === 'Kredit' && sellerId) {
      const todayDate = now.toISOString().slice(0, 10);
      setSellers((prev) =>
        prev.map((s) => {
          if (s.id === sellerId) {
            return {
              ...s,
              totalReceivables: s.totalReceivables + total,
              lastTransactionDate: todayDate,
            };
          }
          return s;
        })
      );
    }

    // 3. Add invoice
    setInvoices((prev) => {
      const updated = [newInvoice, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY + '_invoices', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Beritahukan tab lain (misal Tab Owner yang sedang dibuka bersamaan) secara instan
    broadcastTabMessage({
      type: 'NEW_TRANSACTION',
      invoice: newInvoice,
    });

    fetch('/api/faktur', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInvoice),
    }).catch(() => {});

    return { success: true, invoice: newInvoice };
  };

  // Record installment payment (Catat Pembayaran Cicilan)
  const recordInstallment = ({
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
  }) => {
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

    const newAmountPaid = targetInvoice.amountPaid + amount;
    const newRemaining = Math.max(0, targetInvoice.remainingBalance - amount);
    const newStatus =
      newRemaining === 0 ? ('PAID' as const) : ('PARTIALLY_PAID' as const);

    // Update invoice
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            amountPaid: newAmountPaid,
            remainingBalance: newRemaining,
            status: newStatus,
            installments: [newInstallment, ...inv.installments],
          };
        }
        return inv;
      })
    );

    // Reduce seller's totalReceivables in real-time
    if (targetInvoice.sellerId) {
      setSellers((prev) =>
        prev.map((s) => {
          if (s.id === targetInvoice.sellerId) {
            return {
              ...s,
              totalReceivables: Math.max(0, s.totalReceivables - amount),
            };
          }
          return s;
        })
      );
    }

    fetch('/api/cicilan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInstallment),
    }).catch(() => {});

    fetch('/api/faktur', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...targetInvoice,
        amountPaid: newAmountPaid,
        remainingBalance: newRemaining,
        status: newStatus,
      }),
    }).catch(() => {});

    return { success: true };
  };

  const resetToDefaultData = () => {
    setProducts(INITIAL_PRODUCTS);
    setSellers(INITIAL_SELLERS);
    setInvoices(INITIAL_INVOICES);
    setConsignedItems(INITIAL_CONSIGNED_ITEMS);
    setStockMutations(INITIAL_STOCK_MUTATIONS);
    localStorage.removeItem(STORAGE_KEY + '_products');
    localStorage.removeItem(STORAGE_KEY + '_sellers');
    localStorage.removeItem(STORAGE_KEY + '_invoices');
    localStorage.removeItem(STORAGE_KEY + '_consigned');
    localStorage.removeItem(STORAGE_KEY + '_mutations');
  };

  const pendingSellersCount = sellers.filter((s) => s.status === 'Pending').length;

  const totalReceivablesSummary = {
    total: invoices.reduce((acc, inv) => acc + inv.remainingBalance, 0),
    unpaid: invoices.filter((i) => i.status === 'UNPAID').length,
    partiallyPaid: invoices.filter((i) => i.status === 'PARTIALLY_PAID').length,
    paid: invoices.filter((i) => i.status === 'PAID').length,
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole: currentUser?.role || null,
        setCurrentUser,
        loginAs,
        authenticateUser,
        logout,
        products,
        addProduct,
        updateProduct,
        adjustStock,
        stockMutations,
        recordStockMutation,
        restockProduct,
        applyStockOpname,
        sellers,
        registerSeller,
        approveSeller,
        rejectSeller,
        updateSeller,
        invoices,
        createSaleTransaction,
        recordInstallment,
        consignedItems,
        dbConnected,
        resetToDefaultData,
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
