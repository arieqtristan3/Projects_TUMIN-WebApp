/**
 * Curated product illustrations and sample pictures for Tino Underwear products.
 * High quality SVG illustrations tailored for underwear categories:
 * - CD Pria (Boxer, Briefs, Classic)
 * - CD Wanita (Lace, Seamless, Tummy Control)
 * - Anak-Anak (Boy cartoon, Girl Pastel Ruffle)
 * - Korset (4-Steel Bone Postpartum, Breathable 3-Hooks)
 */

export const getProductSampleImage = (category: string, sku: string): string => {
  // Pre-designed high fidelity vector visuals for each specific product
  if (sku === 'TU-CDP-01') {
    // Boxer Seamless Bamboo Men
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#F0FDF4"/>
        <circle cx="100" cy="100" r="76" fill="#DCFCE7"/>
        <!-- Boxer Illustration -->
        <path d="M52 64 C52 60 148 60 148 64 L144 135 C144 140 128 142 118 136 L108 124 C104 120 96 120 92 124 L82 136 C72 142 56 140 56 135 Z" fill="#047857" stroke="#065F46" stroke-width="3" stroke-linejoin="round"/>
        <!-- Elastic Waistband -->
        <path d="M52 64 C70 61 130 61 148 64 L147 76 C130 73 70 73 53 76 Z" fill="#065F46"/>
        <line x1="58" y1="70" x2="142" y2="70" stroke="#34D399" stroke-width="1.5" stroke-dasharray="3,3"/>
        <!-- Bamboo pattern stitches -->
        <path d="M100 82 L100 114" stroke="#A7F3D0" stroke-width="2" stroke-linecap="round" stroke-dasharray="4,3"/>
        <path d="M78 88 L78 122" stroke="#6EE7B7" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3,3"/>
        <path d="M122 88 L122 122" stroke="#6EE7B7" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3,3"/>
        <!-- Badge -->
        <rect x="24" y="160" width="152" height="22" rx="11" fill="#047857"/>
        <text x="100" y="175" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">BAMBOO SEAMLESS</text>
      </svg>
    `)}`;
  }

  if (sku === 'TU-CDP-02') {
    // Brief Katun Combed 30s Sporty (3 pcs)
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#F8FAFC"/>
        <circle cx="100" cy="100" r="76" fill="#E2E8F0"/>
        <!-- Brief Pack Tri-Color -->
        <path d="M60 74 C80 72 120 72 140 74 L134 116 C124 134 108 138 100 138 C92 138 76 134 66 116 Z" fill="#3B82F6" opacity="0.6"/>
        <path d="M56 68 C76 66 124 66 144 68 L138 112 C128 130 110 134 100 134 C90 134 72 130 62 112 Z" fill="#64748B" opacity="0.8"/>
        <path d="M52 60 C75 58 125 58 148 60 L140 108 C130 130 110 132 100 132 C90 132 70 130 60 108 Z" fill="#1E293B" stroke="#0F172A" stroke-width="2.5"/>
        <rect x="52" y="58" width="96" height="12" rx="3" fill="#0F172A"/>
        <text x="100" y="67" fill="#38BDF8" font-family="sans-serif" font-size="7" font-weight="bold" text-anchor="middle">SPORT 30s COMBED</text>
        <rect x="36" y="160" width="128" height="22" rx="11" fill="#1E293B"/>
        <text x="100" y="175" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">ISI 3 PCS PACK</text>
      </svg>
    `)}`;
  }

  if (sku === 'TU-CDP-03') {
    // CD Pria Segitiga Classic
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#F0FDFA"/>
        <circle cx="100" cy="100" r="76" fill="#CCFBF1"/>
        <!-- Classic Triangle Brief -->
        <path d="M52 64 C80 62 120 62 148 64 L138 110 C126 132 108 138 100 138 C92 138 74 132 62 110 Z" fill="#0D9488" stroke="#115E59" stroke-width="3"/>
        <rect x="52" y="62" width="96" height="12" rx="2" fill="#115E59"/>
        <line x1="56" y1="68" x2="144" y2="68" stroke="#5EEAD4" stroke-width="1.5"/>
        <path d="M100 74 L100 134" stroke="#5EEAD4" stroke-width="2" stroke-dasharray="3,3"/>
        <rect x="35" y="160" width="130" height="22" rx="11" fill="#0D9488"/>
        <text x="100" y="175" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">CLASSIC COMFORT</text>
      </svg>
    `)}`;
  }

  if (sku === 'TU-CDW-01') {
    // CD Wanita Katun Renda
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#FDF2F8"/>
        <circle cx="100" cy="100" r="76" fill="#FCE7F3"/>
        <!-- Women Brief with Lace -->
        <path d="M56 68 C80 65 120 65 144 68 L136 108 C124 130 110 136 100 136 C90 136 76 130 64 108 Z" fill="#F43F5E" stroke="#E11D48" stroke-width="2.5"/>
        <!-- Lace Pattern Scallops -->
        <path d="M54 68 Q60 62 66 68 Q72 62 78 68 Q84 62 90 68 Q96 62 102 68 Q108 62 114 68 Q120 62 126 68 Q132 62 138 68 Q144 62 146 68" stroke="#FFE4E6" stroke-width="3" fill="none"/>
        <!-- Ribbon Bow -->
        <circle cx="100" cy="74" r="3" fill="#FFFFFF"/>
        <path d="M96 74 C90 71 90 77 96 74 Z M104 74 C110 71 110 77 104 74 Z" fill="#FFFFFF"/>
        <rect x="35" y="160" width="130" height="22" rx="11" fill="#E11D48"/>
        <text x="100" y="175" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">RENDA BREATHABLE</text>
      </svg>
    `)}`;
  }

  if (sku === 'TU-CDW-02') {
    // CD Wanita Seamless Anti-Nyeplak Mid-Waist
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#FAF5FF"/>
        <circle cx="100" cy="100" r="76" fill="#F3E8FF"/>
        <!-- Seamless Mid-Waist -->
        <path d="M54 62 C80 60 120 60 146 62 L138 114 C126 134 110 138 100 138 C90 138 74 134 62 114 Z" fill="#9333EA" stroke="#7E22CE" stroke-width="2.5"/>
        <path d="M60 84 C85 88 115 88 140 84" stroke="#D8B4FE" stroke-width="2" stroke-linecap="round"/>
        <path d="M68 104 C88 108 112 108 132 104" stroke="#E9D5FF" stroke-width="1.5" stroke-linecap="round"/>
        <rect x="36" y="160" width="128" height="22" rx="11" fill="#7E22CE"/>
        <text x="100" y="175" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">SEAMLESS MID-WAIST</text>
      </svg>
    `)}`;
  }

  if (sku === 'TU-CDW-03') {
    // CD Wanita High-Waist Tummy Control Slim
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#FFF1F2"/>
        <circle cx="100" cy="100" r="76" fill="#FFE4E6"/>
        <!-- High Waist Tummy Control -->
        <path d="M56 46 C80 44 120 44 144 46 L140 108 C128 134 110 140 100 140 C90 140 72 134 60 108 Z" fill="#BE123C" stroke="#9F1239" stroke-width="2.5"/>
        <rect x="56" y="46" width="88" height="28" fill="#9F1239" opacity="0.6"/>
        <line x1="62" y1="58" x2="138" y2="58" stroke="#FDA4AF" stroke-width="1.5" stroke-dasharray="4,2"/>
        <line x1="62" y1="66" x2="138" y2="66" stroke="#FDA4AF" stroke-width="1.5" stroke-dasharray="4,2"/>
        <rect x="35" y="160" width="130" height="22" rx="11" fill="#BE123C"/>
        <text x="100" y="175" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">HIGH-WAIST SLIM</text>
      </svg>
    `)}`;
  }

  if (sku === 'TU-ANK-01') {
    // CD Anak Karakter
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#EFF6FF"/>
        <circle cx="100" cy="100" r="76" fill="#DBEAFE"/>
        <!-- Kids Brief -->
        <path d="M60 70 C80 68 120 68 140 70 L134 110 C124 126 110 132 100 132 C90 132 76 126 66 110 Z" fill="#0284C7" stroke="#0369A1" stroke-width="2.5"/>
        <rect x="60" y="70" width="80" height="10" fill="#38BDF8"/>
        <!-- Cartoon Dinosaur / Star Motif -->
        <circle cx="100" cy="98" r="14" fill="#FACC15"/>
        <circle cx="95" cy="95" r="2.5" fill="#1E293B"/>
        <circle cx="105" cy="95" r="2.5" fill="#1E293B"/>
        <path d="M96 102 Q100 106 104 102" stroke="#1E293B" stroke-width="1.5" fill="none"/>
        <rect x="36" y="160" width="128" height="22" rx="11" fill="#0284C7"/>
        <text x="100" y="175" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">KATUN ANAK KARAKTER</text>
      </svg>
    `)}`;
  }

  if (sku === 'TU-ANK-02') {
    // CD Anak Perempuan Pastel Ruffle
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#FFFBEB"/>
        <circle cx="100" cy="100" r="76" fill="#FEF3C7"/>
        <path d="M60 70 C80 68 120 68 140 70 L134 110 C124 128 110 132 100 132 C90 132 76 128 66 110 Z" fill="#F59E0B" stroke="#D97706" stroke-width="2.5"/>
        <path d="M58 70 Q64 64 70 70 Q76 64 82 70 Q88 64 94 70 Q100 64 106 70 Q112 64 118 70 Q124 64 130 70 Q136 64 142 70" stroke="#FDE68A" stroke-width="3" fill="none"/>
        <circle cx="100" cy="74" r="3" fill="#FFFFFF"/>
        <path d="M90 95 L110 95 M100 85 L100 105" stroke="#FDE68A" stroke-width="1.5"/>
        <rect x="36" y="160" width="128" height="22" rx="11" fill="#D97706"/>
        <text x="100" y="175" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">PASTEL RUFFLE PITA</text>
      </svg>
    `)}`;
  }

  if (sku === 'TU-KOR-01') {
    // Korset Pelangsing 4-Steel Bone Postpartum
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#F5F3FF"/>
        <circle cx="100" cy="100" r="76" fill="#EDE9FE"/>
        <!-- Corset Body Shape -->
        <path d="M60 48 L140 48 L132 88 L140 144 L60 144 L68 88 Z" fill="#6D28D9" stroke="#5B21B6" stroke-width="3"/>
        <!-- 4 Steel Bones -->
        <line x1="78" y1="54" x2="78" y2="138" stroke="#C4B5FD" stroke-width="3" stroke-linecap="round"/>
        <line x1="92" y1="54" x2="92" y2="138" stroke="#DDD6FE" stroke-width="3" stroke-linecap="round"/>
        <line x1="108" y1="54" x2="108" y2="138" stroke="#DDD6FE" stroke-width="3" stroke-linecap="round"/>
        <line x1="122" y1="54" x2="122" y2="138" stroke="#C4B5FD" stroke-width="3" stroke-linecap="round"/>
        <!-- Mesh Texture -->
        <line x1="64" y1="88" x2="136" y2="88" stroke="#A78BFA" stroke-width="2"/>
        <rect x="30" y="160" width="140" height="22" rx="11" fill="#6D28D9"/>
        <text x="100" y="175" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">4-STEEL BONE KORSET</text>
      </svg>
    `)}`;
  }

  if (sku === 'TU-KOR-02') {
    // Korset Pengecil Perut Breathable 3-Hooks
    return `data:image/svg+xml;utf8,${encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
        <rect width="200" height="200" rx="16" fill="#ECFDF5"/>
        <circle cx="100" cy="100" r="76" fill="#D1FAE5"/>
        <path d="M64 50 L136 50 L130 92 L136 142 L64 142 L70 92 Z" fill="#059669" stroke="#047857" stroke-width="3"/>
        <!-- 3 Rows of Hooks -->
        <g fill="#A7F3D0">
          <circle cx="86" cy="70" r="2.5"/><circle cx="96" cy="70" r="2.5"/><circle cx="106" cy="70" r="2.5"/>
          <circle cx="86" cy="85" r="2.5"/><circle cx="96" cy="85" r="2.5"/><circle cx="106" cy="85" r="2.5"/>
          <circle cx="86" cy="100" r="2.5"/><circle cx="96" cy="100" r="2.5"/><circle cx="106" cy="100" r="2.5"/>
          <circle cx="86" cy="115" r="2.5"/><circle cx="96" cy="115" r="2.5"/><circle cx="106" cy="115" r="2.5"/>
        </g>
        <rect x="30" y="160" width="140" height="22" rx="11" fill="#047857"/>
        <text x="100" y="175" fill="#FFFFFF" font-family="sans-serif" font-size="10" font-weight="bold" text-anchor="middle">3-HOOKS VENTILASI</text>
      </svg>
    `)}`;
  }

  // Fallback category representation
  const bg = category === 'Korset' ? '#EDE9FE' : category === 'CD Wanita' ? '#FCE7F3' : '#DCFCE7';
  const color = category === 'Korset' ? '#6D28D9' : category === 'CD Wanita' ? '#E11D48' : '#047857';
  return `data:image/svg+xml;utf8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
      <rect width="200" height="200" rx="16" fill="${bg}"/>
      <circle cx="100" cy="100" r="60" fill="#FFFFFF" stroke="${color}" stroke-width="3"/>
      <path d="M70 85 L130 85 L120 125 L100 135 L80 125 Z" fill="${color}"/>
      <text x="100" y="175" fill="${color}" font-family="sans-serif" font-size="11" font-weight="bold" text-anchor="middle">${category.toUpperCase()}</text>
    </svg>
  `)}`;
};
