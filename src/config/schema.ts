/**
 * Entity SEO Schema Graph
 *
 * Központi schema.org definíciók az egész oldalhoz.
 * A Layout.astro-ba injektálva globálisan.
 */

import { SITE_CONFIG } from './site';

const siteUrl = SITE_CONFIG.siteUrl;

export const organizationSchema = {
  '@type': ['Organization', 'LocalBusiness'],
  '@id': `${siteUrl}/#organization`,
  name: 'Trapezlemezes.hu',
  url: siteUrl,
  logo: `${siteUrl}/og-image.jpg`,
  foundingDate: '2016',
  description: 'Trapézlemez gyártás és értékesítés közvetlenül a gyártótól. T18 0.5mm – erősebb, mint máshol a 0.4mm.',
  telephone: SITE_CONFIG.phone,
  email: SITE_CONFIG.email,
  address: {
    '@type': 'PostalAddress',
    streetAddress: SITE_CONFIG.address.street,
    addressLocality: SITE_CONFIG.address.city,
    postalCode: SITE_CONFIG.address.postcode,
    addressCountry: 'HU',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '47.4285',
    longitude: '19.1554',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Hungary',
  },
  founder: {
    '@id': `${siteUrl}/#farkas-roland`,
  },
  employee: [
    { '@id': `${siteUrl}/#farkas-roland` },
    { '@id': `${siteUrl}/#peter-krisztian` },
  ],
  knowsAbout: [
    'trapézlemez gyártás',
    'tetőfedés',
    'acélszerkezetek',
    'trapézlemez szerelés',
    'kerítésépítés',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Trapézlemez termékek',
    itemListElement: [
      { '@id': `${siteUrl}/#product-t18-05` },
      { '@id': `${siteUrl}/#product-t18-06` },
    ],
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '17:00',
    },
  ],
};

export const farkasRolandSchema = {
  '@type': 'Person',
  '@id': `${siteUrl}/#farkas-roland`,
  name: 'Farkas Roland',
  jobTitle: 'Ügyvezető',
  alumniOf: {
    '@type': 'CollegeOrUniversity',
    name: 'Budapesti Műszaki Főiskola',
  },
  knowsAbout: [
    'trapézlemez',
    'tetőfedés',
    'acélszerkezetek',
    'gépészmérnöki számítások',
  ],
  worksFor: {
    '@id': `${siteUrl}/#organization`,
  },
};

export const peterKrisztianSchema = {
  '@type': 'Person',
  '@id': `${siteUrl}/#peter-krisztian`,
  name: 'Péter Krisztián Ádám',
  worksFor: {
    '@id': `${siteUrl}/#organization`,
  },
};

export const productT18_05Schema = {
  '@type': 'Product',
  '@id': `${siteUrl}/#product-t18-05`,
  name: 'T18 trapézlemez 0.5mm',
  description: 'T18 profil, 0.5mm vastagság, 20 év garancia. Erősebb, mint a versenytársak 0.4mm-es termékei.',
  material: 'acél',
  brand: {
    '@id': `${siteUrl}/#organization`,
  },
  manufacturer: {
    '@id': `${siteUrl}/#organization`,
  },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'HUF',
    price: '2640',
    unitCode: 'MTK',
    unitText: 'm²',
    availability: 'https://schema.org/InStock',
    priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    seller: {
      '@id': `${siteUrl}/#organization`,
    },
  },
  additionalProperty: [
    {
      '@type': 'PropertyValue',
      name: 'Vastagság',
      value: '0.5mm',
    },
    {
      '@type': 'PropertyValue',
      name: 'Profil',
      value: 'T18',
    },
    {
      '@type': 'PropertyValue',
      name: 'Garancia',
      value: '20 év',
    },
  ],
};

export const productT18_06Schema = {
  '@type': 'Product',
  '@id': `${siteUrl}/#product-t18-06`,
  name: 'T18 trapézlemez 0.6mm svéd acél',
  description: 'T18 profil, 0.6mm svéd acél, horganyzott, 20 év garancia. 20%-kal jobb minőségű alapanyag.',
  material: 'svéd acél',
  brand: {
    '@id': `${siteUrl}/#organization`,
  },
  manufacturer: {
    '@id': `${siteUrl}/#organization`,
  },
  offers: {
    '@type': 'Offer',
    priceCurrency: 'HUF',
    price: '2840',
    unitCode: 'MTK',
    unitText: 'm²',
    availability: 'https://schema.org/InStock',
    priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    seller: {
      '@id': `${siteUrl}/#organization`,
    },
  },
  additionalProperty: [
    {
      '@type': 'PropertyValue',
      name: 'Vastagság',
      value: '0.6mm',
    },
    {
      '@type': 'PropertyValue',
      name: 'Profil',
      value: 'T18',
    },
    {
      '@type': 'PropertyValue',
      name: 'Alapanyag',
      value: 'Svéd acél',
    },
  ],
};

/**
 * Teljes Entity Schema Graph
 * A Layout.astro <head>-be kerül
 */
export function getEntitySchemaGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationSchema,
      farkasRolandSchema,
      peterKrisztianSchema,
      productT18_05Schema,
      productT18_06Schema,
    ],
  };
}

/**
 * Product schema egy adott termékhez (termékoldalakhoz)
 */
export function getProductSchema(product: {
  name: string;
  description: string;
  price: number;
  sku?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: {
      '@type': 'Organization',
      name: 'Trapezlemezes.hu',
    },
    manufacturer: {
      '@id': `${siteUrl}/#organization`,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'HUF',
      price: String(product.price),
      unitCode: 'MTK',
      unitText: 'm²',
      availability: 'https://schema.org/InStock',
      seller: {
        '@id': `${siteUrl}/#organization`,
      },
    },
    ...(product.sku && { sku: product.sku }),
  };
}

/**
 * FAQ schema generátor
 */
export function getFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * BreadcrumbList schema generátor
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${siteUrl}${item.url}`,
    })),
  };
}
