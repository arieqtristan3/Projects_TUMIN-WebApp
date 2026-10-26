import React, { useState } from 'react';
import { Product, ProductCategory } from '../../types';
import { X, Layers, AlertCircle, Package, SlidersHorizontal, Check } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  product?: Product | null; // If null, mode is Add; otherwise Edit
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'lastUpdated'>) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  product,
  onClose,
  onSave,
}) => {
  const [sku, setSku] = useState(product?.sku || '');
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState<'CD Pria' | 'CD Wanita' | 'Anak-Anak' | 'Korset'>(
    product?.category || 'CD Pria'
  );
  const [price, setPrice] = useState<number | ''>(product ? product.price : '');
  const [costPrice, setCostPrice] = useState<number | ''>(product ? product.costPrice : '');
  const [stock, setStock] = useState<number | ''>(product ? product.stock : '');
  const [minStock, setMinStock] = useState<number | ''>(product ? product.minStock : 10);
  const [unit, setUnit] = useState(product?.unit || 'pcs');
  const [description, setDescription] = useState(product?.description || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || price === '' || costPrice === '' || stock === '') {
      setError('Harap lengkapi semua bidang wajib.');
      return;
    }

    onSave({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      price: Number(price),
      costPrice: Number(costPrice),
      stock: Number(stock),
      minStock: Number(minStock || 10),
      unit,
      description,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {product ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <p className="text-xs text-gray-500">
                {product ? 'Perbarui informasi katalog master' : 'Daftarkan SKU produk baru ke katalog TUMIN'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="m-5 mb-0 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                SKU / Kode Produk *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="TU-CDP-05"
                className="w-full px-3 py-2 text-xs font-mono uppercase bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Kategori *
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as 'CD Pria' | 'CD Wanita' | 'Anak-Anak' | 'Korset')
                }
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              >
                <option value="CD Pria">CD Pria</option>
                <option value="CD Wanita">CD Wanita</option>
                <option value="Anak-Anak">Anak-Anak</option>
                <option value="Korset">Korset</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nama Produk *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: CD Pria Boxer Seamless Bamboo (Ukuran XL)"
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Harga Pokok (HPP) Rp *
              </label>
              <input
                type="number"
                value={costPrice}
                onChange={(e) =>
                  setCostPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="15000"
                min="0"
                className="w-full px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Harga Jual Rp *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) =>
                  setPrice(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="25000"
                min="0"
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Stok Awal *
              </label>
              <input
                type="number"
                value={stock}
                onChange={(e) =>
                  setStock(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="50"
                min="0"
                className="w-full px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Batas Min. Stok
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) =>
                  setMinStock(e.target.value === '' ? '' : Number(e.target.value))
                }
                placeholder="10"
                min="0"
                className="w-full px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Satuan
              </label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs / pack"
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Keterangan / Spesifikasi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Bahan katun stretch premium, adem, jahitan overdeck..."
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
            />
          </div>

          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              {product ? 'Simpan Perubahan' : 'Tambahkan Produk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface AdjustStockModalProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
  onSave: (newStock: number) => void;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  product,
  onClose,
  onSave,
}) => {
  const [stock, setStock] = useState<number | ''>(product ? product.stock : '');
  const [reason, setReason] = useState('Stock opname berkala');

  if (!isOpen || !product) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (stock === '') return;
    onSave(Number(stock));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Penyesuaian Stok Fisik
              </h3>
              <p className="text-xs text-gray-500">
                {product.name} ({product.sku})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center text-xs">
            <span className="text-gray-600">Stok Saat Ini di Sistem:</span>
            <span className="font-mono font-bold text-gray-900 text-sm">
              {product.stock} {product.unit}
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Stok Fisik Baru (Hasil Opname) *
            </label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) =>
                setStock(e.target.value === '' ? '' : Number(e.target.value))
              }
              className="w-full px-3 py-2 text-sm font-mono font-bold bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Alasan Penyesuaian
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 transition-all"
            >
              <option value="Stock opname berkala">Stock opname berkala</option>
              <option value="Barang rusak / cacat produksi">Barang rusak / cacat produksi</option>
              <option value="Selisih hitung kasir ritel">Selisih hitung kasir ritel</option>
              <option value="Retur dari reseller">Retur dari reseller</option>
              <option value="Koreksi input penerimaan">Koreksi input penerimaan</option>
            </select>
          </div>

          <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              Simpan Stok Baru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
