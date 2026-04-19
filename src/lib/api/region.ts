interface RegionItem {
  code: string;
  name: string;
}

const BASE_URL = 'https://api.co.id';

async function fetchRegionData<T>(endpoint: string): Promise<T> {
  const token = process.env.API_CO_ID_TOKEN;

  if (!token) {
    throw new Error('API_CO_ID_TOKEN is missing from environment variables');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'x-api-co-id': token,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Region API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const regionApi = {
  async getProvinces(): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>('/regional/indonesia/provinces');
  },

  async getCities(provinceCode: string): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>(`/regional/indonesia/provinces/${provinceCode}/regencies`);
  },

  async getDistricts(cityCode: string): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>(`/regional/indonesia/regencies/${cityCode}/districts`);
  },

  async getVillages(districtCode: string): Promise<RegionItem[]> {
    return fetchRegionData<RegionItem[]>(`/regional/indonesia/districts/${districtCode}/villages`);
  },
};
