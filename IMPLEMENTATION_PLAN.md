# Implementációs Terv - Trapezlemezes.hu SEO Átépítés

## Architekturális döntések

### 1. Kosár rendszer
- **LocalStorage-alapú** (nincs fizetés → nincs szerver-oldali kosár)
- Kosár tétel: `{ id, colorId, colorLabel, sqm, lengths[], pricePerSqm, totalPrice, screws?, source: 'calculator'|'quick' }`
- A kalkulátor outputja → kosár tételekké konvertálódik (nem lead-ként megy el)
- A megrendelés = szándéknyilatkozat (kontakt + szállítás → API → visszahívás)

### 2. i18n-ready felkészítés (angol tartalom nélkül)
- UI szövegek kiszervezése: `src/config/strings.ts` (hu kulcsokkal)
- URL routing felkészítve `/en/` prefixre (de oldalak nem készülnek)
- Layout: `lang` prop támogatás

### 3. Oldal sablonok (újrafelhasználható)
- `TypeReplacementLayout.astro` - T12/T14/T20/T25 "helyett" oldalakhoz
- A guide oldalak saját struktúrát kapnak (nincs közös layout, mert eltérőek)

### 4. Meglévő oldalak sorsa
- `/trapezlemez-arak/` → **301 redirect** `/trapezlemez/`-re (kannibalizáció elkerülés)
- `/trapezlemez-teto/` → marad, tartalom frissítés
- `/index.astro` → frissül (új navigáció, kosár, linkek)
- `/kalkulator/` → **NEM VÁLTOZIK** (de outputja kosárba kerül)
- `/ajanlat/` → marad (hash-es link továbbra is működik)
- `/koszonjuk/` → marad, kis módosítás (megrendelés utáni köszönjük is ide jön)

---

## Új komponensek

| Komponens | Leírás |
|-----------|--------|
| `CartStore.ts` | Kosár state management (localStorage + events) |
| `CartButton.astro` | Header kosár ikon + badge (darabszám) |
| `CartDrawer.astro` | Kosár előnézet (opcionális, vagy csak /kosar/ oldal) |
| `CartItem.astro` | Egy kosár tétel megjelenítése |
| `QuickOrder.astro` | Gyors "kosárba" form (m² + szín) termékoldalakra |
| `ComparisonTable.astro` | T-típus összehasonlító táblázat (újrafelhasználható) |
| `StrengthChart.astro` | Vizuális erősség sávdiagram (CSS-alapú) |
| `ExperienceBlock.astro` | E-E-A-T "10 év tapasztalatból" callout |
| `DecisionTree.astro` | Interaktív döntési fa (vanilla JS) |
| `ProductCard.astro` | Termék kártya a /trapezlemez/ oldalhoz |
| `TrustSignals.astro` | Bizalmi jelek blokk (garancia, mérnök, stb.) |
| `OrderNotice.astro` | "Ez szándéknyilatkozat" info doboz |
| `BreadcrumbNav.astro` | Breadcrumb navigáció (SEO) |

---

## Módosítandó komponensek

| Komponens | Változás |
|-----------|---------|
| `Header.astro` | + Kosár ikon, + bővebb navigáció (dropdown/mega menu) |
| `Footer.astro` | + Minden új oldal linkje, oszlopos elrendezés |
| `Layout.astro` | + breadcrumb slot, + Entity Schema Graph, + lang prop |
| `CtaBox.astro` | + kalkulátor CTA variáns hozzáadása |

---

## FÁZIS 1: Infrastruktúra + Core (legelső lépések)

### 1.1 Kosár rendszer
```
src/lib/cart.ts              ← Kosár store (add/remove/update/clear/getItems/getTotal)
src/components/CartButton.astro  ← Header ikon + badge
src/components/CartItem.astro    ← Tétel megjelenítés
src/components/QuickOrder.astro  ← Gyors rendelés form
src/components/OrderNotice.astro ← Szándéknyilatkozat info
```

**CartStore API:**
```typescript
interface CartItem {
  id: string              // unique id (crypto.randomUUID)
  colorId: string         // pl. 'antracit'
  colorLabel: string      // pl. 'Antracit RAL 7016'
  colorType: string       // 'standard'|'premium'|'special'|'promo'
  sqm: number             // m²
  lengths: { length: number, quantity: number }[]  // méretlista (opcionális)
  pricePerSqm: number     // Ft/m²
  totalPrice: number      // sqm × pricePerSqm
  withScrews: boolean     // csavar kell-e
  screwCost: number       // csavar ár
  source: 'calculator' | 'quick'  // honnan jött
}

// Műveletek
addItem(item: CartItem): void
removeItem(id: string): void
updateQuantity(id: string, sqm: number): void
getItems(): CartItem[]
getTotal(): { items: number, subtotal: number, screwTotal: number }
clear(): void
getItemCount(): number

// Események (CustomEvent-tel)
'cart:updated' → HeaderBadge frissítés
```

### 1.2 /trapezlemez/ - Fő termékoldal (MONEY PAGE)
```
src/pages/trapezlemez/index.astro
```

**Tartalom:**
1. Hero: "Trapézlemez gyártó – 0.5mm, ami erősebb mint máshol a 0.6mm"
2. USP sáv (4 elem: vastagság, 48 óra, 20 év, kalkulátor)
3. Termék szekció: minden szín kártyával + "Kosárba" gomb
4. Kalkulátor CTA (elsődleges, nagy)
5. Gyors rendelés opció (másodlagos)
6. Összehasonlító táblázat (T18 vs mások)
7. Trust jelek
8. FAQ szekció (FAQ schema)
9. Product Schema (JSON-LD)

**SEO:**
- Title: "Trapézlemez | T18 0.5mm – Erősebb, olcsóbb | Trapezlemezes.hu"
- H1: "Trapézlemez gyártótól – 0.5mm a 0.4mm áráért"
- Target: "trapézlemez", "trapézlemez ár", "trapézlemez vásárlás"

### 1.3 /kosar/ - Kosár oldal
```
src/pages/kosar.astro
```

**Tartalom:**
1. Kosár tételek listája (szerkeszthető m², törölhető)
2. Szállítás választó (gazdaságos/expressz/személyes)
3. Összesítő (részletezve: lemez + csavar + szállítás)
4. OrderNotice: "Ez szándéknyilatkozat – a végleges megrendelés csak telefonos egyeztetés után jön létre"
5. "Tovább a megrendeléshez" gomb
6. "Kalkulátor használata" link (ha üres a kosár)

### 1.4 /megrendeles/ - Megrendelés oldal
```
src/pages/megrendeles.astro
```

**Tartalom:**
1. Rendelés összesítő (kosárból)
2. Kapcsolattartó form: név, email, telefon, cég (opcionális)
3. Szállítási cím (ha nem személyes átvétel): irányítószám, város, utca
4. Megjegyzés mező
5. GDPR checkbox
6. OrderNotice megismételve
7. "Megrendelés leadása" gomb

**API:** `POST /api/order` (új endpoint)
- Validáció (Zod)
- Admin email küldés (rendelés részletekkel)
- Google Sheets sor hozzáadás
- Konverzió tracking (GTM + Meta)
- Redirect → /sikeres-megrendeles/

### 1.5 /sikeres-megrendeles/ - Megerősítő oldal
```
src/pages/sikeres-megrendeles.astro
```

- Hasonló a /koszonjuk/-höz de rendelés-specifikus
- "Megrendelési szándékát rögzítettük"
- "24 órán belül felhívjuk és egyeztetjük a részleteket"
- Rendelés szám megjelenítés

### 1.6 Navigáció frissítés

**Header** - Új menüpontok:
```
Termékek (/trapezlemez/)
Típusok (/trapezlemez-tipusok/)
Tető (/trapezlemez-teto/)
Kerítés (/trapezlemez-kerites/)
Kalkulátor (/kalkulator/)
[Kosár ikon + badge]
[Telefon]
```

**Footer** - Oszlopos elrendezés:
```
Termékek          Útmutatók           Cégünk              Jogi
─────────         ──────────          ──────              ────
Trapézlemez       Tető                Rólunk              ÁSZF
Típusok           Kerítés             Csapat              Szállítás
Kalkulátor        Szerelés            Referenciák         Visszárulés
Árlista           Alátámasztás        Vélemények          Adatkezelés
                  GYIK
                  Telepítési hibák
```

### 1.7 Entity Schema Graph
```
src/config/schema.ts   ← Központi schema definíciók
```
- Organization + Person (Farkas Roland) + Product (T18 0.5mm, T18 0.6mm)
- Layout.astro-ba injektálva globálisan

### 1.8 i18n előkészítés
```
src/config/strings.ts  ← Összes UI szöveg magyar kulcsokkal
```
- Gombok, címkék, hibaüzenetek
- Későbbi `/en/` verzióhoz könnyen bővíthető

### 1.9 Redirect beállítás
- `/trapezlemez-arak/` → 301 → `/trapezlemez/`

---

## FÁZIS 2: Típus-helyettesítő oldalak

### 2.1 Közös komponensek
```
src/components/ComparisonTable.astro   ← Típus összehasonlító táblázat (props-ból)
src/components/StrengthChart.astro     ← CSS sávdiagram
src/components/ExperienceBlock.astro   ← "10 év tapasztalatból" callout
src/components/TrustSignals.astro      ← Garancia, mérnök, stb. blokk
src/components/BreadcrumbNav.astro     ← Breadcrumb (SEO)
```

### 2.2 /t12-helyett-t18/ (Kerítés fókusz)
```
src/pages/t12-helyett-t18.astro
```
- Unique use case: kerítés, szélterhelés
- Unique FAQ: 3 kerítés-specifikus kérdés
- Unique insight: szélterhelés fontossága kerítésnél
- Belső link → /trapezlemez-kerites/
- ComparisonTable: T12 0.4mm vs T18 0.5mm
- StrengthChart vizualizáció
- Hátrány szekció (transzparencia)
- CTA: kalkulátor + gyors rendelés

### 2.3 /t14-helyett-t18/ (Garázs tető fókusz)
```
src/pages/t14-helyett-t18.astro
```
- Unique use case: garázs tető projekt költségkalkuláció
- Unique FAQ: 3 garázs-specifikus kérdés
- Unique insight: teljes projektköltség (lemez + szelemen + munka)
- Belső link → /trapezlemez-teto/
- 30m² garázs tető költségösszehasonlítás

### 2.4 /t20-helyett-t18/ (Alátámasztás kalkulátor)
```
src/pages/t20-helyett-t18.astro
```
- Unique use case: szelemen megtakarítás
- Unique FAQ: 3 alátámasztás-specifikus kérdés
- Unique insight: vastagság³ > bordamagasság
- Belső link → /trapezlemez-alatamastas/
- Szelemen kalkulátor táblázat

### 2.5 /t25-helyett-t18/ (Őszinte boundary)
```
src/pages/t25-helyett-t18.astro
```
- Unique use case: mikor kell TÉNYLEG T25 (és mi nem áruljuk)
- Unique FAQ: 3 ipari-specifikus kérdés
- Unique insight: lakossági vs ipari határ
- Belső link → /szerelesi-utmutato-profiknak/ (később)
- Transzparens: "mi nem árulunk T25-öt, és ez így van jól"

### 2.6 /trapezlemez-tipusok/ (Comparison Hub + Döntési fa)
```
src/pages/trapezlemez-tipusok.astro
```
- Interaktív döntési fa (vanilla JS)
  - Mire kell? → Tető/Kerítés/Fal/Ipari
  - Méret? → Lakossági/Ipari
  - → Eredmény: T18 nálunk VAGY "T25+, keress máshol"
- Teljes összehasonlító táblázat (minden típus)
- StrengthChart vizualizáció
- Deep link kalkulátorra minden ágból
- Link minden "helyett" oldalra
- Hub page: kétirányú linkek a type page-ekkel

### 2.7 Internal linking beállítás
```
TYPE PAGE-EK    ────→ /trapezlemez/ (money page, egyirányú)
TYPE PAGE-EK    ←───→ /trapezlemez-tipusok/ (hub, kétirányú)
/trapezlemez/   ────✗ NEM LINKEL type page-ekre (authority megőrzés)
```

---

## FÁZIS 3: E-E-A-T + Supporting oldalak

### 3.1 /rolunk/
```
src/pages/rolunk.astro
```
- Teljes történet (tetőkészítőként kezdték → saját gyártás → üzlet lett)
- Timeline vizualizáció
- Trust jelek összefoglaló
- Link → /csapat/

### 3.2 /csapat/
```
src/pages/csapat.astro
```
- Farkas Roland (ügyvezető, gépészmérnök, BMF)
- Péter Krisztián Ádám
- Person Schema mindkettőhöz

### 3.3 /trapezlemez-kerites/
```
src/pages/trapezlemez-kerites.astro
```
- Kerítés útmutató (hasonló struktúra mint /trapezlemez-teto/)
- Szélterhelés, rögzítés, anyagválasztás
- FAQ + Article + HowTo schema

### 3.4 /trapezlemez-szereles/
```
src/pages/trapezlemez-szereles.astro
```
- Általános szerelési útmutató
- Csavar típusok, távolságok
- HowTo schema

### 3.5 /trapezlemez-alatamastas/
```
src/pages/trapezlemez-alatamastas.astro
```
- Technikai oldal: alaktényező, Eurocode 3
- Szelemen távolság táblázatok
- Számítási módszer részletezés

### 3.6 /gyik/
```
src/pages/gyik.astro
```
- 30+ kérdés kategóriákba rendezve
- Termékek, Árak, Szállítás, Szerelés, Garancia
- Comprehensive FAQ schema

### 3.7 /szallitas/
```
src/pages/szallitas.astro
```
- 3 szállítási mód részletesen
- Díjtáblázat régiónként
- "Önköltségi áron szállítunk" messaging

### 3.8 /referenciak/
```
src/pages/referenciak.astro
```
- Projekt galériák (placeholder képekkel)
- Előtte/utána struktúra

### 3.9 /velemenyek/
```
src/pages/velemenyek.astro
```
- Google vélemények kiemelés
- Review schema

### 3.10 Jogi oldalak
```
src/pages/aszf.astro            ← Általános Szerződési Feltételek
src/pages/visszarules.astro     ← Visszárulési tájékoztató
```

---

## FÁZIS 4: Kalkulátor → Kosár integráció

Ez a legkényesebb rész, mert a kalkulátorhoz nem nyúlunk, de az outputját át kell irányítani.

**Megoldás:**
- A `/api/quote` API marad
- Az `/ajanlat/` oldal marad (hash-es link továbbra is működik)
- **ÚJ:** Az ajánlat oldalon megjelenik egy "Kosárba rakom" gomb
- A gomb a kalkulátor eredményt CartItem-mé konvertálja és hozzáadja a kosárhoz
- Így a kalkulátor KÓDJA nem változik, csak az ajánlat oldalon van egy új CTA

**Alternatíva (ha az ajánlat oldal módosítása nem elég):**
- A koszonjuk oldalon is lehet "Kosárba rakom" opció
- Vagy: localStorage-ból olvasott kalkulátor eredmény → kosár konverzió

---

## Sitemap frissítés

**Kizárt oldalak** (noindex):
- /koszonjuk
- /koszonjuk-az-erdeklodest
- /ajanlat
- /kosar
- /megrendeles
- /sikeres-megrendeles

**Új oldalak a sitemap-ben:**
- /trapezlemez/
- /t12-helyett-t18/
- /t14-helyett-t18/
- /t20-helyett-t18/
- /t25-helyett-t18/
- /trapezlemez-tipusok/
- /trapezlemez-kerites/
- /trapezlemez-szereles/
- /trapezlemez-alatamastas/
- /gyik/
- /szallitas/
- /rolunk/
- /csapat/
- /referenciak/
- /velemenyek/
- /aszf/
- /visszarules/

---

## Fájl struktúra összefoglaló (új + módosított)

```
src/
├── config/
│   ├── site.ts                    (MÓDOSÍTÁS: + schema data)
│   ├── schema.ts                  (ÚJ: Entity SEO schema graph)
│   └── strings.ts                 (ÚJ: i18n-ready UI szövegek)
│
├── lib/
│   └── cart.ts                    (ÚJ: kosár store)
│
├── components/
│   ├── Header.astro               (MÓDOSÍTÁS: + kosár, + nav)
│   ├── Footer.astro               (MÓDOSÍTÁS: + oszlopos, + linkek)
│   ├── CtaBox.astro               (MÓDOSÍTÁS: + kalkulátor variáns)
│   ├── CartButton.astro           (ÚJ)
│   ├── CartItem.astro             (ÚJ)
│   ├── QuickOrder.astro           (ÚJ)
│   ├── OrderNotice.astro          (ÚJ)
│   ├── ComparisonTable.astro      (ÚJ)
│   ├── StrengthChart.astro        (ÚJ)
│   ├── ExperienceBlock.astro      (ÚJ)
│   ├── TrustSignals.astro         (ÚJ)
│   ├── DecisionTree.astro         (ÚJ)
│   ├── ProductCard.astro          (ÚJ)
│   └── BreadcrumbNav.astro        (ÚJ)
│
├── pages/
│   ├── index.astro                (MÓDOSÍTÁS: nav + linkek frissítés)
│   ├── trapezlemez/
│   │   └── index.astro            (ÚJ: money page)
│   ├── kosar.astro                (ÚJ)
│   ├── megrendeles.astro          (ÚJ)
│   ├── sikeres-megrendeles.astro  (ÚJ)
│   ├── t12-helyett-t18.astro      (ÚJ)
│   ├── t14-helyett-t18.astro      (ÚJ)
│   ├── t20-helyett-t18.astro      (ÚJ)
│   ├── t25-helyett-t18.astro      (ÚJ)
│   ├── trapezlemez-tipusok.astro  (ÚJ)
│   ├── trapezlemez-kerites.astro  (ÚJ)
│   ├── trapezlemez-szereles.astro (ÚJ)
│   ├── trapezlemez-alatamastas.astro (ÚJ)
│   ├── gyik.astro                 (ÚJ)
│   ├── szallitas.astro            (ÚJ)
│   ├── rolunk.astro               (ÚJ)
│   ├── csapat.astro               (ÚJ)
│   ├── referenciak.astro          (ÚJ)
│   ├── velemenyek.astro           (ÚJ)
│   ├── aszf.astro                 (ÚJ)
│   ├── visszarules.astro          (ÚJ)
│   ├── trapezlemez-arak.astro     (MÓDOSÍTÁS: 301 redirect → /trapezlemez/)
│   ├── trapezlemez-teto.astro     (MÓDOSÍTÁS: tartalom frissítés)
│   ├── kalkulator.astro           (NEM VÁLTOZIK)
│   ├── ajanlat.astro              (MÓDOSÍTÁS: + "Kosárba" gomb)
│   ├── koszonjuk.astro            (MÓDOSÍTÁS: kis frissítés)
│   └── api/
│       ├── quote.ts               (NEM VÁLTOZIK)
│       ├── order.ts               (ÚJ: megrendelés API)
│       └── ...                    (többi marad)
│
├── layouts/
│   └── Layout.astro               (MÓDOSÍTÁS: + breadcrumb, + entity schema)
│
└── styles/
    └── global.css                 (MÓDOSÍTÁS: + új komponens stílusok)
```

---

## Összesítés

| Fázis | Új fájlok | Módosított fájlok | Becsült méret |
|-------|-----------|-------------------|---------------|
| 1. Infra + Core | ~12 | ~6 | Nagy |
| 2. Típus-helyettesítők | ~6 | ~1 | Közepes |
| 3. E-E-A-T + Supporting | ~11 | ~2 | Közepes |
| 4. Kalkulátor→Kosár | ~0 | ~2 | Kicsi |
| **Összesen** | **~29** | **~11** | |

---

## Implementációs sorrend (pontos)

1. `src/config/strings.ts` - i18n szövegek
2. `src/config/schema.ts` - Entity schema
3. `src/lib/cart.ts` - Kosár logika
4. `src/components/` - Összes új komponens
5. Header + Footer módosítás
6. Layout módosítás (breadcrumb, schema)
7. `/trapezlemez/` money page
8. `/kosar/` + `/megrendeles/` + `/sikeres-megrendeles/`
9. `/api/order` endpoint
10. `/ajanlat/` kosár gomb hozzáadás
11. Típus-helyettesítő oldalak (T12, T14, T20, T25)
12. `/trapezlemez-tipusok/` hub + döntési fa
13. E-E-A-T oldalak
14. Supporting oldalak
15. Jogi oldalak
16. `/trapezlemez-arak/` redirect
17. Sitemap frissítés
18. Internal linking audit
19. Build + teszt
