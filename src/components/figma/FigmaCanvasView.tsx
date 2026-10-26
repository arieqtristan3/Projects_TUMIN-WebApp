import React, { useState, useRef } from 'react';
import { PublicPortal } from '../portal/PublicPortal';
import { PosScreen } from '../pos/PosScreen';
import { OwnerDashboard } from '../owner/OwnerDashboard';
import { SellerPortal } from '../seller/SellerPortal';
import {
  Maximize2,
  Minimize2,
  Copy,
  Download,
  Check,
  ZoomIn,
  ZoomOut,
  Layers,
  Palette,
  ExternalLink,
  Info,
  X,
  FileCode,
  Smartphone,
  Monitor,
  HelpCircle,
} from 'lucide-react';

interface FigmaCanvasViewProps {
  onClose: () => void;
}

export const FigmaCanvasView: React.FC<FigmaCanvasViewProps> = ({ onClose }) => {
  const [zoom, setZoom] = useState<number>(0.65);
  const [copiedFrame, setCopiedFrame] = useState<string | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);
  const [guideTab, setGuideTab] = useState<'capture' | 'prototype'>('capture');
  const [activeArtboardFilter, setActiveArtboardFilter] = useState<
    'all' | 'tokens' | 's1' | 'm_reg' | 's2' | 'm_rec' | 's3' | 's4'
  >('all');

  const containerRef = useRef<HTMLDivElement>(null);

  // SVG Export Generator for Figma
  const generateFigmaSVG = (frameName: string): string => {
    // Generate clean SVG structure with Figma-compatible layers
    const svgMap: Record<string, string> = {
      tokens: `
<svg width="1200" height="800" viewBox="0 0 1200 800" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- TUMIN Design System Tokens -->
  <rect width="1200" height="800" rx="16" fill="#FFFFFF"/>
  <text x="40" y="60" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="28" font-weight="bold">TUMIN Design System &amp; Tokens</text>
  <text x="40" y="90" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="14">Tino Underwear UMKM Integration · Bekasi</text>
  
  <!-- Color Palette -->
  <text x="40" y="140" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="18" font-weight="bold">Color Palette</text>
  <rect x="40" y="160" width="160" height="90" rx="8" fill="#047857"/>
  <text x="50" y="270" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Primary Green</text>
  <text x="50" y="290" fill="#4B6359" font-family="JetBrains Mono, monospace" font-size="12">#047857</text>
  
  <rect x="220" y="160" width="160" height="90" rx="8" fill="#6D28D9"/>
  <text x="230" y="270" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Secondary Violet</text>
  <text x="230" y="290" fill="#4B6359" font-family="JetBrains Mono, monospace" font-size="12">#6D28D9</text>
  
  <rect x="400" y="160" width="160" height="90" rx="8" fill="#A78BFA"/>
  <text x="410" y="270" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Accent Violet Light</text>
  <text x="410" y="290" fill="#4B6359" font-family="JetBrains Mono, monospace" font-size="12">#A78BFA</text>
  
  <rect x="580" y="160" width="160" height="90" rx="8" fill="#10241D"/>
  <text x="590" y="270" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Text Primary</text>
  <text x="590" y="290" fill="#4B6359" font-family="JetBrains Mono, monospace" font-size="12">#10241D</text>

  <!-- Status Badges -->
  <text x="40" y="350" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="18" font-weight="bold">Status Pill Badges</text>
  <rect x="40" y="370" width="100" height="32" rx="16" fill="#D1FAE5" stroke="#6EE7B7" stroke-width="1"/>
  <text x="65" y="391" fill="#065F46" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="600">Aman / Paid</text>

  <rect x="160" y="370" width="110" height="32" rx="16" fill="#FEF3C7" stroke="#FCD34D" stroke-width="1"/>
  <text x="180" y="391" fill="#92400E" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="600">Menipis / Partial</text>

  <rect x="290" y="370" width="110" height="32" rx="16" fill="#FFE4E6" stroke="#FDA4AF" stroke-width="1"/>
  <text x="310" y="391" fill="#9F1239" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="600">Habis / Unpaid</text>

  <!-- Typography Tokens -->
  <text x="40" y="460" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="18" font-weight="bold">Typography Scale</text>
  <text x="40" y="500" fill="#047857" font-family="Syne, sans-serif" font-size="36" font-weight="800">TUMIN (Syne ExtraBold Wordmark)</text>
  <text x="40" y="540" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="20" font-weight="700">Heading 1 - 20px Bold (Plus Jakarta Sans)</text>
  <text x="40" y="575" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="15" font-weight="400">Body Text - 15px Regular (Line height 1.5)</text>
  <text x="40" y="605" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="500">Label &amp; Metadata - 13px Medium</text>
  <text x="40" y="640" fill="#047857" font-family="JetBrains Mono, monospace" font-size="16" font-weight="700">Rp 1.450.000 (Tabular Numbers)</text>
</svg>
      `,
      s1: `
<svg width="1440" height="900" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="portalGrad" cx="20%" cy="20%" r="80%">
      <stop offset="0%" stop-color="#064E3B"/>
      <stop offset="35%" stop-color="#04382A"/>
      <stop offset="75%" stop-color="#1F103A"/>
      <stop offset="100%" stop-color="#0C0617"/>
    </radialGradient>
    <linearGradient id="wordmarkGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="50%" stop-color="#34D399"/>
      <stop offset="100%" stop-color="#A78BFA"/>
    </linearGradient>
  </defs>
  <rect width="1440" height="900" fill="url(#portalGrad)"/>
  
  <!-- Left Column -->
  <text x="120" y="320" fill="url(#wordmarkGrad)" font-family="Syne, sans-serif" font-size="72" font-weight="800">TUMIN</text>
  <text x="120" y="370" fill="#A7F3D0" font-family="Plus Jakarta Sans, sans-serif" font-size="24" font-weight="600">Tino Underwear UMKM Integration</text>
  
  <!-- Stitched Vertical Line & Description -->
  <line x1="120" y1="410" x2="120" y2="490" stroke="#10B981" stroke-width="2" stroke-dasharray="6 6"/>
  <text x="140" y="435" fill="#D1D5DB" font-family="Plus Jakarta Sans, sans-serif" font-size="16">TUMIN merupakan sistem digital yang dirancang untuk membantu</text>
  <text x="140" y="460" fill="#D1D5DB" font-family="Plus Jakarta Sans, sans-serif" font-size="16">Tino Underwear mengelola operasional bisnis secara terintegrasi,</text>
  <text x="140" y="485" fill="#D1D5DB" font-family="Plus Jakarta Sans, sans-serif" font-size="16">mulai dari transaksi penjualan, stok, seller, hingga piutang.</text>

  <!-- Right Column Card (Chamfered) -->
  <path d="M 854 220 L 1286 220 L 1300 234 L 1300 666 L 1286 680 L 854 680 L 840 666 L 840 234 Z" fill="#130E26" stroke="#10B981" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="880" y="270" fill="#A78BFA" font-family="JetBrains Mono, monospace" font-size="12" letter-spacing="2">PINTU MASUK SISTEM</text>
  <text x="880" y="305" fill="#FFFFFF" font-family="Plus Jakarta Sans, sans-serif" font-size="22" font-weight="bold">Masuk ke Portal TUMIN</text>
  
  <!-- Tabs -->
  <rect x="880" y="330" width="380" height="36" rx="6" fill="#1E1738"/>
  <rect x="882" y="332" width="124" height="32" rx="4" fill="#047857"/>
  <text x="925" y="352" fill="#FFFFFF" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="600">Owner</text>
  <text x="1055" y="352" fill="#9CA3AF" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="600">Kasir</text>
  <text x="1180" y="352" fill="#9CA3AF" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="600">Seller</text>

  <!-- Button -->
  <path d="M 884 560 L 1256 560 L 1260 564 L 1260 596 L 1256 600 L 884 600 L 880 596 L 880 564 Z" fill="#047857"/>
  <text x="1000" y="585" fill="#FFFFFF" font-family="Plus Jakarta Sans, sans-serif" font-size="14" font-weight="600">Masuk sebagai Owner</text>

  <!-- Footer -->
  <text x="120" y="850" fill="#9CA3AF" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Tino Underwear · Bekasi · WhatsApp: +62 812-9876-5432</text>
</svg>
      `,
      s2: `
<svg width="1440" height="900" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1440" height="900" fill="#F8FAF9"/>
  <!-- Top Bar -->
  <rect width="1440" height="60" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="30" y="38" fill="#047857" font-family="Syne, sans-serif" font-size="22" font-weight="800">TUMIN</text>
  <text x="120" y="37" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Kasir (POS)</text>
  <text x="220" y="37" fill="#6B7280" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Riwayat</text>
  <text x="300" y="37" fill="#6B7280" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Produk &amp; Stok</text>
  <text x="420" y="37" fill="#6B7280" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Piutang</text>
  <text x="500" y="37" fill="#6B7280" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Seller</text>
  <text x="1250" y="37" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="600">Siti Rahma · Shift Pagi</text>

  <!-- Left POS Catalog Area -->
  <rect x="30" y="80" width="940" height="46" rx="8" fill="#FFFFFF" stroke="#D1D5DB" stroke-width="1"/>
  <text x="70" y="108" fill="#9CA3AF" font-family="Plus Jakarta Sans, sans-serif" font-size="14">Cari nama atau scan barcode / SKU...</text>

  <!-- Category Pills -->
  <rect x="30" y="140" width="80" height="32" rx="16" fill="#047857"/>
  <text x="50" y="161" fill="#FFFFFF" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="600">Semua</text>
  <rect x="120" y="140" width="90" height="32" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="140" y="161" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="12">CD Pria</text>
  <rect x="220" y="140" width="100" height="32" rx="16" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="240" y="161" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="12">CD Wanita</text>

  <!-- Right Cart (Chamfered 400px panel) -->
  <path d="M 1010 80 L 1400 80 L 1410 90 L 1410 860 L 1400 870 L 1010 870 L 1000 860 L 1000 90 Z" fill="#FFFFFF" stroke="#047857" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="1030" y="120" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="16" font-weight="bold">Keranjang Penjualan</text>
  <text x="1280" y="120" fill="#4B6359" font-family="JetBrains Mono, monospace" font-size="12">#INV-20261007-001</text>
  
  <!-- Total -->
  <text x="1030" y="780" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="14" font-weight="bold">TOTAL TAGIHAN:</text>
  <text x="1230" y="780" fill="#047857" font-family="JetBrains Mono, monospace" font-size="20" font-weight="bold">Rp 1.450.000</text>
</svg>
      `,
      s3: `
<svg width="1440" height="900" viewBox="0 0 1440 900" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1440" height="900" fill="#F8FAF9"/>
  <!-- Sidebar -->
  <rect width="250" height="900" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="30" y="45" fill="#047857" font-family="Syne, sans-serif" font-size="22" font-weight="800">TUMIN</text>
  <text x="30" y="65" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="11">Tino Underwear Information System</text>

  <rect x="15" y="95" width="220" height="38" rx="6" fill="#047857"/>
  <text x="50" y="119" fill="#FFFFFF" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Dashboard</text>
  <text x="50" y="160" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Layar Kasir (POS)</text>
  <text x="50" y="200" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Katalog Produk</text>
  <text x="50" y="240" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Kontrol Stok</text>
  <text x="50" y="280" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Mitra Seller</text>
  <text x="50" y="320" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Buku Piutang</text>
  <text x="50" y="360" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Laporan Keuangan</text>

  <!-- Top bar -->
  <rect x="250" width="1190" height="60" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="280" y="38" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="18" font-weight="bold">Dashboard Analitik</text>
  <text x="1200" y="37" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Pak Tino (Owner)</text>

  <!-- 4 KPI Cards -->
  <rect x="280" y="90" width="260" height="110" rx="8" fill="#FFFFFF" stroke="#A7F3D0" stroke-width="1"/>
  <text x="300" y="120" fill="#065F46" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Omzet Hari Ini</text>
  <text x="300" y="155" fill="#047857" font-family="JetBrains Mono, monospace" font-size="22" font-weight="bold">Rp 2.130.000</text>

  <rect x="560" y="90" width="260" height="110" rx="8" fill="#FFFFFF" stroke="#DDD6FE" stroke-width="1"/>
  <text x="580" y="120" fill="#5B21B6" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Omzet Bulan Ini</text>
  <text x="580" y="155" fill="#6D28D9" font-family="JetBrains Mono, monospace" font-size="22" font-weight="bold">Rp 62.400.000</text>

  <rect x="840" y="90" width="260" height="110" rx="8" fill="#FFFFFF" stroke="#FECDD3" stroke-width="1"/>
  <text x="860" y="120" fill="#9F1239" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Total Piutang Aktif</text>
  <text x="860" y="155" fill="#BE123C" font-family="JetBrains Mono, monospace" font-size="22" font-weight="bold">Rp 5.500.000</text>

  <rect x="1120" y="90" width="260" height="110" rx="8" fill="#FFFFFF" stroke="#FDE68A" stroke-width="1"/>
  <text x="1140" y="120" fill="#92400E" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Produk Stok Menipis</text>
  <text x="1140" y="155" fill="#D97706" font-family="JetBrains Mono, monospace" font-size="22" font-weight="bold">4 SKU</text>
</svg>
      `,
      s4: `
<svg width="393" height="852" viewBox="0 0 393 852" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="393" height="852" fill="#F8FAF9"/>
  <!-- Status Bar / Dynamic Island -->
  <rect x="136" y="12" width="120" height="24" rx="12" fill="#000000"/>
  
  <!-- Header -->
  <rect y="48" width="393" height="54" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="20" y="80" fill="#047857" font-family="Syne, sans-serif" font-size="18" font-weight="800">TUMIN</text>
  <text x="260" y="80" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="bold">Toko Budi Jaya</text>

  <!-- Welcome -->
  <text x="20" y="130" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="18" font-weight="bold">Selamat datang, Budi 👋</text>
  <text x="20" y="150" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="12">Kios Kranji, Bekasi Barat</text>

  <!-- 3 Summary Cards -->
  <rect x="20" y="170" width="353" height="100" rx="12" fill="#FFFFFF" stroke="#6EE7B7" stroke-width="1"/>
  <text x="35" y="195" fill="#065F46" font-family="Plus Jakarta Sans, sans-serif" font-size="12" font-weight="600">Tagihan Belum Dibayar</text>
  <text x="35" y="235" fill="#BE123C" font-family="JetBrains Mono, monospace" font-size="24" font-weight="bold">Rp 1.450.000</text>

  <rect x="20" y="280" width="170" height="80" rx="12" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="32" y="305" fill="#5B21B6" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="600">Total Tagihan</text>
  <text x="32" y="335" fill="#6D28D9" font-family="JetBrains Mono, monospace" font-size="16" font-weight="bold">Rp 1.800.000</text>

  <rect x="203" y="280" width="170" height="80" rx="12" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="215" y="305" fill="#374151" font-family="Plus Jakarta Sans, sans-serif" font-size="11" font-weight="600">Jumlah Stok</text>
  <text x="215" y="335" fill="#10241D" font-family="JetBrains Mono, monospace" font-size="16" font-weight="bold">43 pcs</text>

  <!-- Bottom Nav -->
  <rect y="790" width="393" height="62" fill="#FFFFFF" stroke="#E5E7EB" stroke-width="1"/>
  <text x="35" y="825" fill="#047857" font-family="Plus Jakarta Sans, sans-serif" font-size="10" font-weight="600">Beranda</text>
  <text x="110" y="825" fill="#6B7280" font-family="Plus Jakarta Sans, sans-serif" font-size="10">Stok Saya</text>
  <text x="195" y="825" fill="#6B7280" font-family="Plus Jakarta Sans, sans-serif" font-size="10">Tagihan</text>
  <text x="275" y="825" fill="#6B7280" font-family="Plus Jakarta Sans, sans-serif" font-size="10">Riwayat</text>
  <text x="345" y="825" fill="#6B7280" font-family="Plus Jakarta Sans, sans-serif" font-size="10">Profil</text>
</svg>
      `,
      modal_register: `
<svg width="560" height="760" viewBox="0 0 560 760" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="560" height="760" rx="16" fill="#130E26" stroke="#10B981" stroke-width="1.5" stroke-dasharray="6 4"/>
  <text x="36" y="50" fill="#A78BFA" font-family="JetBrains Mono, monospace" font-size="11" letter-spacing="1.5">PENGAJUAN MITRA SELLER</text>
  <text x="36" y="80" fill="#FFFFFF" font-family="Plus Jakarta Sans, sans-serif" font-size="20" font-weight="bold">Formulir Pendaftaran Seller</text>
  <text x="36" y="105" fill="#9CA3AF" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Isi data identitas dan toko Anda untuk mengajukan kemitraan.</text>
  
  <!-- Fields -->
  <text x="36" y="150" fill="#D1D5DB" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Nama Lengkap *</text>
  <rect x="36" y="160" width="488" height="40" rx="6" fill="#1E1738" stroke="#374151" stroke-width="1"/>
  <text x="50" y="185" fill="#9CA3AF" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Budi Santoso</text>
  
  <text x="36" y="230" fill="#D1D5DB" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Nomor WhatsApp *</text>
  <rect x="36" y="240" width="488" height="40" rx="6" fill="#1E1738" stroke="#374151" stroke-width="1"/>
  <text x="50" y="265" fill="#9CA3AF" font-family="Plus Jakarta Sans, sans-serif" font-size="13">081234567890</text>
  
  <text x="36" y="310" fill="#D1D5DB" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Nama Toko / Usaha *</text>
  <rect x="36" y="320" width="488" height="40" rx="6" fill="#1E1738" stroke="#374151" stroke-width="1"/>
  <text x="50" y="345" fill="#9CA3AF" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Toko Budi Jaya</text>
  
  <text x="36" y="390" fill="#D1D5DB" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Alamat Usaha *</text>
  <rect x="36" y="400" width="488" height="40" rx="6" fill="#1E1738" stroke="#374151" stroke-width="1"/>
  <text x="50" y="425" fill="#9CA3AF" font-family="Plus Jakarta Sans, sans-serif" font-size="13">Pasar Kranji Blok B No. 12, Bekasi Barat</text>

  <!-- Submit button -->
  <rect x="36" y="650" width="488" height="46" rx="8" fill="#047857"/>
  <text x="180" y="679" fill="#FFFFFF" font-family="Plus Jakarta Sans, sans-serif" font-size="14" font-weight="bold">Kirim Pengajuan Kemitraan</text>
</svg>
      `,
      modal_receipt: `
<svg width="480" height="680" viewBox="0 0 480 680" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="480" height="680" rx="16" fill="#FFFFFF" stroke="#047857" stroke-width="1.5"/>
  <text x="130" y="45" fill="#047857" font-family="Syne, sans-serif" font-size="20" font-weight="800">TINO UNDERWEAR BEKASI</text>
  <text x="160" y="68" fill="#4B6359" font-family="Plus Jakarta Sans, sans-serif" font-size="12">Pusat Grosir &amp; Eceran Pakaian Dalam</text>
  <line x1="30" y1="85" x2="450" y2="85" stroke="#D1D5DB" stroke-dasharray="4 4"/>
  
  <text x="30" y="115" fill="#4B6359" font-family="JetBrains Mono, monospace" font-size="12">No. Faktur: #INV-20261007-001</text>
  <text x="30" y="135" fill="#4B6359" font-family="JetBrains Mono, monospace" font-size="12">Kasir: Siti Rahma · Shift Pagi</text>
  <text x="30" y="155" fill="#4B6359" font-family="JetBrains Mono, monospace" font-size="12">Tanggal: 07 Okt 2026, 14:32 WIB</text>
  
  <line x1="30" y1="175" x2="450" y2="175" stroke="#D1D5DB" stroke-dasharray="4 4"/>
  <text x="30" y="200" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">CD Pria Boxer Bamboo (10x)</text>
  <text x="350" y="200" fill="#10241D" font-family="JetBrains Mono, monospace" font-size="13">Rp 350.000</text>
  
  <text x="30" y="230" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">CD Wanita Seamless (20x)</text>
  <text x="350" y="230" fill="#10241D" font-family="JetBrains Mono, monospace" font-size="13">Rp 560.000</text>
  
  <line x1="30" y1="270" x2="450" y2="270" stroke="#10B981" stroke-width="2"/>
  <text x="30" y="305" fill="#10241D" font-family="Plus Jakarta Sans, sans-serif" font-size="16" font-weight="bold">TOTAL PEMBAYARAN:</text>
  <text x="320" y="305" fill="#047857" font-family="JetBrains Mono, monospace" font-size="18" font-weight="bold">Rp 910.000</text>
  
  <rect x="30" y="600" width="420" height="42" rx="6" fill="#047857"/>
  <text x="180" y="626" fill="#FFFFFF" font-family="Plus Jakarta Sans, sans-serif" font-size="13" font-weight="600">Transaksi Baru</text>
</svg>
      `,
    };

    return svgMap[frameName] || svgMap.tokens;
  };

  const handleCopyFigmaSVG = (frameKey: string) => {
    const svgCode = generateFigmaSVG(frameKey);
    navigator.clipboard.writeText(svgCode.trim()).then(() => {
      setCopiedFrame(frameKey);
      setTimeout(() => setCopiedFrame(null), 2500);
    });
  };

  const handleDownloadSVG = (frameKey: string, filename: string) => {
    const svgCode = generateFigmaSVG(frameKey);
    const blob = new Blob([svgCode], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTokensJSON = () => {
    const tokens = {
      tumin_design_tokens: {
        name: 'TUMIN Design System',
        version: '1.0.0',
        metadata: {
          client: 'Tino Underwear UMKM',
          location: 'Bekasi, Jawa Barat',
          concept: 'Sewing Pattern Futuristic',
        },
        color: {
          primary_green: { value: '#047857', type: 'color', description: 'Primary green for buttons, prices, active states' },
          secondary_violet: { value: '#6D28D9', type: 'color', description: 'Secondary violet accent' },
          secondary_violet_light: { value: '#A78BFA', type: 'color', description: 'Light tint for secondary buttons' },
          text_main: { value: '#10241D', type: 'color', description: 'Primary body text' },
          text_muted: { value: '#4B6359', type: 'color', description: 'Secondary muted labels' },
          bg_mint: { value: '#ECFDF5', type: 'color', description: 'Light background tint' },
          bg_lavender: { value: '#F5F3FF', type: 'color', description: 'Lavender off-white background' },
          portal_gradient_start: { value: '#064E3B', type: 'color' },
          portal_gradient_end: { value: '#0C0617', type: 'color' },
          status: {
            success_bg: { value: '#D1FAE5', type: 'color' },
            success_text: { value: '#065F46', type: 'color' },
            warning_bg: { value: '#FEF3C7', type: 'color' },
            warning_text: { value: '#92400E', type: 'color' },
            danger_bg: { value: '#FFE4E6', type: 'color' },
            danger_text: { value: '#9F1239', type: 'color' },
          },
        },
        typography: {
          font_body: { value: 'Plus Jakarta Sans', type: 'fontFamilies' },
          font_brand: { value: 'Syne', type: 'fontFamilies' },
          font_numeric: { value: 'JetBrains Mono', type: 'fontFamilies' },
          scale: {
            body: { fontSize: '15px', lineHeight: '1.5' },
            small_label: { fontSize: '13px', lineHeight: '1.4' },
            price_heading: { fontSize: '18px', fontWeight: 'bold', fontFeatureSettings: '"tnum"' },
          },
        },
        geometry: {
          chamfer_cut: { value: '12px 45deg cut corner', type: 'borderRadius' },
          stitch_dash: { value: '6px dash, 4px gap', type: 'borderStyle' },
        },
      },
    };

    const blob = new Blob([JSON.stringify(tokens, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tumin_figma_tokens.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllSVGs = () => {
    const frames = [
      { key: 'tokens', filename: 'TUMIN_Design_Tokens.svg' },
      { key: 's1', filename: 'TUMIN_Screen1_Portal.svg' },
      { key: 'modal_register', filename: 'TUMIN_Modal_Register_Seller.svg' },
      { key: 's2', filename: 'TUMIN_Screen2_Kasir_POS.svg' },
      { key: 'modal_receipt', filename: 'TUMIN_Modal_Struk_POS.svg' },
      { key: 's3', filename: 'TUMIN_Screen3_Owner_Dashboard.svg' },
      { key: 's4', filename: 'TUMIN_Screen4_Seller_PWA.svg' },
    ];
    frames.forEach((frame, idx) => {
      setTimeout(() => {
        handleDownloadSVG(frame.key, frame.filename);
      }, idx * 250);
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1E1E1E] text-white flex flex-col select-none overflow-hidden font-sans">
      {/* Top Figma-Style Dark App Bar */}
      <header className="h-14 bg-[#2C2C2C] border-b border-[#3D3D3D] px-4 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-7 flex flex-col justify-between">
              {/* Figma iconic color blocks */}
              <div className="flex">
                <span className="w-2.5 h-2.5 rounded-l-full bg-[#F24E1E]" />
                <span className="w-2.5 h-2.5 rounded-r-full bg-[#FF7262]" />
              </div>
              <div className="flex">
                <span className="w-2.5 h-2.5 rounded-l-full bg-[#A259FF]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#1ABCFE]" />
              </div>
              <span className="w-2.5 h-2.5 rounded-l-full bg-[#0ACF83]" />
            </div>
            <div>
              <span className="font-bold text-sm text-stone-100 font-display tracking-tight">
                TUMIN Figma Artboard Canvas
              </span>
              <span className="text-[10px] text-stone-400 block font-mono">
                Multi-Artboard System (Desktop 1440 × 900 &amp; Mobile 393 × 852)
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-stone-700 hidden sm:block" />

          {/* Artboard Filters */}
          <div className="hidden lg:flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveArtboardFilter('all')}
              className={`px-2 py-1 rounded transition-colors ${
                activeArtboardFilter === 'all'
                  ? 'bg-[#047857] text-white font-semibold'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              Semua (7)
            </button>
            <button
              onClick={() => setActiveArtboardFilter('tokens')}
              className={`px-2 py-1 rounded transition-colors ${
                activeArtboardFilter === 'tokens'
                  ? 'bg-[#047857] text-white font-semibold'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              Tokens
            </button>
            <button
              onClick={() => setActiveArtboardFilter('s1')}
              className={`px-2 py-1 rounded transition-colors ${
                activeArtboardFilter === 's1'
                  ? 'bg-[#047857] text-white font-semibold'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              1. Portal
            </button>
            <button
              onClick={() => setActiveArtboardFilter('m_reg')}
              className={`px-2 py-1 rounded transition-colors ${
                activeArtboardFilter === 'm_reg'
                  ? 'bg-[#047857] text-white font-semibold'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              1b. Modal Daftar
            </button>
            <button
              onClick={() => setActiveArtboardFilter('s2')}
              className={`px-2 py-1 rounded transition-colors ${
                activeArtboardFilter === 's2'
                  ? 'bg-[#047857] text-white font-semibold'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              2. POS Kasir
            </button>
            <button
              onClick={() => setActiveArtboardFilter('m_rec')}
              className={`px-2 py-1 rounded transition-colors ${
                activeArtboardFilter === 'm_rec'
                  ? 'bg-[#047857] text-white font-semibold'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              2b. Modal Struk
            </button>
            <button
              onClick={() => setActiveArtboardFilter('s3')}
              className={`px-2 py-1 rounded transition-colors ${
                activeArtboardFilter === 's3'
                  ? 'bg-[#047857] text-white font-semibold'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              3. Owner
            </button>
            <button
              onClick={() => setActiveArtboardFilter('s4')}
              className={`px-2 py-1 rounded transition-colors ${
                activeArtboardFilter === 's4'
                  ? 'bg-[#047857] text-white font-semibold'
                  : 'text-stone-300 hover:bg-stone-700'
              }`}
            >
              4. Portal Seller
            </button>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-[#1E1E1E] rounded px-1.5 py-1 border border-stone-700 text-xs gap-1">
            <button
              onClick={() => setZoom((prev) => Math.max(0.3, prev - 0.1))}
              className="p-1 hover:text-emerald-400"
              title="Perkecil"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="w-11 text-center font-mono-num text-[11px] text-stone-300">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((prev) => Math.min(1.2, prev + 0.1))}
              className="p-1 hover:text-emerald-400"
              title="Perbesar"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoom(0.65)}
              className="text-[10px] text-stone-400 hover:text-white px-1.5 py-0.5 bg-stone-800 rounded"
            >
              Fit
            </button>
          </div>

          {/* Guide Modal Trigger */}
          <button
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#383838] hover:bg-[#484848] text-xs font-semibold rounded text-stone-200 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cara Buka di Figma</span>
          </button>

          {/* Tokens JSON Download */}
          <button
            onClick={handleDownloadTokensJSON}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-[#2A2338] hover:bg-[#382E4D] border border-purple-500/30 text-xs font-medium rounded text-purple-200 transition-colors"
            title="Unduh Figma Design Tokens (.json) untuk Variables & Tokens Studio"
          >
            <FileCode className="w-3.5 h-3.5 text-purple-400" />
            <span>Tokens (.json)</span>
          </button>

          {/* Download All SVGs */}
          <button
            onClick={handleDownloadAllSVGs}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-xs font-medium rounded text-emerald-200 transition-colors"
            title="Unduh seluruh 5 Artboard (.svg) siap drag-and-drop ke Figma"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unduh Semua SVG</span>
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-rose-900/60 text-stone-400 hover:text-white rounded transition-colors"
            title="Tutup Tampilan Kanvas Figma"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Canvas Infinite Workspace Area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-8 relative"
        style={{
          backgroundColor: '#1E1E1E',
          backgroundImage:
            'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      >
        <div
          className="transition-transform duration-100 origin-top-left flex flex-col gap-12 pb-24"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* ARTBOARD 0: FIGMA DESIGN SYSTEM & TOKENS */}
          {(activeArtboardFilter === 'all' || activeArtboardFilter === 'tokens') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#10B981]" />
                  <span className="font-bold text-stone-200">
                    Artboard 0 · Design System &amp; Component Specs (1200 × 580)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyFigmaSVG('tokens')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 text-xs"
                  >
                    {copiedFrame === 'tokens' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-semibold">Tersalin! Paste di Figma</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin SVG untuk Figma</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadSVG('tokens', 'TUMIN_Design_Tokens.svg')
                    }
                    className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                    title="Unduh SVG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Tokens Frame */}
              <div className="w-[1200px] bg-white rounded-lg p-8 shadow-2xl border border-stone-700 text-[#10241D] space-y-6">
                <div>
                  <h2 className="text-2xl font-bold font-display text-[#10241D]">
                    TUMIN Design System &amp; UI Kit Tokens
                  </h2>
                  <p className="text-xs text-[#4B6359] mt-0.5">
                    Spesifikasi komponen sewing-pattern, futuristic, tipografi Plus Jakarta Sans, dan palet warna UMKM.
                  </p>
                </div>

                {/* Color Swatches */}
                <div>
                  <h3 className="text-xs uppercase font-mono font-bold text-stone-500 mb-2">
                    Color Tokens
                  </h3>
                  <div className="grid grid-cols-5 gap-3">
                    <div className="p-3 rounded bg-[#047857] text-white space-y-1">
                      <span className="text-xs font-bold block">Primary Green</span>
                      <span className="font-mono text-xs opacity-90">#047857</span>
                    </div>
                    <div className="p-3 rounded bg-[#6D28D9] text-white space-y-1">
                      <span className="text-xs font-bold block">Secondary Violet</span>
                      <span className="font-mono text-xs opacity-90">#6D28D9</span>
                    </div>
                    <div className="p-3 rounded bg-[#A78BFA] text-[#1E1035] space-y-1">
                      <span className="text-xs font-bold block">Accent Light</span>
                      <span className="font-mono text-xs opacity-90">#A78BFA</span>
                    </div>
                    <div className="p-3 rounded bg-[#10241D] text-white space-y-1">
                      <span className="text-xs font-bold block">Text Primary</span>
                      <span className="font-mono text-xs opacity-90">#10241D</span>
                    </div>
                    <div className="p-3 rounded bg-[#ECFDF5] border border-emerald-300 text-[#047857] space-y-1">
                      <span className="text-xs font-bold block">Bright Background</span>
                      <span className="font-mono text-xs opacity-90">#ECFDF5</span>
                    </div>
                  </div>
                </div>

                {/* Component Specs: Chamfered Buttons, Inputs with Dashed Bottom Border */}
                <div className="grid grid-cols-3 gap-4 pt-2 border-t border-stone-200">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-stone-700">
                      Chamfered Buttons (Cut Corners)
                    </h4>
                    <div className="space-y-2">
                      <button className="w-full py-2 bg-[#047857] text-white text-xs font-semibold chamfer-btn">
                        Primary Button (Cut Corner)
                      </button>
                      <button className="w-full py-2 bg-purple-100 border border-purple-300 text-[#6D28D9] text-xs font-semibold chamfer-btn">
                        Secondary Button Tint
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-stone-700">
                      Inputs with Dashed Bottom Border
                    </h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        defaultValue="Input Jahitan Putus-Putus"
                        className="w-full py-1 text-xs input-stitch text-[#10241D]"
                        readOnly
                      />
                      <input
                        type="text"
                        defaultValue="Rp 250.000 (Tabular Nums)"
                        className="w-full py-1 text-xs font-mono-num font-bold text-[#047857] input-stitch"
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-stone-700">
                      Status Pill Badges
                    </h4>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-900 border border-emerald-300">
                        Aman / Paid
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-300">
                        Menipis / Pending
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-900 border border-rose-300">
                        Habis / Unpaid
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ARTBOARD 1: SCREEN 1 - PORTAL & LOGIN (1440 × 900) */}
          {(activeArtboardFilter === 'all' || activeArtboardFilter === 's1') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-stone-200">
                    Artboard 1 · Screen 1: Public Portal &amp; Login (1440 × 900)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyFigmaSVG('s1')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 text-xs"
                  >
                    {copiedFrame === 's1' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-semibold">Tersalin! Paste di Figma</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin SVG untuk Figma</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadSVG('s1', 'TUMIN_Screen1_Portal.svg')}
                    className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                    title="Unduh SVG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Artboard Frame Canvas */}
              <div className="w-[1440px] h-[900px] overflow-hidden rounded-lg shadow-2xl border border-stone-700 relative">
                <PublicPortal />
              </div>
            </div>
          )}

          {/* ARTBOARD 1B: MODAL REGISTRASI SELLER (OVERLAY 560 × 760) */}
          {(activeArtboardFilter === 'all' || activeArtboardFilter === 'm_reg') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono max-w-[560px]">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-stone-200">
                    Artboard 1b · Modal: Registrasi Seller (560 × 760)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyFigmaSVG('modal_register')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 text-xs"
                  >
                    {copiedFrame === 'modal_register' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-semibold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin SVG</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadSVG('modal_register', 'TUMIN_Modal_Register_Seller.svg')}
                    className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                    title="Unduh SVG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Artboard Frame Canvas */}
              <div className="w-[560px] bg-[#130E26] rounded-xl p-6 shadow-2xl border border-emerald-500/40 text-white relative">
                <div className="border-b border-stone-800 pb-3">
                  <span className="text-[11px] font-mono tracking-widest text-[#A78BFA] uppercase">
                    PENGAJUAN MITRA SELLER
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">
                    Formulir Pendaftaran Seller
                  </h3>
                  <p className="text-xs text-stone-400">
                    Isi data identitas dan toko Anda untuk mengajukan kemitraan resmi.
                  </p>
                </div>

                <div className="mt-4 space-y-3 text-xs">
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Nama Lengkap *</label>
                    <input className="w-full px-3 py-2 bg-[#1E1738] rounded border border-stone-700 text-stone-200" defaultValue="Budi Santoso" readOnly />
                  </div>
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Nomor WhatsApp *</label>
                    <input className="w-full px-3 py-2 bg-[#1E1738] rounded border border-stone-700 text-stone-200 font-mono-num" defaultValue="081234567890" readOnly />
                  </div>
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Nama Toko / Kios *</label>
                    <input className="w-full px-3 py-2 bg-[#1E1738] rounded border border-stone-700 text-stone-200" defaultValue="Toko Budi Jaya" readOnly />
                  </div>
                  <div>
                    <label className="block text-stone-300 font-medium mb-1">Alamat Usaha *</label>
                    <input className="w-full px-3 py-2 bg-[#1E1738] rounded border border-stone-700 text-stone-200" defaultValue="Pasar Kranji Blok B No. 12, Bekasi Barat" readOnly />
                  </div>
                  <div className="pt-2">
                    <button className="w-full py-2.5 bg-[#047857] hover:bg-[#065F46] font-semibold text-white rounded text-xs transition-colors">
                      Kirim Pengajuan Kemitraan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ARTBOARD 2: SCREEN 2 - KASIR / POS (1440 × 900) */}
          {(activeArtboardFilter === 'all' || activeArtboardFilter === 's2') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-stone-200">
                    Artboard 2 · Screen 2: Kasir / POS (1440 × 900)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyFigmaSVG('s2')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 text-xs"
                  >
                    {copiedFrame === 's2' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-semibold">Tersalin! Paste di Figma</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin SVG untuk Figma</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadSVG('s2', 'TUMIN_Screen2_POS.svg')}
                    className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                    title="Unduh SVG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Artboard Frame Canvas */}
              <div className="w-[1440px] h-[900px] overflow-hidden rounded-lg shadow-2xl border border-stone-700 bg-white relative">
                <PosScreen />
              </div>
            </div>
          )}

          {/* ARTBOARD 2B: MODAL STRUK TRANSAKSI POS (OVERLAY 480 × 660) */}
          {(activeArtboardFilter === 'all' || activeArtboardFilter === 'm_rec') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono max-w-[480px]">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-stone-200">
                    Artboard 2b · Modal: Struk Transaksi POS (480 × 660)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyFigmaSVG('modal_receipt')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 text-xs"
                  >
                    {copiedFrame === 'modal_receipt' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-semibold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin SVG</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadSVG('modal_receipt', 'TUMIN_Modal_Struk_POS.svg')}
                    className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                    title="Unduh SVG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Artboard Frame Canvas */}
              <div className="w-[480px] bg-white rounded-xl p-6 shadow-2xl border border-stone-300 text-[#10241D] relative font-sans">
                <div className="text-center pb-3 border-b border-dashed border-stone-300">
                  <h3 className="font-bold font-display text-base text-[#047857]">
                    TINO UNDERWEAR BEKASI
                  </h3>
                  <p className="text-[11px] text-[#4B6359]">
                    Pusat Grosir &amp; Eceran Pakaian Dalam Berkualitas
                  </p>
                  <p className="text-[11px] font-mono-num text-stone-500 mt-1">
                    #INV-20261007-001 · Kasir: Siti Rahma
                  </p>
                </div>

                <div className="py-3 font-mono text-xs space-y-2 border-b border-dashed border-stone-300">
                  <div className="flex justify-between">
                    <span>CD Pria Boxer Bamboo (10x)</span>
                    <span className="font-bold">Rp 350.000</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CD Wanita Seamless (20x)</span>
                    <span className="font-bold">Rp 560.000</span>
                  </div>
                </div>

                <div className="py-3 flex justify-between items-center text-sm font-bold">
                  <span>TOTAL PEMBAYARAN:</span>
                  <span className="text-[#047857] text-base font-mono-num">
                    Rp 910.000
                  </span>
                </div>

                <div className="pt-2">
                  <button className="w-full py-2 bg-[#047857] text-white font-semibold rounded text-xs">
                    Transaksi Baru
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ARTBOARD 3: SCREEN 3 - OWNER DASHBOARD (1440 × 900) */}
          {(activeArtboardFilter === 'all' || activeArtboardFilter === 's3') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-stone-200">
                    Artboard 3 · Screen 3: Owner Information System Dashboard (1440 × 900)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyFigmaSVG('s3')}
                    className="flex items-center gap-1 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 text-xs"
                  >
                    {copiedFrame === 's3' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300 font-semibold">Tersalin! Paste di Figma</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin SVG untuk Figma</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadSVG('s3', 'TUMIN_Screen3_Owner.svg')}
                    className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                    title="Unduh SVG"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Artboard Frame Canvas */}
              <div className="w-[1440px] h-[900px] overflow-hidden rounded-lg shadow-2xl border border-stone-700 bg-[#F8FAF9] relative">
                <OwnerDashboard />
              </div>
            </div>
          )}

          {/* ARTBOARD 4: SCREEN 4 - SELLER MOBILE PWA (393 × 852) */}
          {(activeArtboardFilter === 'all' || activeArtboardFilter === 's4') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400 font-mono max-w-[393px]">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-stone-200">
                    Artboard 4 · Screen 4: Portal Mitra Seller (Mobile & Desktop Web)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyFigmaSVG('s4')}
                    className="flex items-center gap-1 px-2 py-0.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 text-[11px]"
                  >
                    {copiedFrame === 's4' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-300 font-semibold">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin SVG</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDownloadSVG('s4', 'TUMIN_Screen4_Seller.svg')}
                    className="p-1 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded border border-stone-700"
                    title="Unduh SVG"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Mobile Artboard Frame Canvas */}
              <div className="w-[393px] h-[852px] overflow-hidden rounded-[40px] shadow-2xl border-4 border-stone-600 bg-white relative">
                <SellerPortal />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL PANDUAN IMPORT KE FIGMA */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-[#262626] rounded-xl border border-stone-700 p-6 text-stone-100 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-stone-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#047857] flex items-center justify-center text-white font-bold font-display">
                  F
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Panduan Membuka Desain di Figma
                  </h3>
                  <p className="text-xs text-stone-400">
                    Ada 3 metode mudah untuk memasukkan seluruh frame ke kanvas Figma Anda.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 text-stone-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Subtabs */}
            <div className="flex border-b border-stone-700 text-xs">
              <button
                onClick={() => setGuideTab('capture')}
                className={`px-3 py-2 font-semibold border-b-2 transition-colors ${
                  guideTab === 'capture'
                    ? 'border-[#047857] text-emerald-400'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                1. Cara Mengambil Semua Halaman (html.to.design / SVG)
              </button>
              <button
                onClick={() => setGuideTab('prototype')}
                className={`px-3 py-2 font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
                  guideTab === 'prototype'
                    ? 'border-[#6D28D9] text-purple-300'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                <span>2. Prototyping Interaktif di Figma (Aksi Klik Tombol)</span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              </button>
            </div>

            {guideTab === 'capture' ? (
              <div className="space-y-3 text-xs leading-relaxed max-h-[62vh] overflow-y-auto pr-1">
                {/* Kenapa muncul Google Login? */}
                <div className="p-3 bg-amber-950/60 rounded-lg border border-amber-500/40 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                    <span>⚠️ Mengapa muncul halaman Login Google di html.to.design?</span>
                  </div>
                  <p className="text-stone-300 leading-normal">
                    Link preview aplikasi ini dilindungi oleh otentikasi Google Cloud Run. Ketika server cloud plugin <em>html.to.design</em> mencoba membuka link dari luar, server Google menolak bot dan mengarahkannya ke halaman Google Sign-In.
                  </p>
                  <p className="text-amber-200 font-medium">
                    &rarr; <strong>Gunakan Solusi Ekstensi Chrome atau Salin SVG:</strong> 100% bebas dari halaman login Google!
                  </p>
                </div>

                {/* Langkah merekam semua halaman */}
                <div className="p-3 bg-[#1E1E1E] rounded-lg border border-sky-500/40 space-y-2">
                  <span className="font-bold text-sky-400 text-xs block">
                    Cara Merekam Semua Halaman &amp; Modal via Ekstensi "html.to.design":
                  </span>
                  <ol className="list-decimal pl-4 space-y-1.5 text-stone-300">
                    <li>
                      Pasang ekstensi browser resmi: <strong>html.to.design di Chrome Web Store</strong>.
                    </li>
                    <li>
                      <strong>Halaman 1 (Portal):</strong> Buka tab TUMIN &rarr; klik ekstensi html.to.design &rarr; klik <em>Capture page</em>.
                    </li>
                    <li>
                      <strong>Modal 1b (Daftar Seller):</strong> Di tab web, klik tombol <em>"Daftar sebagai Seller"</em> hingga popup formulir muncul &rarr; klik ekstensi &rarr; <em>Capture page</em>.
                    </li>
                    <li>
                      <strong>Halaman 2 (Kasir POS):</strong> Pilih peran Kasir dan klik Masuk &rarr; klik ekstensi &rarr; <em>Capture page</em>.
                    </li>
                    <li>
                      <strong>Modal 2b (Struk Pembayaran):</strong> Tambah barang di POS, klik <em>"Bayar sekarang"</em> hingga modal struk muncul &rarr; klik ekstensi &rarr; <em>Capture page</em>.
                    </li>
                    <li>
                      <strong>Halaman 3 (Owner Dashboard):</strong> Pilih peran Owner dan klik Masuk &rarr; klik ekstensi &rarr; <em>Capture page</em>.
                    </li>
                    <li>
                      <strong>Halaman 4 (Portal Seller):</strong> Pilih peran Seller dan klik Masuk &rarr; klik ekstensi &rarr; <em>Capture page</em> (responsif smartphone & desktop).
                    </li>
                  </ol>
                </div>

                {/* Alternatif SVG instan */}
                <div className="p-3 bg-[#1E1E1E] rounded-lg border border-emerald-500/40 space-y-1.5">
                  <span className="font-bold text-emerald-400 text-xs block">
                    Alternatif Instan (Tanpa Plugin): Salin SVG Langsung ke Figma ⭐
                  </span>
                  <p className="text-stone-300">
                    Anda juga dapat mengklik tombol <strong>"Salin SVG untuk Figma"</strong> di masing-masing artboard di kanvas ini (termasuk <em>Modal Daftar</em> dan <em>Modal Struk</em>), lalu tekan <kbd className="bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700 text-white font-mono">Ctrl + V</kbd> di Figma.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs leading-relaxed max-h-[62vh] overflow-y-auto pr-1">
                {/* Panduan Prototyping Figma */}
                <div className="p-3 bg-purple-950/50 rounded-lg border border-purple-500/40 space-y-2">
                  <span className="font-bold text-purple-300 text-xs block">
                    💡 Cara Menghubungkan Aksi Klik Tombol di Figma (Figma Prototyping):
                  </span>
                  <p className="text-stone-300">
                    Di Figma, Anda dapat membuat tombol benar-benar bisa diklik dan berpindah layar menggunakan tab <strong>Prototype</strong> di panel kanan (shortcut <kbd className="bg-stone-800 px-1 py-0.5 rounded text-white font-mono">Shift + E</kbd>).
                  </p>
                </div>

                <div className="space-y-2.5">
                  {/* Step 1: Daftar Seller */}
                  <div className="p-3 bg-[#1E1E1E] rounded-lg border border-stone-700 space-y-1">
                    <span className="font-bold text-amber-400 block">
                      1. Tombol "Daftar sebagai Seller" &rarr; Muncul Modal Pendaftaran
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-stone-300">
                      <li>Pilih tombol <em>"Daftar sebagai Seller"</em> pada Frame Portal.</li>
                      <li>Di tab <strong>Prototype</strong>, tarik lingkaran biru (+ / noodle) ke Frame <strong>Modal Registrasi Seller</strong>.</li>
                      <li>
                        Atur panel interaksi:
                        <br />&bull; <strong>Trigger:</strong> <code className="text-emerald-300">On click</code>
                        <br />&bull; <strong>Action:</strong> <code className="text-purple-300">Open overlay</code>
                        <br />&bull; <strong>Overlay setting:</strong> <code className="text-sky-300">Centered</code>, centang <em>"Close when clicking outside"</em> dan <em>"Add background behind overlay"</em> (Hitam 60%).
                      </li>
                    </ul>
                  </div>

                  {/* Step 2: Masuk sebagai Owner */}
                  <div className="p-3 bg-[#1E1E1E] rounded-lg border border-stone-700 space-y-1">
                    <span className="font-bold text-emerald-400 block">
                      2. Tombol "Masuk sebagai Owner" &rarr; Masuk ke Owner Dashboard
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-stone-300">
                      <li>Pilih tombol hijau <em>"Masuk sebagai Owner"</em> di Frame Portal.</li>
                      <li>Tarik panah interaksi ke Frame <strong>Owner Dashboard</strong>.</li>
                      <li>
                        Atur: <strong>Trigger:</strong> <code className="text-emerald-300">On click</code> &rarr; <strong>Action:</strong> <code className="text-purple-300">Navigate to</code> &rarr; Frame Owner Dashboard.
                      </li>
                    </ul>
                  </div>

                  {/* Step 3: Masuk sebagai Kasir */}
                  <div className="p-3 bg-[#1E1E1E] rounded-lg border border-stone-700 space-y-1">
                    <span className="font-bold text-sky-400 block">
                      3. Tab "Kasir" &amp; Tombol Masuk &rarr; Masuk ke Layar Kasir POS
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-stone-300">
                      <li>Pilih tombol tab / tombol Masuk Kasir di Frame Portal.</li>
                      <li>Tarik panah interaksi ke Frame <strong>Kasir / POS</strong>.</li>
                      <li>
                        Atur: <strong>Action:</strong> <code className="text-purple-300">Navigate to</code> &rarr; Frame Kasir / POS.
                      </li>
                    </ul>
                  </div>

                  {/* Step 4: Masuk sebagai Seller */}
                  <div className="p-3 bg-[#1E1E1E] rounded-lg border border-stone-700 space-y-1">
                    <span className="font-bold text-purple-400 block">
                      4. Tombol "Masuk sebagai Seller" &rarr; Masuk ke Portal Mitra Seller
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-stone-300">
                      <li>Pilih tombol Masuk Seller &rarr; Tarik panah ke Frame <strong>Portal Mitra Seller</strong> (<code className="text-purple-300">Navigate to</code>).</li>
                    </ul>
                  </div>

                  {/* Step 5: Bayar sekarang -> Struk */}
                  <div className="p-3 bg-[#1E1E1E] rounded-lg border border-stone-700 space-y-1">
                    <span className="font-bold text-emerald-400 block">
                      5. Tombol "Bayar sekarang" di POS &rarr; Buka Struk Transaksi
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-stone-300">
                      <li>Di Frame Kasir POS, pilih tombol <em>"Bayar sekarang"</em> di bawah keranjang.</li>
                      <li>Tarik panah ke Frame <strong>Modal Struk Transaksi POS</strong>.</li>
                      <li>
                        Atur: <strong>Action:</strong> <code className="text-purple-300">Open overlay</code> (Centered, centang <em>Close when clicking outside</em>).
                      </li>
                    </ul>
                  </div>

                  {/* Step 6: Jalankan Prototype */}
                  <div className="p-3 bg-emerald-950/60 rounded-lg border border-emerald-500/40 space-y-1 text-emerald-200">
                    <span className="font-bold block text-emerald-300">
                      ▶️ Cara Menjalankan Prototype Interaktif di Figma:
                    </span>
                    <p>
                      Tekan tombol <strong>Play (Present)</strong> di pojok kanan atas Figma atau tekan shortcut <kbd className="bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700 text-white font-mono">Ctrl + Alt + Enter</kbd> (Mac: <kbd className="bg-stone-800 px-1.5 py-0.5 rounded border border-stone-700 text-white font-mono">Cmd + Option + Enter</kbd>).
                    </p>
                    <p className="text-[11px] text-emerald-300/80">
                      Sekarang, setiap kali Anda mengklik tombol di layar Figma, tampilan akan berpindah dan membuka modal secara dinamis!
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-4 py-2 bg-[#047857] hover:bg-[#065F46] text-white text-xs font-semibold rounded"
              >
                Saya Mengerti, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
