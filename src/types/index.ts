export type UserRole = 'owner' | 'kasir' | 'seller';

export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: UserRole;
  storeName?: string;
  phone?: string;
  shift?: string;
}

export type ProductCategory = 'Semua' | 'CD Pria' | 'CD Wanita' | 'Anak-Anak' | 'Korset';

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: 'CD Pria' | 'CD Wanita' | 'Anak-Anak' | 'Korset';
  price: number;
  costPrice: number; // HPP (Harga Pokok Penjualan)
  stock: number;
  minStock: number;
  unit: string;
  description?: string;
  lastUpdated: string;
}

export type SellerStatus = 'Aktif' | 'Pending' | 'Ditangguhkan';

export interface Seller {
  id: string;
  username?: string; // Username untuk login portal seller
  name: string;
  storeName: string;
  phone: string;
  email?: string; // Opsional (tidak wajib email)
  address: string;
  status: SellerStatus;
  creditLimit?: number;
  totalReceivables: number; // Total Piutang Aktif (Rp)
  lastTransactionDate: string;
  registeredDate: string;
  notes?: string;
  password?: string; // Kata sandi login portal seller
}

export interface SystemUserAccount {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  password: string;
  phone?: string;
  shift?: string;
  storeName?: string;
}

export interface ConsignedItem {
  id: string;
  sellerId: string;
  productId: string;
  productSku: string;
  productName: string;
  quantityHeld: number;
  unitPrice: number;
  recommendedSellPrice: number;
  assignedDate: string;
}

export type PaymentMethod = 'Tunai' | 'Transfer Bank' | 'Kredit';

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export type InvoicePaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface InstallmentPayment {
  id: string;
  date: string;
  amount: number;
  method: 'Tunai' | 'Transfer Bank';
  recordedBy: string;
  notes?: string;
  paymentProofImage?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. #INV-20261007-001
  date: string; // ISO or YYYY-MM-DD HH:mm
  cashierName: string;
  items: {
    productId: string;
    productSku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  
  // Tunai details
  cashReceived?: number;
  change?: number;

  // Transfer Bank details
  paymentProofImage?: string; // Gambar bukti transfer bank (Base64 data URL)
  bankName?: string; // Rekening tujuan Owner
  transferReference?: string; // Nomor referensi atau nama pengirim

  // Kredit details
  sellerId?: string;
  sellerName?: string;
  dueDate?: string; // Must be after transaction date
  amountPaid: number;
  remainingBalance: number;
  status: InvoicePaymentStatus;
  installments: InstallmentPayment[];
}

export type StockMutationType =
  | 'RESTOCK'
  | 'PENJUALAN'
  | 'KONSINYASI_KELUAR'
  | 'KONSINYASI_RETUR'
  | 'OPNAME_KOREKSI'
  | 'RUSAK_REJECT';

export interface StockMutation {
  id: string;
  date: string;
  productId: string;
  productSku: string;
  productName: string;
  type: StockMutationType;
  change: number;
  previousStock: number;
  finalStock: number;
  reference?: string;
  notes?: string;
  performedBy: string;
}
