/**
 * Utility for generating authentic mobile banking transfer receipt sample
 */

export const SAMPLE_TRANSFER_RECEIPT_SVG = (amount: number, invoiceNum: string = '#INV-20261007-001') => {
  const formattedAmount = `Rp ${amount.toLocaleString('id-ID')}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="560" viewBox="0 0 400 560" fill="none">
    <rect width="400" height="560" rx="16" fill="#F8FAFC"/>
    
    <!-- Header m-Banking -->
    <rect width="400" height="85" fill="#003D79" rx="16"/>
    <rect y="70" width="400" height="15" fill="#003D79"/>
    
    <text x="30" y="38" fill="#FFFFFF" font-family="Arial, sans-serif" font-size="18" font-weight="bold">BCA mobile</text>
    <text x="30" y="58" fill="#93C5FD" font-family="Arial, sans-serif" font-size="11">BUKTI TRANSFER DANA - BERHASIL</text>
    <circle cx="355" cy="42" r="14" fill="#10B981"/>
    <path d="M349 42 L353 46 L361 38" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Receipt Card Body -->
    <g transform="translate(20, 100)">
      <rect width="360" height="430" rx="12" fill="#FFFFFF" stroke="#E2E8F0" stroke-width="1"/>
      
      <!-- Amount Badge -->
      <text x="25" y="40" fill="#64748B" font-family="Arial, sans-serif" font-size="11">JUMLAH TRANSFER</text>
      <text x="25" y="70" fill="#003D79" font-family="Arial, sans-serif" font-size="24" font-weight="bold">${formattedAmount}</text>
      <line x1="25" y1="90" x2="335" y2="90" stroke="#F1F5F9" stroke-width="2"/>

      <!-- Details -->
      <text x="25" y="120" fill="#64748B" font-family="Arial, sans-serif" font-size="11">TANGGAL &amp; WAKTU</text>
      <text x="25" y="138" fill="#1E293B" font-family="Arial, sans-serif" font-size="13" font-weight="600">07 Okt 2026, 09:10:44 WIB</text>

      <text x="25" y="175" fill="#64748B" font-family="Arial, sans-serif" font-size="11">REKENING TUJUAN (OWNER)</text>
      <text x="25" y="193" fill="#1E293B" font-family="Arial, sans-serif" font-size="14" font-weight="bold">521-089-2234</text>
      <text x="25" y="210" fill="#047857" font-family="Arial, sans-serif" font-size="12" font-weight="600">TINO (TINO UNDERWEAR OWNER)</text>
      <text x="25" y="226" fill="#64748B" font-family="Arial, sans-serif" font-size="11">BANK CENTRAL ASIA (BCA)</text>

      <line x1="25" y1="245" x2="335" y2="245" stroke="#F1F5F9" stroke-width="2"/>

      <text x="25" y="275" fill="#64748B" font-family="Arial, sans-serif" font-size="11">REKENING PENGIRIM</text>
      <text x="25" y="293" fill="#1E293B" font-family="Arial, sans-serif" font-size="13">882-019-4412 / HENDRA</text>

      <text x="25" y="330" fill="#64748B" font-family="Arial, sans-serif" font-size="11">REFERENSI TRANSAKSI / FAKTUR</text>
      <text x="25" y="348" fill="#003D79" font-family="monospace" font-size="12" font-weight="bold">${invoiceNum}</text>

      <rect x="25" y="375" width="310" height="36" rx="6" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="1"/>
      <text x="35" y="398" fill="#166534" font-family="Arial, sans-serif" font-size="11" font-weight="600">✓ Transaksi Terverifikasi di Mutasi Bank</text>
    </g>
  </svg>`;
  
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
