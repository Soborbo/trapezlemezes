/**
 * UI Strings - i18n-ready
 *
 * Minden felhasználói felületi szöveg itt van definiálva.
 * Később könnyen bővíthető angol (en) kulcsokkal.
 */

export const strings = {
  // Navigation
  nav: {
    home: 'Főoldal',
    products: 'Trapézlemez',
    types: 'Típusok',
    roof: 'Tető útmutató',
    fence: 'Kerítés útmutató',
    calculator: 'Kalkulátor',
    cart: 'Kosár',
    about: 'Rólunk',
    contact: 'Kapcsolat',
    faq: 'GYIK',
    shipping: 'Szállítás',
  },

  // Cart
  cart: {
    title: 'Kosár',
    empty: 'A kosár üres',
    emptyDescription: 'Használja a kalkulátorunkat vagy adjon hozzá terméket közvetlenül!',
    addToCart: 'Kosárba',
    remove: 'Eltávolítás',
    total: 'Összesen',
    subtotal: 'Részösszeg',
    itemCount: '{count} tétel',
    goToCart: 'Kosár megtekintése',
    goToCheckout: 'Tovább a megrendeléshez',
    continueShopping: 'Vásárlás folytatása',
    useCalculator: 'Kalkulátor használata',
    shippingCost: 'Szállítási díj',
    screwsCost: 'Csavar költség',
    freeShipping: 'Ingyenes szállítás',
    freeShippingNote: '250 m² felett ingyenes a szállítás!',
  },

  // Order
  order: {
    title: 'Megrendelés',
    intentNotice: 'Ez szándéknyilatkozat',
    intentDescription: 'A végleges megrendelés csak telefonos egyeztetés után jön létre. Felhívjuk Önt 24 órán belül, és közösen véglegesítjük a részleteket.',
    intentShort: 'Ez szándéknyilatkozat, nem végleges megrendelés.',
    submit: 'Megrendelés leadása',
    submitting: 'Küldés...',
    summary: 'Rendelés összesítő',
    contactInfo: 'Kapcsolattartó adatok',
    shippingInfo: 'Szállítási adatok',
    notes: 'Megjegyzés',
    notesPlaceholder: 'Egyéb kérés, megjegyzés (opcionális)',
    gdprLabel: 'Elfogadom az adatkezelési tájékoztatót',
    success: {
      title: 'Megrendelési szándékát rögzítettük!',
      description: 'Köszönjük! 24 órán belül felhívjuk és egyeztetjük a részleteket.',
      orderNumber: 'Rendelésszám',
      nextSteps: 'Következő lépések',
      step1: 'Megrendelés rögzítve - email visszaigazolást küldtünk',
      step2: '24 órán belül felhívjuk és véglegesítjük a rendelést',
      step3: 'Gyártás és szállítás egyeztetett határidőre',
    },
  },

  // Quick order
  quickOrder: {
    title: 'Gyors rendelés',
    sqm: 'Terület (m²)',
    color: 'Szín',
    addToCart: 'Kosárba',
    orUseCalculator: 'vagy használja a',
    calculatorLink: 'részletes kalkulátorunkat',
  },

  // Product
  product: {
    pricePerSqm: 'Ft/m²',
    inStock: 'Raktáron',
    thickness: 'Vastagság',
    warranty: '20 év garancia',
    manufacturing: '48 óra gyártás',
    fromFactory: 'Közvetlenül a gyártótól',
  },

  // CTA
  cta: {
    calculator: 'Online árkalkulátor',
    calculatorShort: 'Kalkulátor',
    call: 'Hívjon most',
    quote: 'Kérek árajánlatot',
    order: 'Megrendelem',
    learnMore: 'Részletek',
  },

  // USP
  usp: {
    thickness: '0.5mm vastagság',
    thicknessDesc: 'Erősebb, mint máshol a 0.4mm',
    fast: '48 óra gyártás',
    fastDesc: 'Raktári anyagból, nem kell heteket várni',
    warranty: '20 év garancia',
    warrantyDesc: 'Szinte példa nélküli az iparágban',
    calculator: 'Online kalkulátor',
    calculatorDesc: 'Azonnali ár, nem kell telefonálni',
    shipping: 'Önköltségi szállítás',
    shippingDesc: 'Nem akarunk ezen nyerészkedni',
    swedish: 'Svéd acél 0.6mm',
    swedishDesc: '20% jobb anyag, felár nélkül',
  },

  // Trust signals
  trust: {
    engineer: 'Gépészmérnök vezette cég',
    experience: '10+ év tapasztalat',
    warranty: '20 év garancia',
    swedish: 'Svéd minőségű alapanyag',
    friendly: 'Tanult, kedves ügyfélszolgálat',
  },

  // Experience block
  experience: {
    prefix: '10 év tetőkészítői tapasztalatból:',
  },

  // Type comparison
  comparison: {
    type: 'Típus',
    thickness: 'Vastagság',
    shapeFactor: 'Alaktényező',
    bendingResistance: 'Hajlítási ellenállás',
    relativeStrength: 'Relatív erősség',
    price: 'Ár',
    warranty: 'Garancia',
    manufacturing: 'Gyártás',
    supportSpan: 'Max alátámasztás',
    purlinsFor6m: 'Szelemen (6m-re)',
    base: 'Alap',
    atUs: 'Nálunk',
    elsewhere: 'Máshol',
    eurocode: 'Számítás: Eurocode 3 (MSZ EN 1993-1-3) alapján, egyenletesen megoszló terhelésre.',
    verifiedBy: 'Farkas Roland, gépészmérnök (BMF) által ellenőrizve.',
  },

  // Common
  common: {
    phone: '+36 1 300-92-06',
    phoneFormatted: '+36 1 300-92-06',
    email: 'info@trapezlemezes.hu',
    backToHome: 'Vissza a főoldalra',
    readMore: 'Tovább olvasom',
    close: 'Bezárás',
  },

  // Footer sections
  footer: {
    products: 'Termékek',
    guides: 'Útmutatók',
    company: 'Cégünk',
    legal: 'Jogi',
  },

  // Form fields
  form: {
    firstName: 'Keresztnév',
    lastName: 'Vezetéknév',
    company: 'Cégnév (opcionális)',
    email: 'Email cím',
    phone: 'Telefonszám',
    postcode: 'Irányítószám',
    city: 'Település',
    street: 'Utca, házszám',
    required: 'Kötelező mező',
  },
} as const;

export type StringKeys = typeof strings;
