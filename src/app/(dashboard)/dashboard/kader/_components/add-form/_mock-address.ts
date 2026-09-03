const MOCK_ADDRESS_DATA = {
  provinces: [
    { code: '11', name: 'DKI Jakarta' },
    { code: '32', name: 'Jawa Barat' },
    { code: '33', name: 'Jawa Tengah' },
    { code: '35', name: 'Jawa Timur' }
  ],
  cities: {
    '11': [
      { code: '1101', name: 'Jakarta Pusat' },
      { code: '1102', name: 'Jakarta Utara' },
      { code: '1103', name: 'Jakarta Barat' },
      { code: '1104', name: 'Jakarta Selatan' },
      { code: '1105', name: 'Jakarta Timur' }
    ],
    '32': [
      { code: '3201', name: 'Bogor' },
      { code: '3202', name: 'Bandung' },
      { code: '3203', name: 'Bekasi' }
    ],
    '33': [
      { code: '3301', name: 'Semarang' },
      { code: '3302', name: 'Solo' }
    ],
    '35': [
      { code: '3501', name: 'Surabaya' },
      { code: '3502', name: 'Malang' }
    ]
  },
  districts: {
    '1101': [
      { code: '110101', name: 'Gambir' },
      { code: '110102', name: 'Sawah Besar' }
    ],
    '1102': [
      { code: '110201', name: 'Koja' },
      { code: '110202', name: 'Kelapa Gading' }
    ]
  },
  subdistricts: {
    '110101': [
      { code: '11010101', name: 'Gambir' },
      { code: '11010102', name: 'Kebon Kelapa' }
    ],
    '110102': [
      { code: '11010201', name: 'Mangga Dua Selatan' },
      { code: '11010202', name: 'Mangga Dua Utara' }
    ]
  }
}

export default MOCK_ADDRESS_DATA
