/**
 * Calculator Configuration
 *
 * Ez a fájl tartalmazza a kalkulátor beállításait.
 * Itt módosíthatod a színeket, szállítási opciókat, admin email-t stb.
 */

// ============================================
// ADMIN BEÁLLÍTÁSOK
// ============================================

export const adminConfig = {
  /** Az email cím ahova az árajánlat kérések érkeznek */
  email: 'info@trapezlemezes.hu',

  /** Másolat email címek (BCC) */
  ccEmails: [] as string[],

  /** Cégnév az email aláírásban */
  companyName: 'Trapézlemez.hu',

  /** Telefonszám */
  phone: '+36 1 300-92-06',

  /** Válaszidő szöveg */
  responseTime: '24 órán belül',
};

// ============================================
// LEMEZ SPECIFIKÁCIÓK
// ============================================

export const sheetSpecs = {
  /** Lemez teljes szélessége (cm) */
  totalWidth: 116,

  /** Fedett szélesség (cm) - ez számít az árkalkulációnál */
  coverWidth: 110,

  /** Átfedés szélessége (cm) */
  overlapWidth: 6,

  /** Maximális lemezhossz (cm) */
  maxLength: 800,

  /** Minimális lemezhossz (cm) */
  minLength: 10,

  /** Lemezvastagság (mm) */
  thickness: 0.45,
};

// ============================================
// SZÍNEK
// ============================================

export interface ColorOption {
  /** Belső azonosító */
  id: string;
  /** Megjelenített név */
  label: string;
  /** RAL kód (opcionális) */
  ral?: string;
  /** Kép fájlnév a src/assets/images/ mappából */
  image: string;
  /** Szín típus - befolyásolja az árat */
  type: 'standard' | 'premium' | 'special';
  /** Elérhető-e jelenleg */
  available: boolean;
}

export const colors: ColorOption[] = [
  {
    id: 'antracit',
    label: 'Antracit',
    ral: 'RAL 7016',
    image: 'antracit-trapezlemez.jpg',
    type: 'standard',
    available: true,
  },
  {
    id: 'barna',
    label: 'Barna',
    ral: 'RAL 8017',
    image: 'barna-trapezlemez.jpg',
    type: 'standard',
    available: true,
  },
  {
    id: 'voros',
    label: 'Vörös',
    ral: 'RAL 3011',
    image: 'voros-trapezlemez.jpg',
    type: 'standard',
    available: true,
  },
  {
    id: 'kek',
    label: 'Kék',
    ral: 'RAL 5010',
    image: 'kek-trapezlemez.jpg',
    type: 'standard',
    available: true,
  },
  {
    id: 'feher',
    label: 'Fehér',
    ral: 'RAL 9002',
    image: 'feher-trapezlemez.jpg',
    type: 'standard',
    available: true,
  },
  {
    id: 'fekete',
    label: 'Fekete',
    ral: 'RAL 9005',
    image: 'fekete-trapezlemez.jpg',
    type: 'standard',
    available: true,
  },
  {
    id: 'narancs',
    label: 'Narancssárga',
    ral: 'RAL 2004',
    image: 'narancssarga-trapezlemez.jpg',
    type: 'standard',
    available: true,
  },
  {
    id: 'famintas',
    label: 'Famintás',
    image: 'famintas-trapezlemez.jpg',
    type: 'premium',
    available: true,
  },
  {
    id: 'horganyzott',
    label: 'Horganyzott natúr',
    image: 'horganyzott-trapezlemez.jpg',
    type: 'special',
    available: true,
  },
];

// ============================================
// SZÁLLÍTÁS
// ============================================

export interface ShippingOption {
  /** Belső azonosító */
  id: string;
  /** Megjelenített név */
  label: string;
  /** Leírás */
  description: string;
  /** Kép fájlnév */
  image: string;
  /** Szállítási idő szöveg */
  deliveryTime: string;
  /** Igényel-e szállítási címet */
  requiresAddress: boolean;
}

export const shippingOptions: ShippingOption[] = [
  {
    id: 'gazdasagos',
    label: 'Gazdaságos szállítás',
    description: 'Kedvező árú házhozszállítás',
    image: 'gazdasagos-szallitas.jpg',
    deliveryTime: '3-5 munkanap',
    requiresAddress: true,
  },
  {
    id: 'expressz',
    label: 'Expressz szállítás',
    description: 'Gyorsított kiszállítás',
    image: 'expressz-szallitas.jpg',
    deliveryTime: '1-2 munkanap',
    requiresAddress: true,
  },
  {
    id: 'sajat',
    label: 'Magam viszem el',
    description: 'Személyes átvétel telephelyünkön',
    image: 'sajat-szallitas.jpg',
    deliveryTime: 'Személyes átvétel',
    requiresAddress: false,
  },
];

// ============================================
// CSAVAR BEÁLLÍTÁSOK
// ============================================

export const screwConfig = {
  /** Csavarok egy dobozban */
  screwsPerBox: 250,

  /** Egy doboz hány m²-t fed le kb. */
  coveragePerBox: 25,

  /** Csavar termék neve */
  productName: 'EPDM gumis alátétes tetőcsavar',
};

// ============================================
// KALKULÁTOR UI BEÁLLÍTÁSOK
// ============================================

export const calculatorUI = {
  /** Auto-advance késleltetés ms-ben radio gomboknál */
  autoAdvanceDelay: 200,

  /** Maximálisan megadható különböző méretek száma */
  maxSizeRows: 8,

  /** LocalStorage kulcs */
  storageKey: 'trapez_calculator',

  /** Köszönő oldal URL */
  thankYouPage: '/koszonjuk',

  /** Adatkezelési tájékoztató URL */
  privacyPolicyUrl: '/adatkezelesi-tajekoztato',
};

// ============================================
// GTM/ANALYTICS ESEMÉNYEK
// ============================================

export const analyticsEvents = {
  /** Kalkulátor indítása */
  start: 'calculator_start',

  /** Lépés megtekintése */
  step: 'calculator_step',

  /** Opció kiválasztása */
  option: 'calculator_option',

  /** Form beküldése */
  submit: 'calculator_submit',

  /** Árajánlat értéke */
  value: 'calculator_value',
};

// ============================================
// LÉPÉSEK KONFIGURÁCIÓJA
// ============================================

export interface StepConfig {
  /** Lépés azonosító */
  id: string;
  /** Progress bar-ban megjelenő név */
  progressName: string;
  /** Progress bar szám (melyik főlépéshez tartozik) */
  progressNumber: number;
}

export const steps: StepConfig[] = [
  { id: '1', progressName: 'Méretek', progressNumber: 1 },
  { id: '2a', progressName: 'Méretek', progressNumber: 1 },
  { id: '2b', progressName: 'Méretek', progressNumber: 1 },
  { id: '2c', progressName: 'Méretek', progressNumber: 1 },
  { id: '2d', progressName: 'Méretek', progressNumber: 1 },
  { id: '2e', progressName: 'Méretek', progressNumber: 1 },
  { id: '3', progressName: 'Szín', progressNumber: 2 },
  { id: '4', progressName: 'Szállítás', progressNumber: 3 },
  { id: '5', progressName: 'Csavar', progressNumber: 4 },
  { id: '6', progressName: 'Kapcsolat', progressNumber: 5 },
];

// ============================================
// SOCIAL PROOF SZÖVEGEK
// ============================================

export const socialProof = {
  /** Fő szöveg */
  mainText: 'Több mint <strong>5000+ elégedett ügyfél</strong> választotta már trapézlemezeinket',

  /** Lépésenként változó szövegek (opcionális) */
  stepTexts: {
    '1': 'Több mint 5000+ elégedett ügyfél',
    '3': '15+ színválaszték készletről',
    '4': 'Országos kiszállítás 1-5 munkanap',
    '6': 'Gyors és precíz árajánlat 24 órán belül',
  } as Record<string, string>,
};
