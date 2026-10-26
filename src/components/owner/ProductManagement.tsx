import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory } from '../../types';
import { ProductModal, AdjustStockModal } from './ProductModal';
import { StatusBadge } from '../common/Badge';
import { getProductSampleImage } from '../../utils/productImages';
import {
  Search,
  Plus,
  Edit2,
  SlidersHorizontal,
  Package,
  Layers,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Boxes,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const ProductManagement: React.FC = () => {
  const { products, addProduct, updateProduct, adjustStock } = useApp();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Semua');
  const [stockStatusFilter, setStockStatusFilter] = useState<'Semua' | 'Aman' | 'Menipis' | 'Habis'>('Semua');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      const matchSearch =
        prod.name.toLowerCase().includes(search.toLowerCase()) ||
        prod.sku.toLowerCase().includes(search.toLowerCase());
      const matchCategory =
        selectedCategory === 'Semua' || prod.category === selectedCategory;

      let status = 'Aman';
      if (prod.stock <= 0) status = 'Habis';
      else if (prod.stock <= prod.minStock) status = 'Menipis';

      const matchStatus =
        stockStatusFilter === 'Semua' || status === stockStatusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, search, selectedCategory, stockStatusFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const stockSummary = useMemo(() => {
    let aman = 0;
    let menipis = 0;
    let habis = 0;
    for (const p of products) {
      if (p.stock <= 0) habis++;
      else if (p.stock <= p.minStock) menipis++;
      else aman++;
    }
    return { aman, menipis, habis, total: products.length };
  }, [products]);

  const handleExportCSV = () => {
    const headers = ['SKU', 'NAMA PRODUK', 'KATEGORI', 'HPP', 'HARGA JUAL', 'STOK', 'SATUAN', 'STATUS', 'TERAKHIR DIPERBARUI'];
    const rows = filteredProducts.map((p) => {
      let status = 'Aman';
      if (p.stock <= 0) status = 'Habis';
      else if (p.stock <= p.minStock) status = 'Menipis';
      return [
        `"${p.sku}"`,
        `"${p.name}"`,
        `"${p.category}"`,
        p.costPrice,
        p.price,
        p.stock,
        `"${p.unit}"`,
        `"${status}"`,
        `"${p.lastUpdated}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Katalog_Produk_TUMIN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Katalog Produk &amp; Master Data
            </h1>
            <span className="bg-teal-100 text-teal-800 font-semibold text-xs px-2 py-0.5 rounded">
              KATALOG AKTIF
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Kelola master data produk pakaian dalam, harga jual, harga pokok (HPP), dan batas stok minimum.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Ekspor CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-lg text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total SKU */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              TOTAL SKU AKTIF
            </span>
            <Boxes className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              {stockSummary.total} SKU
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Master katalog terdaftar di sistem
            </p>
          </div>
        </div>

        {/* Stok Aman */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              STOK AMAN
            </span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-green-600 tracking-tight">
              {stockSummary.aman} Produk
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Kuantitas di atas batas minimum
            </p>
          </div>
        </div>

        {/* Stok Menipis */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              PERINGATAN MENIPIS
            </span>
            <AlertTriangle className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-orange-500 tracking-tight">
              {stockSummary.menipis} SKU
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Perlu pengadaan restock segera
            </p>
          </div>
        </div>

        {/* Stok Habis */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              STOK HABIS (0)
            </span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-bold text-red-500 tracking-tight">
              {stockSummary.habis} SKU
            </span>
            <p className="text-xs text-gray-500 mt-1">
              Kritis! Stok kosong di gudang toko
            </p>
          </div>
        </div>
      </div>

      {/* 3. Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari SKU atau nama produk..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all text-gray-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value as ProductCategory);
                setCurrentPage(1);
              }}
              className="text-xs sm:text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-teal-600"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="CD Pria">CD Pria</option>
              <option value="CD Wanita">CD Wanita</option>
              <option value="Anak-Anak">Anak-Anak</option>
              <option value="Korset">Korset</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-gray-500">Status:</span>
            <select
              value={stockStatusFilter}
              onChange={(e) => {
                setStockStatusFilter(e.target.value as 'Semua' | 'Aman' | 'Menipis' | 'Habis');
                setCurrentPage(1);
              }}
              className="text-xs sm:text-sm py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 focus:outline-none focus:border-teal-600"
            >
              <option value="Semua">Semua Status</option>
              <option value="Aman">Stok Aman</option>
              <option value="Menipis">Menipis (≤ Batas)</option>
              <option value="Habis">Habis (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">NAMA PRODUK</th>
                <th className="py-3 px-4">KATEGORI</th>
                <th className="py-3 px-4">HPP (MODAL)</th>
                <th className="py-3 px-4">HARGA JUAL</th>
                <th className="py-3 px-4">STOK</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4">DIPERBARUI</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-400">
                    Tidak ditemukan data produk dengan filter tersebut.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((prod) => {
                  let statusBadge = (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Aman
                    </span>
                  );
                  if (prod.stock <= 0) {
                    statusBadge = (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Habis
                      </span>
                    );
                  } else if (prod.stock <= prod.minStock) {
                    statusBadge = (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Menipis
                      </span>
                    );
                  }

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-700">
                        {prod.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                            <img
                              src={getProductSampleImage(prod.sku, prod.category)}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 leading-snug">
                              {prod.name}
                            </p>
                            {prod.description && (
                              <p className="text-xs text-gray-400 line-clamp-1 max-w-xs mt-0.5">
                                {prod.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 font-medium">
                        {prod.category}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-gray-500">
                        Rp {prod.costPrice.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        Rp {prod.price.toLocaleString('id-ID')}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span
                          className={`font-bold ${
                            prod.stock <= 0
                              ? 'text-red-600'
                              : prod.stock <= prod.minStock
                              ? 'text-amber-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {prod.stock}
                        </span>{' '}
                        <span className="text-xs text-gray-500">{prod.unit}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {statusBadge}
                      </td>
                      <td className="py-3.5 px-4 text-gray-400 font-mono text-xs">
                        {prod.lastUpdated}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAdjustingProduct(prod)}
                            className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-md font-semibold text-xs whitespace-nowrap transition-colors"
                          >
                            Sesuaikan Stok
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingProduct(prod)}
                            className="p-1.5 text-gray-400 hover:text-teal-700 hover:bg-gray-100 rounded-md transition-colors"
                            title="Edit Data Produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 5. Footer Pagination */}
        <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-500">
          <div>
            Menampilkan{' '}
            <span className="font-semibold text-gray-800">
              {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            hingga{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
            </span>{' '}
            dari{' '}
            <span className="font-semibold text-gray-800">{filteredProducts.length}</span> produk
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Sebelumnya
            </button>

            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNumber = idx + 1;
              const isActive = currentPage === pageNumber;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-teal-600 text-white'
                      : 'border border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <ProductModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSave={(newProd) => addProduct(newProd)}
      />

      {/* Edit Modal */}
      <ProductModal
        isOpen={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={(data) => {
          if (editingProduct) {
            updateProduct(editingProduct.id, data);
            setEditingProduct(null);
          }
        }}
      />

      {/* Adjust Stock Modal */}
      <AdjustStockModal
        isOpen={!!adjustingProduct}
        product={adjustingProduct}
        onClose={() => setAdjustingProduct(null)}
        onSave={(newStock) => {
          if (adjustingProduct) {
            adjustStock(adjustingProduct.id, newStock);
            setAdjustingProduct(null);
          }
        }}
      />
    </div>
  );
};
