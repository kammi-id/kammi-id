export type BreadcrumbItem = { name: string; url: string }

export const buildWebSite = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'KAMMI.id',
  url: 'https://kammi.id',
  potentialAction: {
    '@type': 'SearchAction',
    target: 'https://kammi.id/berita?q={search_term_string}',
    'query-input': 'required name=search_term_string',
  },
})

export const buildOrganization = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Kesatuan Aksi Mahasiswa Muslim Indonesia',
  alternateName: 'KAMMI',
  url: 'https://kammi.id',
  logo: 'https://kammi.id/icon1.png',
  sameAs: [
    'https://twitter.com/KAMMIPusat',
    'https://www.instagram.com/kammi.pusat',
    'https://www.instagram.com/kammi.connect',
    'https://www.facebook.com/kammipusat.official',
    'https://www.youtube.com/@kammitv8247',
    'https://www.tiktok.com/@kammi.pusat',
  ],
})

export const buildBreadcrumb = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: `https://kammi.id${item.url}`,
  })),
})
