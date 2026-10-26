import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Product,
  ProductCategory,
  CartItem,
  PaymentMethod,
  Invoice,
} from '../../types';
import { ChamferCard } from '../common/ChamferCard';
import { Badge, StatusBadge } from '../common/Badge';
import { StitchDivider } from '../common/StitchDivider';
import { ReceiptModal } from './ReceiptModal';
import { PaymentProofModal } from '../common/PaymentProofModal';
import { SAMPLE_TRANSFER_RECEIPT_SVG } from '../../utils/sampleProof';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Building2,
  Calendar,
  AlertCircle,
  Clock,
  User,
  CheckCircle,
  ArrowRight,
  LogOut,
  RefreshCw,
  Layers,
  Users,
  Receipt,
  FileText,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
} from 'lucide-react';

interface PosScreenProps {
  onLogout?: () => void;
  onOpenSellerModal?: () => void;
}

export const PosScreen: React.FC<PosScreenProps> = ({ onLogout }) => {
  const {
    currentUser,
    products,
    sellers,
    invoices,
    createSaleTransaction,
    recordInstallment,
    approveSeller,
    rejectSeller,
    pendingSellersCount,
    logout,
  } = useApp();

  // Active tab within Kasir portal
  const [kasirTab, setKasirTab] = useState<'pos' | 'riwayat' | 'produk' | 'piutang' | 'seller'>(() => {
    return (sessionStorage.getItem('tumin_kasir_active_tab') as any) || 'pos';
  });

  useEffect(() => {
    sessionStorage.setItem('tumin_kasir_active_tab', kasirTab);
  }, [kasirTab]);

  // Search & category filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Semua');

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(() => {
    // Default 14 days from today
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [validationError, setValidationError] = useState<string>('');

  // Transfer Bank payment proof states
  const [transferProofImage, setTransferProofImage] = useState<string | null>(null);
  const [transferReference, setTransferReference] = useState<string>('');
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [previewProofInvoice, setPreviewProofInvoice] = useState<Invoice | null>(null);

  // Completed transaction for receipt modal
  const [completedInvoice, setCompletedInvoice] = useState<Invoice | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Installment modal for Kasir Piutang tab
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [installmentAmount, setInstallmentAmount] = useState<number | ''>('');
  const [installmentMethod, setInstallmentMethod] = useState<'Tunai' | 'Transfer Bank'>('Tunai');
  const [installmentNotes, setInstallmentNotes] = useState('');
  const [installmentError, setInstallmentError] = useState('');

  // Draft invoice number
  const draftInvoiceNumber = useMemo(() => {
    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `#INV-${yyyymmdd}-DRAFT`;
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchCat =
        selectedCategory === 'Semua' || item.category === selectedCategory;
      const matchSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Cart calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, curr) => acc + curr.subtotal, 0);
  }, [cart]);

  const cartTotal = useMemo(() => {
    return Math.max(0, cartSubtotal - discountAmount);
  }, [cartSubtotal, discountAmount]);

  const changeDue = useMemo(() => {
    if (paymentMethod !== 'Tunai' || typeof cashReceived !== 'number') return 0;
    return Math.max(0, cashReceived - cartTotal);
  }, [paymentMethod, cashReceived, cartTotal]);

  // Selected seller details for Credit
  const selectedSeller = useMemo(() => {
    return sellers.find((s) => s.id === selectedSellerId);
  }, [sellers, selectedSellerId]);

  const newPiutangPreview = useMemo(() => {
    if (!selectedSeller) return 0;
    return selectedSeller.totalReceivables + cartTotal;
  }, [selectedSeller, cartTotal]);

  // Cart Operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setValidationError('');

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          setValidationError(`Stok ${product.name} hanya tersedia ${product.stock} pcs.`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                subtotal: (item.quantity + 1) * item.product.price,
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            product,
            quantity: 1,
            subtotal: product.price,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId: string, newQty: number) => {
    setValidationError('');
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (prod && newQty > prod.stock) {
      setValidationError(`Stok maksimum tercapai (${prod.stock} pcs).`);
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQty,
              subtotal: newQty * item.product.price,
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    setValidationError('');
  };

  const clearCart = () => {
    setCart([]);
    setCashReceived('');
    setDiscountAmount(0);
    setValidationError('');
    setTransferProofImage(null);
    setTransferReference('');
  };

  const handleProcessPayment = () => {
    setValidationError('');

    if (cart.length === 0) {
      setValidationError('Keranjang belanja kosong.');
      return;
    }

    if (paymentMethod === 'Tunai') {
      const numReceived = typeof cashReceived === 'number' ? cashReceived : 0;
      if (numReceived < cartTotal) {
        setValidationError(
          `Uang diterima (Rp ${numReceived.toLocaleString('id-ID')}) kurang dari total tagihan (Rp ${cartTotal.toLocaleString('id-ID')}).`
        );
        return;
      }
    }

    if (paymentMethod === 'Kredit') {
      if (!selectedSellerId) {
        setValidationError('Pilih mitra seller yang bertanggung jawab atas kredit ini.');
        return;
      }
      if (!selectedSeller || selectedSeller.status !== 'Aktif') {
        setValidationError(
          `Transaksi kredit hanya diperbolehkan untuk mitra Aktif. Status saat ini: ${selectedSeller?.status || 'Tidak valid'}.`
        );
        return;
      }
      if (!dueDate) {
        setValidationError('Tanggal jatuh tempo pembayaran wajib ditentukan.');
        return;
      }
      const todayStr = new Date().toISOString().slice(0, 10);
      if (dueDate <= todayStr) {
        setValidationError('Tanggal jatuh tempo harus setelah hari ini.');
        return;
      }
    }

    // Call checkout
    const result = createSaleTransaction({
      items: cart,
      paymentMethod,
      cashReceived: paymentMethod === 'Tunai' ? Number(cashReceived) : undefined,
      sellerId: paymentMethod === 'Kredit' ? selectedSellerId : undefined,
      dueDate: paymentMethod === 'Kredit' ? dueDate : undefined,
      discount: discountAmount,
      paymentProofImage: paymentMethod === 'Transfer Bank' ? (transferProofImage || undefined) : undefined,
      bankName: paymentMethod === 'Transfer Bank' ? 'BCA 521-089-2234 a.n Tino Underwear (Owner)' : undefined,
      transferReference: paymentMethod === 'Transfer Bank' ? (transferReference.trim() || undefined) : undefined,
    });

    if (result.success && result.invoice) {
      setCompletedInvoice(result.invoice);
      setShowReceiptModal(true);
      clearCart();
    } else {
      setValidationError(result.error || 'Terjadi kesalahan pemrosesan transaksi.');
    }
  };

  const handleNewTransaction = () => {
    setShowReceiptModal(false);
    setCompletedInvoice(null);
    clearCart();
  };

  // Helper cash presets
  const handleQuickCash = (amount: number) => {
    setCashReceived(amount);
  };

  // Handle Installment Payment submission in Piutang view
  const handleRecordInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice || !installmentAmount) return;

    const res = recordInstallment({
      invoiceId: payingInvoice.id,
      amount: Number(installmentAmount),
      method: installmentMethod,
      notes: installmentNotes,
    });

    if (res.success) {
      setPayingInvoice(null);
      setInstallmentAmount('');
      setInstallmentNotes('');
      setInstallmentError('');
    } else {
      setInstallmentError(res.error || 'Gagal mencatat cicilan.');
    }
  };

  const categories: ProductCategory[] = [
    'Semua',
    'CD Pria',
    'CD Wanita',
    'Anak-Anak',
    'Korset',
  ];

  return (
    <div className="min-h-screen bg-fabric-pattern flex flex-col text-[#10241D]">
      {/* SCREEN 2 COMPACT TOP BAR: logo, menu (Kasir, Riwayat, Produk, Stok, Piutang, Seller), cashier name + shift */}
      <header className="sticky top-0 z-30 bg-white border-b border-[#047857]/20 shadow-xs px-4 lg:px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold font-display bg-gradient-to-r from-[#047857] to-[#6D28D9] bg-clip-text text-transparent">
              TUMIN
            </span>
            <span className="hidden sm:inline-block text-[11px] font-mono tracking-wider text-[#047857] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              KASIR POS
            </span>
          </div>

          {/* Kasir Menu Tabs: Kasir, Riwayat, Produk, Stok, Piutang, Seller */}
          <nav className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto py-1">
            <button
              onClick={() => setKasirTab('pos')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer select-none active:scale-95 whitespace-nowrap flex items-center gap-1.5 ${
                kasirTab === 'pos'
                  ? 'bg-[#047857] text-white shadow-sm ring-1 ring-emerald-500/50'
                  : 'text-[#4B6359] hover:text-[#10241D] hover:bg-stone-100/90 hover:scale-103'
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Kasir (POS)</span>
            </button>

            <button
              onClick={() => setKasirTab('riwayat')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer select-none active:scale-95 whitespace-nowrap flex items-center gap-1.5 ${
                kasirTab === 'riwayat'
                  ? 'bg-[#047857] text-white shadow-sm ring-1 ring-emerald-500/50'
                  : 'text-[#4B6359] hover:text-[#10241D] hover:bg-stone-100/90 hover:scale-103'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Riwayat</span>
            </button>

            <button
              onClick={() => setKasirTab('produk')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer select-none active:scale-95 whitespace-nowrap flex items-center gap-1.5 ${
                kasirTab === 'produk'
                  ? 'bg-[#047857] text-white shadow-sm ring-1 ring-emerald-500/50'
                  : 'text-[#4B6359] hover:text-[#10241D] hover:bg-stone-100/90 hover:scale-103'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Produk & Stok</span>
            </button>

            <button
              onClick={() => setKasirTab('piutang')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer select-none active:scale-95 whitespace-nowrap flex items-center gap-1.5 ${
                kasirTab === 'piutang'
                  ? 'bg-[#047857] text-white shadow-sm ring-1 ring-emerald-500/50'
                  : 'text-[#4B6359] hover:text-[#10241D] hover:bg-stone-100/90 hover:scale-103'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Piutang</span>
            </button>

            <button
              onClick={() => setKasirTab('seller')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer select-none active:scale-95 whitespace-nowrap flex items-center gap-1.5 relative ${
                kasirTab === 'seller'
                  ? 'bg-[#047857] text-white shadow-sm ring-1 ring-emerald-500/50'
                  : 'text-[#4B6359] hover:text-[#10241D] hover:bg-stone-100/90 hover:scale-103'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Seller</span>
              {pendingSellersCount > 0 && (
                <span className="w-4 h-4 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {pendingSellersCount}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Cashier Name + Shift & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-[#10241D]">
              {currentUser?.name || 'Siti Rahma'}
            </span>
            <span className="text-[11px] text-[#4B6359]">
              {currentUser?.shift || 'Shift Pagi (08:00 - 16:00)'}
            </span>
          </div>

          <button
            onClick={() => {
              if (onLogout) onLogout();
              else logout();
            }}
            className="p-1.5 text-[#4B6359] hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors"
            title="Keluar dari Kasir"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* SUB-VIEW 1: PRIMARY POS SCREEN (Single Viewport Layout) */}
      {kasirTab === 'pos' && (
        <main className="flex-1 p-3 sm:p-4 lg:p-5 flex flex-col lg:flex-row gap-4 max-w-[1600px] mx-auto w-full">
          {/* LEFT (MAIN): Search, Category Pills, Product Card Grid */}
          <section className="flex-1 flex flex-col gap-3 min-w-0">
            {/* Large Search Bar */}
            <div className="bg-white p-2.5 rounded-lg border border-[#047857]/20 shadow-xs flex items-center gap-2">
              <Search className="w-5 h-5 text-[#047857] shrink-0 ml-1" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama atau scan barcode / SKU (contoh: TU-CDP-01)..."
                className="w-full text-sm py-1 px-1 bg-transparent border-none focus:outline-none placeholder:text-stone-400 font-sans"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-stone-400 hover:text-stone-700 px-2"
                >
                  Bersihkan
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-[#047857] text-white shadow-xs'
                      : 'bg-white text-[#4B6359] border border-stone-200 hover:border-[#047857]/40'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Product Card Grid */}
            <div className="flex-1 overflow-y-auto max-h-[calc(100vh-210px)] pr-1">
              {filteredProducts.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white rounded-lg border border-dashed border-stone-200">
                  <p className="text-sm font-semibold text-stone-600">
                    Tidak ada produk yang cocok
                  </p>
                  <p className="text-xs text-stone-400 mt-1">
                    Coba ubah kata kunci pencarian atau pilih kategori lain.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                  {filteredProducts.map((prod) => {
                    const isOutOfStock = prod.stock <= 0;
                    const isLowStock = prod.stock > 0 && prod.stock <= prod.minStock;

                    let stockBadgeVariant: 'success' | 'warning' | 'danger' = 'success';
                    let stockLabel = `Stok ${prod.stock}`;
                    if (isOutOfStock) {
                      stockBadgeVariant = 'danger';
                      stockLabel = 'Habis';
                    } else if (isLowStock) {
                      stockBadgeVariant = 'warning';
                      stockLabel = `Stok ${prod.stock} - menipis`;
                    } else {
                      stockLabel = `Stok ${prod.stock} - aman`;
                    }

                    return (
                      <button
                        key={prod.id}
                        type="button"
                        disabled={isOutOfStock}
                        onClick={() => addToCart(prod)}
                        className={`text-left group relative transition-all rounded-lg p-3 bg-white border border-[#047857]/20 hover:border-[#047857] hover:shadow-md flex flex-col justify-between ${
                          isOutOfStock
                            ? 'opacity-55 cursor-not-allowed bg-stone-50 border-stone-200'
                            : 'cursor-pointer active:scale-[0.98]'
                        }`}
                      >
                        <div>
                          {/* SKU & Category */}
                          <div className="flex items-center justify-between text-[11px] text-[#4B6359] mb-1">
                            <span className="font-mono-num font-semibold text-[#047857]">
                              {prod.sku}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {prod.category}
                            </span>
                          </div>

                          {/* Name */}
                          <h4 className="text-xs sm:text-sm font-semibold text-[#10241D] line-clamp-2 leading-snug group-hover:text-[#047857] transition-colors">
                            {prod.name}
                          </h4>
                        </div>

                        {/* Price & Stock status */}
                        <div className="mt-3 pt-2 border-t border-dashed border-stone-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-[#4B6359] block">
                              Harga
                            </span>
                            <span className="text-xs sm:text-sm font-bold font-mono-num text-[#047857]">
                              Rp {prod.price.toLocaleString('id-ID')}
                            </span>
                          </div>

                          {/* Stock badge */}
                          <Badge variant={stockBadgeVariant} size="sm">
                            {stockLabel}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT (400px CHAMFERED CART PANEL WITH STITCHED BORDER) */}
          <aside className="w-full lg:w-[420px] shrink-0 flex flex-col">
            <ChamferCard
              dark={false}
              className="p-4 sm:p-5 flex-1 flex flex-col justify-between border border-[#047857]/30 shadow-lg min-h-[600px] max-h-[calc(100vh-80px)] overflow-y-auto"
            >
              {/* Cart Header */}
              <div>
                <div className="flex items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-[#047857]" />
                    <h3 className="font-bold text-sm sm:text-base text-[#10241D]">
                      Keranjang Penjualan
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono-num text-[#4B6359] bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    {draftInvoiceNumber}
                  </span>
                </div>

                <StitchDivider color="emerald" className="my-2" />

                {/* Validation error message */}
                {validationError && (
                  <div className="mb-2 p-2.5 bg-rose-50 border border-rose-300 rounded text-xs text-rose-900 flex items-start gap-1.5 animate-shake">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Cart Items List */}
                <div className="overflow-y-auto max-h-[220px] space-y-2 pr-1 my-2">
                  {cart.length === 0 ? (
                    <div className="py-8 text-center text-xs text-stone-400">
                      <p>Keranjang masih kosong.</p>
                      <p className="text-[11px] text-stone-400 mt-1">
                        Klik produk di sebelah kiri untuk menambahkan.
                      </p>
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="p-2 bg-stone-50 rounded border border-dashed border-stone-200 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-[#10241D] truncate">
                            {item.product.name}
                          </p>
                          <p className="text-[11px] text-[#4B6359] font-mono-num">
                            Rp {item.product.price.toLocaleString('id-ID')}
                          </p>
                        </div>

                        {/* Quantity Stepper */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 rounded bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-7 text-center font-mono-num font-bold text-xs text-[#10241D]">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 rounded bg-white border border-stone-300 text-stone-700 hover:bg-stone-100 flex items-center justify-center"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Subtotal & Delete */}
                        <div className="text-right shrink-0">
                          <p className="text-xs font-bold font-mono-num text-[#047857]">
                            Rp {item.subtotal.toLocaleString('id-ID')}
                          </p>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-0.5 mt-0.5 justify-end"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Payment details and totals */}
              <div className="pt-2 border-t border-dashed border-stone-200 space-y-3">
                {/* Payment Method Selector (EXACTLY 3 options: Tunai, Transfer Bank, Kredit) */}
                <div>
                  <label className="block text-xs font-semibold text-[#10241D] mb-1.5">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded border border-stone-200">
                    {(['Tunai', 'Transfer Bank', 'Kredit'] as PaymentMethod[]).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(method);
                          setValidationError('');
                        }}
                        className={`py-1.5 text-xs font-semibold rounded transition-colors ${
                          paymentMethod === method
                            ? 'bg-[#047857] text-white shadow-xs'
                            : 'text-[#4B6359] hover:text-[#10241D]'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Conditional Fields based on Payment Method */}
                {/* 1. TUNAI: shows "Uang diterima" input and automatic "Kembalian" */}
                {paymentMethod === 'Tunai' && (
                  <div className="p-2.5 bg-emerald-50/70 rounded border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[#10241D]">
                        Uang Diterima (Rp)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleQuickCash(cartTotal)}
                        className="text-[11px] text-[#047857] hover:underline font-semibold"
                      >
                        Uang Pas
                      </button>
                    </div>

                    <input
                      type="number"
                      value={cashReceived}
                      onChange={(e) =>
                        setCashReceived(e.target.value === '' ? '' : Number(e.target.value))
                      }
                      placeholder="0"
                      className="w-full px-2 py-1.5 text-base font-mono-num font-bold input-stitch text-[#10241D]"
                    />

                    {/* Quick shortcuts */}
                    <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                      {[50000, 100000, 200000, 500000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleQuickCash(amt)}
                          className="px-2 py-0.5 bg-white border border-emerald-300 text-[#047857] rounded hover:bg-emerald-100 font-mono-num"
                        >
                          {amt / 1000}rb
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-dashed border-emerald-200">
                      <span className="text-[#4B6359]">Kembalian:</span>
                      <span className="font-mono-num font-bold text-sm text-[#047857]">
                        Rp {changeDue.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}

                {/* 2. TRANSFER BANK: Rekening Owner & Upload Bukti Bayar */}
                {paymentMethod === 'Transfer Bank' && (
                  <div className="p-3 bg-purple-50/80 rounded border border-purple-200 text-xs text-purple-950 space-y-3">
                    {/* Rekening Tujuan Owner */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-bold text-xs text-[#6D28D9]">
                          <Building2 className="w-4 h-4 text-[#6D28D9]" />
                          <span>Rekening Tujuan (Owner)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText('5210892234');
                            setCopiedAccount(true);
                            setTimeout(() => setCopiedAccount(false), 2000);
                          }}
                          className="text-[11px] font-semibold text-[#6D28D9] hover:underline flex items-center gap-1"
                        >
                          {copiedAccount ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin No. Rek</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="p-2 bg-white rounded border border-purple-200 font-mono-num flex items-center justify-between">
                        <div>
                          <p className="font-extrabold text-sm text-[#10241D]">
                            BCA: 521-089-2234
                          </p>
                          <p className="text-[11px] text-stone-600 font-sans font-medium">
                            a.n Tino (Owner Tino Underwear)
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold bg-purple-100 text-[#6D28D9] px-2 py-0.5 rounded">
                          BCA
                        </span>
                      </div>
                    </div>

                    {/* Upload Bukti Transfer */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="font-semibold text-xs text-[#10241D] flex items-center gap-1">
                          <ImageIcon className="w-3.5 h-3.5 text-[#6D28D9]" />
                          <span>Bukti Bayar Transfer *</span>
                        </label>
                        {!transferProofImage && (
                          <button
                            type="button"
                            onClick={() => {
                              const sample = SAMPLE_TRANSFER_RECEIPT_SVG(cartTotal, draftInvoiceNumber);
                              setTransferProofImage(sample);
                            }}
                            className="text-[10px] text-[#047857] hover:underline font-semibold"
                            title="Gunakan simulasi struk transfer m-Banking"
                          >
                            + Contoh Bukti
                          </button>
                        )}
                      </div>

                      {transferProofImage ? (
                        <div className="p-2 bg-white rounded border border-emerald-300 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <img
                              src={transferProofImage}
                              alt="Bukti Transfer"
                              className="w-10 h-10 object-contain rounded bg-stone-100 border border-stone-200"
                            />
                            <div className="min-w-0">
                              <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3 text-emerald-600" />
                                Bukti Terpasang
                              </span>
                              <span className="text-[10px] text-stone-500 block truncate">
                                Terverifikasi untuk Owner
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setPreviewProofInvoice({
                                  id: 'preview',
                                  invoiceNumber: draftInvoiceNumber,
                                  date: new Date().toISOString().slice(0, 16).replace('T', ' '),
                                  cashierName: currentUser?.name || 'Kasir',
                                  items: [],
                                  subtotal: cartSubtotal,
                                  discount: discountAmount,
                                  total: cartTotal,
                                  paymentMethod: 'Transfer Bank',
                                  amountPaid: cartTotal,
                                  remainingBalance: 0,
                                  status: 'PAID',
                                  installments: [],
                                  paymentProofImage: transferProofImage,
                                  bankName: 'BCA 521-089-2234 a.n Tino (Owner)',
                                  transferReference,
                                });
                              }}
                              className="px-2 py-1 text-[11px] font-medium text-stone-600 hover:text-stone-900 bg-stone-100 rounded hover:bg-stone-200"
                            >
                              Lihat
                            </button>
                            <button
                              type="button"
                              onClick={() => setTransferProofImage(null)}
                              className="px-2 py-1 text-[11px] font-medium text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded"
                            >
                              Hapus
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="cursor-pointer block border-2 border-dashed border-purple-300 hover:border-[#6D28D9] bg-white rounded-lg p-2.5 text-center transition-colors">
                            <Upload className="w-5 h-5 text-[#6D28D9] mx-auto mb-1" />
                            <span className="text-[11px] font-semibold text-stone-700 block">
                              Pilih file gambar bukti transfer
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              PNG, JPG, WEBP (maks. 5MB)
                            </span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    if (event.target?.result) {
                                      setTransferProofImage(event.target.result as string);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Referensi / Pengirim Opsional */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#10241D] mb-0.5">
                        Nama Pengirim / Catatan Referensi (Opsional)
                      </label>
                      <input
                        type="text"
                        value={transferReference}
                        onChange={(e) => setTransferReference(e.target.value)}
                        placeholder="Contoh: BCA Hendra / Ref: 882910"
                        className="w-full px-2.5 py-1 text-xs bg-white border border-stone-300 rounded focus:border-[#6D28D9] focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* 3. KREDIT: Mitra seller dropdown (only Aktif selectable; Pending & Ditangguhkan disabled), current & new piutang preview, Tanggal jatuh tempo picker */}
                {paymentMethod === 'Kredit' && (
                  <div className="p-3 bg-amber-50/70 rounded border border-amber-200 space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-[#10241D] mb-1">
                        Mitra Seller (Wajib Aktif) *
                      </label>
                      <select
                        value={selectedSellerId}
                        onChange={(e) => setSelectedSellerId(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded focus:border-[#047857] focus:outline-none"
                      >
                        <option value="">-- Pilih Mitra Reseller --</option>
                        {sellers.map((s) => {
                          const isAktif = s.status === 'Aktif';
                          return (
                            <option
                              key={s.id}
                              value={s.id}
                              disabled={!isAktif}
                              className={!isAktif ? 'text-stone-400 bg-stone-100' : ''}
                            >
                              {s.name} - {s.storeName} ({s.status}
                              {!isAktif ? ' - Tidak Bisa Kredit' : ''})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {selectedSeller && (
                      <div className="p-2 bg-white rounded border border-dashed border-amber-300 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-stone-600">Piutang Berjalan:</span>
                          <span className="font-mono-num font-semibold text-stone-900">
                            Rp {selectedSeller.totalReceivables.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-600">Transaksi Ini:</span>
                          <span className="font-mono-num font-semibold text-[#047857]">
                            +Rp {cartTotal.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-stone-200 pt-1 font-bold">
                          <span className="text-stone-800">Total Piutang Baru:</span>
                          <span className="font-mono-num text-rose-700">
                            Rp {newPiutangPreview.toLocaleString('id-ID')}
                          </span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[13px] font-semibold text-[#10241D] mb-1">
                        Tanggal Jatuh Tempo *
                      </label>
                      <div className="relative">
                        <Calendar className="w-3.5 h-3.5 absolute left-1 top-2.5 text-[#4B6359]" />
                        <input
                          type="date"
                          value={dueDate}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setDueDate(e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 text-xs input-stitch text-[#10241D] font-mono-num"
                          required
                        />
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Harus ditentukan setelah hari ini.
                      </p>
                    </div>
                  </div>
                )}

                {/* Subtotal, Diskon, Total in Large Bold */}
                <div className="space-y-1 text-xs pt-1">
                  <div className="flex justify-between text-stone-600">
                    <span>Subtotal Produk:</span>
                    <span className="font-mono-num">
                      Rp {cartSubtotal.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-stone-600">
                    <span>Potongan Diskon:</span>
                    <div className="flex items-center gap-1">
                      <span className="text-stone-400">Rp</span>
                      <input
                        type="number"
                        value={discountAmount || ''}
                        onChange={(e) =>
                          setDiscountAmount(e.target.value === '' ? 0 : Number(e.target.value))
                        }
                        placeholder="0"
                        className="w-20 text-right px-1.5 py-0.5 text-xs border border-stone-200 rounded font-mono-num"
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-stone-300">
                    <span className="text-sm font-bold text-[#10241D]">
                      TOTAL TAGIHAN:
                    </span>
                    <span className="text-xl font-extrabold font-mono-num text-[#047857]">
                      Rp {cartTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Buttons: "Batalkan" (secondary) and "Bayar sekarang" (primary) */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={clearCart}
                    disabled={cart.length === 0}
                    className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-[#4B6359] hover:text-[#10241D] text-xs font-semibold rounded-sm chamfer-btn transition-colors disabled:opacity-40"
                  >
                    Batalkan
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessPayment}
                    disabled={cart.length === 0}
                    className="py-2.5 px-3 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold rounded-sm chamfer-btn transition-colors shadow-md disabled:opacity-40 flex items-center justify-center gap-1.5"
                  >
                    <span>Bayar Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </ChamferCard>
          </aside>
        </main>
      )}

      {/* SUB-VIEW 2: RIWAYAT TRANSAKSI KASIR */}
      {kasirTab === 'riwayat' && (
        <main className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto w-full">
          <div className="bg-white p-5 rounded-lg border border-[#047857]/20 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h2 className="text-lg font-bold text-[#10241D]">
                  Riwayat Transaksi Penjualan
                </h2>
                <p className="text-xs text-[#4B6359]">
                  Daftar transaksi kasir terdaftar di sistem.
                </p>
              </div>
              <span className="text-xs font-mono-num font-semibold text-[#047857]">
                Total: {invoices.length} Faktur
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-[#4B6359] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">No. Faktur</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Kasir</th>
                    <th className="py-2.5 px-3">Metode</th>
                    <th className="py-2.5 px-3">Total</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-stone-50/80">
                      <td className="py-2.5 px-3 font-mono-num font-bold text-[#10241D]">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600">{inv.date}</td>
                      <td className="py-2.5 px-3 text-stone-600">{inv.cashierName}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-stone-800">
                          {inv.paymentMethod}
                        </span>
                        {inv.paymentMethod === 'Transfer Bank' && (
                          <div className="mt-0.5">
                            {inv.paymentProofImage ? (
                              <button
                                type="button"
                                onClick={() => setPreviewProofInvoice(inv)}
                                className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded transition-colors"
                              >
                                <ImageIcon className="w-3 h-3 text-[#6D28D9]" />
                                <span>Bukti Transfer</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-stone-400 italic">
                                Belum ada bukti
                              </span>
                            )}
                          </div>
                        )}
                        {inv.sellerName && (
                          <span className="block text-[10px] text-stone-500">
                            {inv.sellerName}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono-num font-bold text-[#047857]">
                        Rp {inv.total.toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={inv.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.paymentMethod === 'Transfer Bank' && inv.paymentProofImage && (
                            <button
                              type="button"
                              onClick={() => setPreviewProofInvoice(inv)}
                              className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-[#6D28D9] border border-purple-200 rounded font-semibold text-[11px] flex items-center gap-1"
                              title="Lihat foto bukti transfer bank"
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span className="hidden sm:inline">Bukti</span>
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setCompletedInvoice(inv);
                              setShowReceiptModal(true);
                            }}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-emerald-50 text-[#047857] border border-emerald-200 rounded font-semibold text-[11px]"
                          >
                            Lihat Struk
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* SUB-VIEW 3: PRODUK & STOK UNTUK KASIR */}
      {kasirTab === 'produk' && (
        <main className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto w-full">
          <div className="bg-white p-5 rounded-lg border border-[#047857]/20 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h2 className="text-lg font-bold text-[#10241D]">
                  Katalog Produk & Kontrol Stok
                </h2>
                <p className="text-xs text-[#4B6359]">
                  Periksa ketersediaan produk sebelum melakukan penjualan.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-[#4B6359] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">SKU</th>
                    <th className="py-2.5 px-3">Nama Produk</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Harga Jual</th>
                    <th className="py-2.5 px-3">Stok Gudang</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {products.map((prod) => {
                    let statusLabel = 'Aman';
                    if (prod.stock <= 0) statusLabel = 'Habis';
                    else if (prod.stock <= prod.minStock) statusLabel = 'Menipis';

                    return (
                      <tr key={prod.id} className="hover:bg-stone-50/80">
                        <td className="py-2.5 px-3 font-mono-num font-bold text-[#047857]">
                          {prod.sku}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#10241D]">
                          {prod.name}
                        </td>
                        <td className="py-2.5 px-3 text-stone-600">{prod.category}</td>
                        <td className="py-2.5 px-3 font-mono-num font-bold text-[#10241D]">
                          Rp {prod.price.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num font-semibold">
                          {prod.stock} {prod.unit}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={statusLabel} size="sm" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* SUB-VIEW 4: PIUTANG & CATAT CICILAN KASIR */}
      {kasirTab === 'piutang' && (
        <main className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto w-full">
          <div className="bg-white p-5 rounded-lg border border-[#047857]/20 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h2 className="text-lg font-bold text-[#10241D]">
                  Pencatatan Piutang & Setoran Cicilan
                </h2>
                <p className="text-xs text-[#4B6359]">
                  Catat pembayaran cicilan dari mitra seller yang datang langsung ke toko.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-[#4B6359] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">No. Faktur</th>
                    <th className="py-2.5 px-3">Mitra Reseller</th>
                    <th className="py-2.5 px-3">Jatuh Tempo</th>
                    <th className="py-2.5 px-3">Total Piutang</th>
                    <th className="py-2.5 px-3">Sisa Tagihan</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {invoices
                    .filter((inv) => inv.paymentMethod === 'Kredit')
                    .map((inv) => (
                      <tr key={inv.id} className="hover:bg-stone-50/80">
                        <td className="py-2.5 px-3 font-mono-num font-bold text-[#10241D]">
                          {inv.invoiceNumber}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-stone-900">
                          {inv.sellerName}
                        </td>
                        <td className="py-2.5 px-3 text-rose-700 font-semibold">
                          {inv.dueDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num font-bold text-stone-800">
                          Rp {inv.total.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3 font-mono-num font-bold text-rose-700">
                          Rp {inv.remainingBalance.toLocaleString('id-ID')}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={inv.status} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {inv.remainingBalance > 0 ? (
                            <button
                              onClick={() => {
                                setPayingInvoice(inv);
                                setInstallmentAmount(inv.remainingBalance);
                                setInstallmentError('');
                              }}
                              className="px-2.5 py-1 bg-[#047857] hover:bg-[#065F46] text-white rounded font-semibold text-[11px] chamfer-btn"
                            >
                              Catat Cicilan
                            </button>
                          ) : (
                            <span className="text-emerald-700 font-semibold text-[11px]">
                              Lunas
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* SUB-VIEW 5: MITRA SELLER & APPROVAL FOR KASIR */}
      {kasirTab === 'seller' && (
        <main className="flex-1 p-4 lg:p-6 max-w-6xl mx-auto w-full">
          <div className="bg-white p-5 rounded-lg border border-[#047857]/20 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <div>
                <h2 className="text-lg font-bold text-[#10241D]">
                  Manajemen Mitra Seller & Verifikasi
                </h2>
                <p className="text-xs text-[#4B6359]">
                  Kasir berwenang menyetujui pengajuan reseller baru setelah verifikasi toko fisik.
                </p>
              </div>
              <Badge variant={pendingSellersCount > 0 ? 'warning' : 'neutral'} size="md">
                {pendingSellersCount} Menunggu Verifikasi
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 border-b border-stone-200 text-[#4B6359] uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Nama Mitra</th>
                    <th className="py-2.5 px-3">Toko / Usaha</th>
                    <th className="py-2.5 px-3">Kontak WA</th>
                    <th className="py-2.5 px-3">Alamat</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sellers.map((s) => (
                    <tr key={s.id} className="hover:bg-stone-50/80">
                      <td className="py-2.5 px-3 font-semibold text-[#10241D]">
                        {s.name}
                      </td>
                      <td className="py-2.5 px-3 text-stone-700">{s.storeName}</td>
                      <td className="py-2.5 px-3 font-mono-num text-stone-600">
                        {s.phone}
                      </td>
                      <td className="py-2.5 px-3 text-stone-600 max-w-xs truncate">
                        {s.address}
                      </td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={s.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {s.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => approveSeller(s.id)}
                              className="px-2.5 py-1 bg-[#047857] hover:bg-[#065F46] text-white rounded text-[11px] font-semibold"
                            >
                              Setujui
                            </button>
                            <button
                              onClick={() => rejectSeller(s.id)}
                              className="px-2.5 py-1 bg-stone-100 hover:bg-rose-50 text-rose-700 rounded text-[11px] font-semibold"
                            >
                              Tolak
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-stone-400">
                            Terverifikasi
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* RECEIPT MODAL */}
      <ReceiptModal
        isOpen={showReceiptModal}
        invoice={completedInvoice}
        onNewTransaction={handleNewTransaction}
        onClose={() => setShowReceiptModal(false)}
      />

      {/* INSTALLMENT MODAL (Kasir) */}
      {payingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md">
            <ChamferCard dark={false} className="p-6 border border-[#047857]/30 shadow-2xl">
              <h3 className="text-base font-bold text-[#10241D]">
                Catat Pembayaran Cicilan
              </h3>
              <p className="text-xs text-[#4B6359] mt-0.5">
                {payingInvoice.invoiceNumber} · {payingInvoice.sellerName}
              </p>

              <StitchDivider color="emerald" />

              {installmentError && (
                <div className="p-2 mb-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
                  {installmentError}
                </div>
              )}

              <form onSubmit={handleRecordInstallmentSubmit} className="space-y-3">
                <div className="p-2.5 bg-stone-50 rounded border border-stone-200 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-600">Total Faktur:</span>
                    <span className="font-mono-num font-semibold">
                      Rp {payingInvoice.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Sudah Dibayar:</span>
                    <span className="font-mono-num font-semibold text-emerald-700">
                      Rp {payingInvoice.amountPaid.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-[#10241D] border-t border-stone-200 pt-1">
                    <span>Sisa Tagihan:</span>
                    <span className="font-mono-num text-rose-700">
                      Rp {payingInvoice.remainingBalance.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#10241D] mb-1">
                    Nominal Pembayaran (Rp) *
                  </label>
                  <input
                    type="number"
                    value={installmentAmount}
                    onChange={(e) =>
                      setInstallmentAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    max={payingInvoice.remainingBalance}
                    placeholder="Masukkan jumlah bayar"
                    className="w-full px-3 py-2 text-sm font-mono-num font-bold bg-white border border-stone-300 rounded focus:border-[#047857] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#10241D] mb-1">
                    Metode Pembayaran *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Tunai', 'Transfer Bank'] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setInstallmentMethod(m)}
                        className={`py-1.5 text-xs font-semibold rounded border ${
                          installmentMethod === m
                            ? 'bg-[#047857] text-white border-[#047857]'
                            : 'bg-white text-stone-700 border-stone-300'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#10241D] mb-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={installmentNotes}
                    onChange={(e) => setInstallmentNotes(e.target.value)}
                    placeholder="Contoh: Cicilan ke-2 titip via kurir toko"
                    className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded focus:border-[#047857] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPayingInvoice(null)}
                    className="px-3 py-2 text-xs text-stone-600 hover:text-stone-900"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold rounded chamfer-btn shadow-xs"
                  >
                    Simpan Pembayaran
                  </button>
                </div>
              </form>
            </ChamferCard>
          </div>
        </div>
      )}

      {/* PAYMENT PROOF MODAL (Kasir) */}
      <PaymentProofModal
        isOpen={!!previewProofInvoice}
        invoice={previewProofInvoice}
        onClose={() => setPreviewProofInvoice(null)}
      />
    </div>
  );
};
