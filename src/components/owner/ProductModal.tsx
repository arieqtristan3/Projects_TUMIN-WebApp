import React, { useState, useRef, useEffect } from 'react';
import { Product, ProductCategoryValue } from '../../types';
import { getProductDisplayImage } from '../../utils/productImages';
import { X, Layers, AlertCircle, Package, SlidersHorizontal, Check, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  product?: Product | null; // If null, mode is Add; otherwise Edit
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'lastUpdated'>) => void | Promise<void>;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  product,
  onClose,
  onSave,
}) => {
  const [sku, setSku] = useState(product?.sku || '');
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState<ProductCategoryValue>(
    product?.category || 'CD Pria'
  );
  const [price, setPrice] = useState<number | ''>(product ? product.price : '');
  const [costPrice, setCostPrice] = useState<number | ''>(product ? product.costPrice : '');
  const [stock, setStock] = useState<number | ''>(product ? product.stock : '');
  const [minStock, setMinStock] = useState<number | ''>(product ? product.minStock : 10);
  const [unit, setUnit] = useState(product?.unit || 'pcs');
  const [description, setDescription] = useState(product?.description || '');
  const [image, setImage] = useState<string>(product?.image || '');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal selalu ter-mount; sinkronkan state setiap kali dibuka agar form edit
  // benar-benar menampilkan produk yang dipilih, bukan nilai awal dari render pertama.
  useEffect(() => {
    if (!isOpen) return;
    setSku(product?.sku || '');
    setName(product?.name || '');
    setCategory(product?.category || 'CD Pria');
    setPrice(product ? product.price : '');
    setCostPrice(product ? product.costPrice : '');
    setStock(product ? product.stock : '');
    setMinStock(product ? product.minStock : 10);
    setUnit(product?.unit || 'pcs');
    setDescription(product?.description || '');
    setImage(product?.image || '');
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [isOpen, product]);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('File yang diunggah harus berupa gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImage(reader.result);
        setError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim() || price === '' || costPrice === '' || stock === '') {
      setError('Harap lengkapi semua bidang wajib.');
      return;
    }

    try {
      await onSave({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      price: Number(price),
      costPrice: Number(costPrice),
      stock: Number(stock),
      minStock: Number(minStock || 10),
      unit,
      description,
      image: image.trim() !== '' ? image : undefined,
      });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Produk gagal disimpan.');
    }
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
                  setCategory(e.target.value as ProductCategoryValue)
                }
                className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
              >
                <option value="CD Pria">CD Pria</option>
                <option value="CD Wanita">CD Wanita</option>
                <option value="Anak-Anak">Anak-Anak</option>
                <option value="Korset">Korset</option>
                <option value="Bra">Bra</option>
                <option value="Kaos Kaki">Kaos Kaki</option>
                <option value="Lingerie">Lingerie</option>
                <option value="Lain-lain">Lain-lain</option>
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
                {product ? 'Stok Saat Ini (ubah melalui Kontrol Stok)' : 'Stok Awal *'}
              </label>
              <input
                type="number"
                value={stock}
                disabled={!!product}
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

          {/* Foto / Gambar Produk */}
          <div className="pt-2 border-t border-gray-100">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                <span>Foto / Gambar Produk</span>
                <span className="text-[11px] font-normal text-gray-400">(Opsional)</span>
              </span>
              {image && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-[11px] text-red-600 hover:text-red-700 font-normal flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Hapus Foto
                </button>
              )}
            </label>

            <div className="flex items-center gap-3">
              {/* Preview Box */}
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                <img
                  src={image || getProductDisplayImage({ category, sku })}
                  alt="Preview Produk"
                  className="w-full h-full object-cover"
                />
                {image && (
                  <span className="absolute bottom-0 inset-x-0 bg-teal-600/90 text-[9px] text-white text-center py-0.5 font-medium">
                    Kustom
                  </span>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1 space-y-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="product-photo-upload"
                />

                <div className="flex items-center gap-2">
                  <label
                    htmlFor="product-photo-upload"
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs border border-gray-200"
                  >
                    <Upload className="w-3.5 h-3.5 text-gray-600" />
                    <span>{image ? 'Ganti Foto' : 'Unggah Foto dari Perangkat'}</span>
                  </label>
                </div>

                <p className="text-[10px] text-gray-400 leading-tight">
                  Format JPG, PNG, atau WebP (maks 3MB). Jika kosong, sistem otomatis menggunakan ikon visual kategori pakaian dalam.
                </p>
              </div>
            </div>
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
  onSave: (newStock: number, reason?: string) => void | Promise<void>;
}

export const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
  isOpen,
  product,
  onClose,
  onSave,
}) => {
  const [stock, setStock] = useState<number | ''>(product ? product.stock : '');
  const [reason, setReason] = useState('Stock opname berkala');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !product) return;
    setStock(product.stock);
    setReason('Stock opname berkala');
    setError('');
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (stock === '') return;
    setError('');
    try { await onSave(Number(stock), reason); }
    catch (saveError) { setError(saveError instanceof Error ? saveError.message : 'Stok gagal disimpan.'); }
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

          {error && <p className="text-xs text-red-700">{error}</p>}
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
