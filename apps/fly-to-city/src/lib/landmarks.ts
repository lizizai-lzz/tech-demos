export type LandmarkPreset = {
  id: string
  nameEn: string
  nameZh: string
  subtitle: string
  lng: number
  lat: number
  extentM: number
}

export const LANDMARKS: LandmarkPreset[] = [
  {
    id: 'shanghai-lujiazui',
    nameEn: 'SHANGHAI',
    nameZh: '上海',
    subtitle: 'Lujiazui CBD - China',
    lng: 121.4998,
    lat: 31.2397,
    extentM: 1200,
  },
  {
    id: 'beijing-cbd',
    nameEn: 'BEIJING',
    nameZh: '北京',
    subtitle: 'Guomao CBD - China',
    lng: 116.459,
    lat: 39.909,
    extentM: 1200,
  },
  {
    id: 'hongkong-central',
    nameEn: 'HONG KONG',
    nameZh: '香港',
    subtitle: 'Central & Victoria Harbour - China',
    lng: 114.158,
    lat: 22.281,
    extentM: 1200,
  },
  {
    id: 'tokyo-shinjuku',
    nameEn: 'TOKYO',
    nameZh: '东京',
    subtitle: 'Shinjuku Station - Japan',
    lng: 139.7006,
    lat: 35.6896,
    extentM: 1200,
  },
  {
    id: 'singapore-marina-bay',
    nameEn: 'SINGAPORE',
    nameZh: '新加坡',
    subtitle: 'Marina Bay Sands - Singapore',
    lng: 103.859,
    lat: 1.283,
    extentM: 1200,
  },
  {
    id: 'sydney-opera',
    nameEn: 'SYDNEY',
    nameZh: '悉尼',
    subtitle: 'Opera House & The Rocks - Australia',
    lng: 151.2153,
    lat: -33.8568,
    extentM: 1200,
  },
  {
    id: 'nyc-midtown',
    nameEn: 'NEW YORK',
    nameZh: '纽约',
    subtitle: 'Midtown Manhattan - USA',
    lng: -73.981,
    lat: 40.754,
    extentM: 1200,
  },
  {
    id: 'paris-eiffel',
    nameEn: 'PARIS',
    nameZh: '巴黎',
    subtitle: 'Eiffel Tower & Champ de Mars - France',
    lng: 2.2945,
    lat: 48.8584,
    extentM: 1200,
  },
]

export function findLandmark(id: string) {
  return LANDMARKS.find((l) => l.id === id)
}
