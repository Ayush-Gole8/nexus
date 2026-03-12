/**
 * Mumbai geographic data — accurate coastlines, roads, railways, and zones.
 * All coordinates are [lat, lng] pairs based on real-world Mumbai geography.
 */

// ─── MAIN MUMBAI ISLAND COASTLINE ──────────────────────────
export const MUMBAI_COAST: [number, number][] = [
  // West Coast (south → north)
  [18.893, 72.812],  // Colaba tip
  [18.900, 72.808],  // Navy Nagar
  [18.908, 72.810],  // Cuffe Parade west
  [18.918, 72.815],  // Back Bay south
  [18.928, 72.820],  // Nariman Point
  [18.938, 72.817],  // Marine Drive
  [18.948, 72.812],  // Girgaum Chowpatty
  [18.956, 72.797],  // Malabar Hill
  [18.963, 72.795],  // Hanging Gardens
  [18.970, 72.802],  // Breach Candy
  [18.978, 72.810],  // Mahalaxmi
  [18.985, 72.813],  // Haji Ali
  [18.995, 72.813],  // Worli Koliwada
  [19.005, 72.815],  // Worli Sea Face
  [19.013, 72.818],  // Prabhadevi
  [19.020, 72.832],  // Mahim Bay west
  [19.032, 72.840],  // Mahim causeway
  [19.042, 72.818],  // Bandra Bandstand
  [19.050, 72.818],  // Bandra West
  [19.058, 72.820],  // Carter Road
  [19.068, 72.823],  // Khar West
  [19.080, 72.826],  // Juhu Beach south
  [19.092, 72.827],  // Juhu
  [19.105, 72.823],  // Vile Parle West
  [19.118, 72.817],  // Andheri West
  [19.132, 72.812],  // Versova
  [19.148, 72.805],  // Madh Island
  [19.165, 72.800],  // Marve
  [19.180, 72.798],  // Manori
  [19.198, 72.803],  // Gorai
  [19.215, 72.800],  // Uttan
  [19.235, 72.832],  // Charkop
  [19.250, 72.840],  // Dahisar West
  [19.268, 72.848],  // Mira Road
  // North End
  [19.285, 72.858],  // Bhayander
  [19.290, 72.888],  // Bhayander East
  [19.280, 72.918],  // Kashimira
  // East Coast (north → south along Thane Creek)
  [19.260, 72.935],  // Ghodbunder
  [19.240, 72.948],  // Thane West
  [19.218, 72.958],  // Thane
  [19.200, 72.960],  // Thane Creek north
  [19.178, 72.958],  // Mulund West
  [19.160, 72.945],  // Mulund / Bhandup
  [19.140, 72.935],  // Nahur
  [19.125, 72.928],  // Bhandup / Kanjurmarg
  [19.110, 72.922],  // Vikhroli East
  [19.095, 72.918],  // LBS Marg / Powai
  [19.082, 72.912],  // Ghatkopar East
  [19.068, 72.905],  // Vidyavihar / Chembur
  [19.052, 72.918],  // Mankhurd
  [19.035, 72.928],  // Trombay north
  [19.015, 72.922],  // Trombay
  [19.002, 72.918],  // BARC / Trombay coast
  [18.992, 72.895],  // Mahul
  [18.985, 72.875],  // Sewri mudflats
  [18.978, 72.865],  // Wadala salt pans
  [18.968, 72.858],  // Wadala
  [18.958, 72.852],  // Mazgaon dockyard
  [18.945, 72.848],  // Mumbai Port
  [18.935, 72.842],  // Ballard Pier
  [18.922, 72.838],  // Fort East
  [18.912, 72.832],  // Gateway of India
  [18.903, 72.825],  // Colaba East
  [18.893, 72.812],  // Close → Colaba tip
];

// ─── NAVI MUMBAI LANDMASS ──────────────────────────────────
export const NAVI_MUMBAI_COAST: [number, number][] = [
  [19.160, 72.993],  // Airoli
  [19.140, 72.998],  // Rabale
  [19.118, 73.002],  // Ghansoli
  [19.098, 73.000],  // Kopar Khairane
  [19.078, 72.998],  // Vashi
  [19.060, 73.008],  // Sanpada
  [19.045, 73.020],  // Turbhe
  [19.030, 73.035],  // Belapur
  [19.015, 73.055],  // Kharghar
  [18.998, 73.075],  // Panvel
  [18.978, 73.060],  // Kalamboli
  [18.960, 73.040],  // Kamothe
  [18.945, 73.005],  // Nhava Sheva (JNPT)
  [18.935, 72.975],  // Uran
  [18.945, 72.955],  // Creek coast
  [18.960, 72.950],  // Elephanta direction
  [18.988, 72.948],  // Creek south
  [19.018, 72.950],  // Trans harbour east
  [19.050, 72.958],  // Creek mid
  [19.085, 72.968],  // Creek mid
  [19.120, 72.978],  // Creek north
  [19.145, 72.988],  // Airoli bridge
  [19.160, 72.993],  // Close
];

// ─── THANE CITY BOUNDARY (simplified) ─────────────────────
export const THANE_BOUNDARY: [number, number][] = [
  [19.200, 72.958],
  [19.215, 72.965],
  [19.225, 72.975],
  [19.230, 72.985],
  [19.225, 72.998],
  [19.210, 73.005],
  [19.200, 73.005],
  [19.190, 72.998],
  [19.185, 72.985],
  [19.190, 72.970],
  [19.200, 72.958],
];

// ─── MAJOR HIGHWAYS / ROADS ──────────────────────────────
export const WESTERN_EXPRESS_HWY: [number, number][] = [
  [18.972, 72.824],  // Mumbai Central
  [18.998, 72.830],  // Lower Parel
  [19.020, 72.836],  // Elphinstone
  [19.042, 72.840],  // Bandra
  [19.060, 72.842],  // Khar
  [19.080, 72.844],  // Santacruz
  [19.098, 72.847],  // Andheri
  [19.120, 72.850],  // Jogeshwari
  [19.145, 72.852],  // Goregaon
  [19.170, 72.850],  // Malad
  [19.195, 72.850],  // Kandivali
  [19.220, 72.852],  // Borivali
  [19.250, 72.855],  // Dahisar
];
export const EASTERN_EXPRESS_HWY: [number, number][] = [
  [18.940, 72.836],  // CSMT
  [18.970, 72.842],  // Byculla
  [19.000, 72.843],  // Parel
  [19.018, 72.845],  // Dadar
  [19.042, 72.855],  // Sion
  [19.065, 72.875],  // Kurla
  [19.087, 72.905],  // Ghatkopar
  [19.110, 72.920],  // Vikhroli
  [19.140, 72.935],  // Bhandup
  [19.160, 72.942],  // Mulund
  [19.186, 72.975],  // Thane
];
export const SCLR: [number, number][] = [
  [19.063, 72.840],
  [19.063, 72.862],
  [19.062, 72.882],
];
export const JVLR: [number, number][] = [
  [19.108, 72.848],
  [19.107, 72.870],
  [19.107, 72.895],
  [19.107, 72.920],
];
export const EASTERN_FREEWAY: [number, number][] = [
  [18.942, 72.840],
  [18.955, 72.852],
  [18.975, 72.862],
  [19.000, 72.868],
  [19.035, 72.882],
  [19.055, 72.898],
  [19.075, 72.905],
];
// Navi Mumbai Palm Beach Road
export const PALM_BEACH_ROAD: [number, number][] = [
  [19.078, 72.996],  // Vashi
  [19.060, 73.005],  // Sanpada
  [19.045, 73.012],  // Nerul
  [19.025, 73.018],  // Seawoods
  [19.005, 73.025],  // Belapur
];
// Sion-Panvel Highway
export const SION_PANVEL: [number, number][] = [
  [19.042, 72.860],  // Sion
  [19.028, 72.880],  // Govandi
  [19.010, 72.908],  // Chembur-Govandi
  [18.995, 72.940],  // Mankhurd
  [18.980, 72.958],  // Turbhe
  [18.990, 73.000],  // Panvel direction
];

// ─── BRIDGES & SEA LINKS ─────────────────────────────────
export const BWSL: [number, number][] = [
  [19.045, 72.820],  // Bandra end
  [19.035, 72.812],
  [19.025, 72.810],
  [19.013, 72.816],  // Worli end
];
export const ATAL_SETU: [number, number][] = [
  [19.005, 72.870],  // Sewri end
  [18.998, 72.895],
  [18.985, 72.920],
  [18.968, 72.940],
  [18.950, 72.952],  // JNPT end
];
export const VASHI_BRIDGE: [number, number][] = [
  [19.050, 72.920],  // Mankhurd
  [19.055, 72.940],
  [19.062, 72.960],
  [19.075, 72.990],  // Vashi
];
export const AIROLI_BRIDGE: [number, number][] = [
  [19.140, 72.940],  // Vikhroli / Rabale
  [19.142, 72.960],
  [19.148, 72.978],
  [19.152, 72.995],  // Airoli
];

// ─── RAILWAY LINES ───────────────────────────────────────
export const WESTERN_RAILWAY: [number, number][] = [
  [18.935, 72.827],  // Churchgate
  [18.945, 72.825],
  [18.958, 72.823],
  [18.970, 72.821],  // Mumbai Central
  [18.982, 72.826],
  [18.990, 72.830],
  [19.000, 72.835],
  [19.018, 72.842],  // Dadar WR
  [19.030, 72.842],
  [19.042, 72.840],  // Bandra
  [19.055, 72.840],
  [19.068, 72.840],
  [19.080, 72.842],
  [19.098, 72.845],  // Andheri
  [19.120, 72.847],
  [19.148, 72.850],
  [19.175, 72.850],
  [19.210, 72.852],  // Borivali
  [19.248, 72.855],  // Dahisar
];
export const CENTRAL_RAILWAY: [number, number][] = [
  [18.940, 72.836],  // CSMT
  [18.950, 72.838],
  [18.960, 72.840],
  [18.975, 72.842],
  [18.985, 72.843],
  [18.998, 72.843],
  [19.018, 72.843],  // Dadar CR
  [19.032, 72.848],
  [19.042, 72.855],  // Sion
  [19.055, 72.865],  // Kurla
  [19.072, 72.880],
  [19.087, 72.909],  // Ghatkopar
  [19.107, 72.920],
  [19.125, 72.930],
  [19.142, 72.937],
  [19.156, 72.942],  // Mulund
  [19.186, 72.975],  // Thane
];
export const HARBOUR_LINE: [number, number][] = [
  [18.940, 72.836],  // CSMT
  [18.952, 72.844],
  [18.963, 72.850],
  [18.975, 72.858],
  [18.985, 72.862],
  [18.998, 72.865],
  [19.012, 72.868],
  [19.032, 72.862],
  [19.042, 72.858],
  [19.052, 72.870],
  [19.058, 72.885],  // Chembur
  [19.060, 72.900],
  [19.052, 72.918],  // Mankhurd
  [19.055, 72.940],
  [19.065, 72.970],  // Vashi
  [19.050, 72.990],  // Sanpada
  [19.040, 73.020],  // Belapur
  [19.020, 73.050],
  [19.000, 73.070],  // Panvel
];
export const METRO_LINE_1: [number, number][] = [
  [19.133, 72.817],  // Versova
  [19.125, 72.825],
  [19.118, 72.837],
  [19.115, 72.847],  // Andheri
  [19.110, 72.860],
  [19.105, 72.875],
  [19.098, 72.890],
  [19.092, 72.900],
  [19.087, 72.909],  // Ghatkopar
];
// Navi Mumbai Metro (NMMT Line 1: Belapur–Pendhar)
export const NMMT_METRO: [number, number][] = [
  [19.018, 73.015],  // CB Seawoods
  [19.025, 73.028],  // Belapur
  [19.035, 73.042],
  [19.045, 73.052],
  [19.055, 73.060],  // Taloja
];

// ─── ZONE LABELS ─────────────────────────────────────────
export interface ZoneLabel {
  name: string;
  lat: number;
  lng: number;
  size?: number;
  color?: string;
  rotation?: number;
  bold?: boolean;
}

// Colors
const C_MUMBAI_BIG   = '#2a5a8a';   // large city/zone labels
const C_MUMBAI_MED   = '#1e4070';   // medium neighborhood labels
const C_MUMBAI_SMALL = '#163255';   // small sub-area labels
const C_NAVI_BIG     = '#2a6a5a';   // Navi Mumbai zones — teal tint
const C_NAVI_MED     = '#1e5045';
const C_NAVI_SMALL   = '#164035';   // small Navi Mumbai sub-area labels
const C_WATER        = '#0d2845';   // water body text
const C_BRIDGE       = '#1a3a5a';   // bridge/POI labels

export const ZONE_LABELS: ZoneLabel[] = [

  // ════════════════════════════════════════
  //  CITY TITLES
  // ════════════════════════════════════════
  { name: 'MUMBAI', lat: 19.080, lng: 72.845, size: 0.55, color: '#3a7ab0', bold: true },
  { name: 'NAVI MUMBAI', lat: 19.060, lng: 73.020, size: 0.40, color: '#3a9a7a', bold: true },
  { name: 'THANE', lat: 19.215, lng: 72.978, size: 0.35, color: '#5a7a9a', bold: true },

  // ════════════════════════════════════════
  //  MUMBAI — SOUTH (Island City)
  // ════════════════════════════════════════
  { name: 'COLABA', lat: 18.908, lng: 72.818, size: 0.22, color: C_MUMBAI_MED },
  { name: 'FORT', lat: 18.932, lng: 72.833, size: 0.22, color: C_MUMBAI_MED },
  { name: 'CHURCHGATE', lat: 18.935, lng: 72.825, size: 0.16, color: C_MUMBAI_SMALL },
  { name: 'NARIMAN PT', lat: 18.927, lng: 72.822, size: 0.16, color: C_MUMBAI_SMALL },
  { name: 'MARINE DR', lat: 18.943, lng: 72.822, size: 0.14, color: C_MUMBAI_SMALL, rotation: -0.55 },
  { name: 'MALABAR HILL', lat: 18.958, lng: 72.800, size: 0.18, color: C_MUMBAI_MED },
  { name: 'BREACH CANDY', lat: 18.971, lng: 72.803, size: 0.13, color: C_MUMBAI_SMALL },
  { name: 'BYCULLA', lat: 18.975, lng: 72.836, size: 0.18, color: C_MUMBAI_MED },
  { name: 'MAHALAXMI', lat: 18.982, lng: 72.820, size: 0.16, color: C_MUMBAI_MED },
  { name: 'WORLI', lat: 19.002, lng: 72.818, size: 0.22, color: C_MUMBAI_MED },
  { name: 'PRABHADEVI', lat: 19.016, lng: 72.827, size: 0.15, color: C_MUMBAI_SMALL },
  { name: 'DADAR', lat: 19.020, lng: 72.842, size: 0.24, color: C_MUMBAI_BIG },
  { name: 'SHIVAJI PARK', lat: 19.024, lng: 72.836, size: 0.13, color: C_MUMBAI_SMALL },
  { name: 'DHARAVI', lat: 19.042, lng: 72.856, size: 0.20, color: C_MUMBAI_MED },
  { name: 'SION', lat: 19.042, lng: 72.865, size: 0.18, color: C_MUMBAI_MED },
  { name: 'MAHIM', lat: 19.033, lng: 72.840, size: 0.20, color: C_MUMBAI_MED },

  // ════════════════════════════════════════
  //  MUMBAI — WESTERN SUBURBS
  // ════════════════════════════════════════
  { name: 'BANDRA', lat: 19.055, lng: 72.830, size: 0.28, color: C_MUMBAI_BIG },
  { name: 'BKC', lat: 19.062, lng: 72.862, size: 0.22, color: C_MUMBAI_MED },
  { name: 'KHAR', lat: 19.068, lng: 72.834, size: 0.16, color: C_MUMBAI_SMALL },
  { name: 'SANTACRUZ', lat: 19.080, lng: 72.838, size: 0.18, color: C_MUMBAI_MED },
  { name: 'VILE PARLE', lat: 19.098, lng: 72.840, size: 0.18, color: C_MUMBAI_MED },
  { name: 'JUHU', lat: 19.092, lng: 72.828, size: 0.18, color: C_MUMBAI_MED },
  { name: 'ANDHERI', lat: 19.116, lng: 72.846, size: 0.28, color: C_MUMBAI_BIG },
  { name: 'VERSOVA', lat: 19.133, lng: 72.814, size: 0.15, color: C_MUMBAI_SMALL },
  { name: 'LOKHANDWALA', lat: 19.128, lng: 72.828, size: 0.13, color: C_MUMBAI_SMALL },
  { name: 'GOREGAON', lat: 19.154, lng: 72.848, size: 0.22, color: C_MUMBAI_BIG },
  { name: 'MALAD', lat: 19.188, lng: 72.845, size: 0.22, color: C_MUMBAI_BIG },
  { name: 'KANDIVALI', lat: 19.205, lng: 72.848, size: 0.20, color: C_MUMBAI_MED },
  { name: 'BORIVALI', lat: 19.228, lng: 72.850, size: 0.24, color: C_MUMBAI_BIG },
  { name: 'DAHISAR', lat: 19.252, lng: 72.854, size: 0.18, color: C_MUMBAI_MED },

  // ════════════════════════════════════════
  //  MUMBAI — EASTERN SUBURBS
  // ════════════════════════════════════════
  { name: 'KURLA', lat: 19.070, lng: 72.878, size: 0.22, color: C_MUMBAI_MED },
  { name: 'CHEMBUR', lat: 19.060, lng: 72.898, size: 0.22, color: C_MUMBAI_MED },
  { name: 'TROMBAY', lat: 19.018, lng: 72.912, size: 0.18, color: C_MUMBAI_MED },
  { name: 'GHATKOPAR', lat: 19.087, lng: 72.908, size: 0.24, color: C_MUMBAI_BIG },
  { name: 'VIKHROLI', lat: 19.113, lng: 72.924, size: 0.18, color: C_MUMBAI_MED },
  { name: 'POWAI', lat: 19.120, lng: 72.905, size: 0.22, color: C_MUMBAI_MED },
  { name: 'KANJURMARG', lat: 19.125, lng: 72.933, size: 0.15, color: C_MUMBAI_SMALL },
  { name: 'BHANDUP', lat: 19.144, lng: 72.938, size: 0.18, color: C_MUMBAI_MED },
  { name: 'MULUND', lat: 19.170, lng: 72.952, size: 0.22, color: C_MUMBAI_BIG },
  { name: 'SEWRI', lat: 18.990, lng: 72.868, size: 0.14, color: C_MUMBAI_SMALL },
  { name: 'WADALA', lat: 18.978, lng: 72.858, size: 0.16, color: C_MUMBAI_SMALL },
  { name: 'GOVANDI', lat: 19.030, lng: 72.888, size: 0.14, color: C_MUMBAI_SMALL },
  { name: 'MANKHURD', lat: 19.052, lng: 72.918, size: 0.15, color: C_MUMBAI_SMALL },

  // ════════════════════════════════════════
  //  NAVI MUMBAI ZONES
  // ════════════════════════════════════════
  { name: 'AIROLI', lat: 19.155, lng: 72.996, size: 0.22, color: C_NAVI_MED },
  { name: 'GHANSOLI', lat: 19.118, lng: 73.002, size: 0.18, color: C_NAVI_MED },
  { name: 'RABALE', lat: 19.140, lng: 72.998, size: 0.16, color: C_NAVI_MED },
  { name: 'KOPAR KHAIRANE', lat: 19.098, lng: 73.002, size: 0.16, color: C_NAVI_SMALL },
  { name: 'VASHI', lat: 19.078, lng: 73.002, size: 0.28, color: C_NAVI_BIG },
  { name: 'SANPADA', lat: 19.062, lng: 73.010, size: 0.18, color: C_NAVI_MED },
  { name: 'NERUL', lat: 19.042, lng: 73.015, size: 0.22, color: C_NAVI_MED },
  { name: 'SEAWOODS', lat: 19.025, lng: 73.022, size: 0.16, color: C_NAVI_SMALL },
  { name: 'BELAPUR', lat: 19.014, lng: 73.040, size: 0.24, color: C_NAVI_BIG },
  { name: 'KHARGHAR', lat: 19.042, lng: 73.058, size: 0.22, color: C_NAVI_MED },
  { name: 'KAMOTHE', lat: 18.992, lng: 73.062, size: 0.18, color: C_NAVI_MED },
  { name: 'KALAMBOLI', lat: 18.978, lng: 73.060, size: 0.18, color: C_NAVI_MED },
  { name: 'PANVEL', lat: 18.998, lng: 73.080, size: 0.26, color: C_NAVI_BIG },
  { name: 'TALOJA', lat: 18.978, lng: 73.080, size: 0.16, color: C_NAVI_SMALL },
  { name: 'ULWE', lat: 18.960, lng: 73.018, size: 0.18, color: C_NAVI_MED },
  { name: 'TURBHE', lat: 19.045, lng: 73.024, size: 0.18, color: C_NAVI_MED },
  { name: 'NHAVA SHEVA', lat: 18.948, lng: 72.975, size: 0.18, color: C_NAVI_MED },

  // ════════════════════════════════════════
  //  THANE ZONES
  // ════════════════════════════════════════
  { name: 'THANE WEST', lat: 19.200, lng: 72.962, size: 0.18, color: '#4a6a8a' },
  { name: 'THANE EAST', lat: 19.205, lng: 72.985, size: 0.18, color: '#4a6a8a' },
  { name: 'GHODBUNDER', lat: 19.255, lng: 72.948, size: 0.15, color: '#3a5a7a' },
  { name: 'WAGLE ESTATE', lat: 19.195, lng: 72.970, size: 0.14, color: '#3a5a7a' },
  { name: 'KOPRI', lat: 19.190, lng: 72.980, size: 0.13, color: '#3a5a7a' },

  // ════════════════════════════════════════
  //  WATER BODIES
  // ════════════════════════════════════════
  { name: 'A R A B I A N   S E A', lat: 19.060, lng: 72.755, size: 0.45, color: C_WATER, rotation: -1.1 },
  { name: 'T H A N E   C R E E K', lat: 19.095, lng: 72.960, size: 0.20, color: C_WATER, rotation: -1.05 },
  { name: 'MUMBAI  HARBOUR', lat: 18.970, lng: 72.893, size: 0.22, color: C_WATER },
  { name: 'BACK BAY', lat: 18.932, lng: 72.810, size: 0.14, color: C_WATER },
  { name: 'MAHIM BAY', lat: 19.035, lng: 72.825, size: 0.12, color: C_WATER },

  // ════════════════════════════════════════
  //  POI / BRIDGE LABELS
  // ════════════════════════════════════════
  { name: 'BANDRA-WORLI SEA LINK', lat: 19.030, lng: 72.812, size: 0.10, color: C_BRIDGE, rotation: 1.0 },
  { name: 'ATAL SETU (MTHL)', lat: 18.978, lng: 72.910, size: 0.11, color: C_BRIDGE, rotation: -0.5 },
  { name: 'CSMT', lat: 18.940, lng: 72.836, size: 0.12, color: C_BRIDGE },
  { name: 'BKC BANDRA-KURLA', lat: 19.062, lng: 72.865, size: 0.11, color: C_BRIDGE },
  { name: 'AIRPORT (CSIA)', lat: 19.090, lng: 72.868, size: 0.13, color: C_BRIDGE },
  { name: 'JNPT', lat: 18.950, lng: 72.958, size: 0.13, color: C_BRIDGE },
  { name: 'BARC', lat: 19.005, lng: 72.915, size: 0.12, color: '#3a2a5a' },
];

// ─── MAJOR LANDMARKS ─────────────────────────────────────
export interface LandmarkDot {
  name: string; lat: number; lng: number; color: string;
}
export const LANDMARKS: LandmarkDot[] = [
  { name: 'Gateway of India', lat: 18.922, lng: 72.835, color: '#3a5a7a' },
  { name: 'CSMT', lat: 18.940, lng: 72.836, color: '#3a5a7a' },
  { name: 'Haji Ali', lat: 18.983, lng: 72.813, color: '#3a5a7a' },
  { name: 'Siddhivinayak', lat: 19.016, lng: 72.832, color: '#3a5a7a' },
  { name: 'BARC', lat: 19.005, lng: 72.915, color: '#4a3a7a' },
  { name: 'JNPT', lat: 18.950, lng: 72.958, color: '#3a5a6a' },
];

// ─── WARD / SUB-ZONE DIVIDERS ──────────────────────────────
export const WARD_DIVIDERS: [number, number][][] = [
  // Mahim Creek / Mithi River
  [[19.030, 72.838], [19.035, 72.850], [19.040, 72.858], [19.042, 72.870]],
  // Sion boundary
  [[19.040, 72.838], [19.042, 72.860], [19.043, 72.870], [19.042, 72.880]],
  // Jogeshwari-Vikhroli Link Road
  [[19.108, 72.845], [19.107, 72.870], [19.107, 72.900], [19.108, 72.928]],
  // Thane Creek (rough divider)
  [[19.160, 72.942], [19.140, 72.950], [19.110, 72.960], [19.080, 72.968], [19.052, 72.958]],
];
