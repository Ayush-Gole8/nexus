import mongoose from 'mongoose';
import dotenv from 'dotenv';
import InfrastructureNode from '../models/InfrastructureNode';
import Dependency from '../models/Dependency';
import Scenario from '../models/Scenario';
import User from '../models/User';
import WeatherEvent from '../models/WeatherEvent';
import Alert from '../models/Alert';

dotenv.config();

interface SeedNode {
  name: string;
  type: 'power' | 'water' | 'transport' | 'telecom' | 'emergency';
  subtype: string;
  location: { lat: number; lng: number };
  status: 'operational' | 'degraded' | 'failed';
  capacity: number;
  currentLoad: number;
  criticalityScore: number;
  properties: Record<string, any>;
}

// ============================================================
// NODE INDEX MAP (for dependency authoring reference)
// ============================================================
// POWER       : 0–19   (20 nodes)
// WATER       : 20–33  (14 nodes)
// TRANSPORT   : 34–56  (23 nodes)
// TELECOM     : 57–71  (15 nodes)
// EMERGENCY   : 72–89  (18 nodes)
// TOTAL       : 90 nodes
// ============================================================

const seedNodes: SeedNode[] = [

  // ============================================================
  // POWER — indices 0–19
  // Operators: Tata Power, Adani Electricity, BEST, MSETCL, CESC
  // ============================================================

  // ── Generation ─────────────────────────────────────────────

  // 0
  {
    name: 'Trombay Thermal Power Station',
    type: 'power', subtype: 'power_plant',
    location: { lat: 19.0030, lng: 72.9140 },
    status: 'operational', capacity: 500, currentLoad: 420, criticalityScore: 97,
    properties: {
      fuelType: 'coal_gas', outputMW: 1580, units: 8, operator: 'Tata Power',
      note: "India's largest municipal thermal station; 8 units; primary feed for South & Central Mumbai grid",
    },
  },

  // 1
  {
    name: 'Dahanu Thermal Power Station',
    type: 'power', subtype: 'power_plant',
    location: { lat: 19.9660, lng: 72.7370 },
    status: 'operational', capacity: 400, currentLoad: 340, criticalityScore: 92,
    properties: {
      fuelType: 'coal', outputMW: 500, operator: 'Adani Electricity',
      note: 'Primary bulk-generation source for Adani Electricity Western Suburbs network',
    },
  },

  // 2
  {
    name: 'Uran Combined Cycle Gas Plant',
    type: 'power', subtype: 'power_plant',
    location: { lat: 18.8900, lng: 73.0000 },
    status: 'operational', capacity: 200, currentLoad: 150, criticalityScore: 75,
    properties: {
      fuelType: 'natural_gas', outputMW: 672, operator: 'MSEDCL / CESC',
      note: 'Navi Mumbai gas peaker; feeds MSEDCL grid during peak-demand hours',
    },
  },

  // ── 220kV / 400kV Substations ──────────────────────────────

  // 3
  {
    name: 'Dharavi 220kV Substation',
    type: 'power', subtype: 'substation',
    location: { lat: 19.0430, lng: 72.8550 },
    status: 'operational', capacity: 120, currentLoad: 105, criticalityScore: 93,
    properties: {
      voltage: '220kV', operator: 'BEST',
      note: 'Central pivot for South & Central Mumbai; single failure cascades to hospitals, police, EOC',
    },
  },

  // 4
  {
    name: 'Salsette 220kV Substation',
    type: 'power', subtype: 'substation',
    location: { lat: 19.1200, lng: 72.8500 },
    status: 'operational', capacity: 110, currentLoad: 88, criticalityScore: 85,
    properties: { voltage: '220kV', operator: 'Adani Electricity' },
  },

  // 5
  {
    name: 'Aarey Colony 400kV Substation',
    type: 'power', subtype: 'substation',
    location: { lat: 19.1520, lng: 72.8710 },
    status: 'operational', capacity: 150, currentLoad: 125, criticalityScore: 90,
    properties: {
      voltage: '400kV', operator: 'MSETCL',
      note: 'Receives bulk power from Kalwa; primary feed for Bhandup WTP (Asia\'s largest)',
    },
  },

  // 6
  {
    name: 'Borivali 110kV Substation',
    type: 'power', subtype: 'substation',
    location: { lat: 19.2290, lng: 72.8560 },
    status: 'operational', capacity: 80, currentLoad: 65, criticalityScore: 72,
    properties: { voltage: '110kV', operator: 'Adani Electricity' },
  },

  // 7
  {
    name: 'Vikhroli 220kV Substation',
    type: 'power', subtype: 'substation',
    location: { lat: 19.1070, lng: 72.9220 },
    status: 'operational', capacity: 100, currentLoad: 82, criticalityScore: 80,
    properties: {
      voltage: '220kV', operator: 'MSETCL',
      note: 'Feeds Kurla–Ghatkopar industrial and dense residential corridor',
    },
  },

  // 8
  {
    name: 'Chembur 110kV Substation',
    type: 'power', subtype: 'substation',
    location: { lat: 19.0614, lng: 72.8990 },
    status: 'operational', capacity: 90, currentLoad: 74, criticalityScore: 76,
    properties: { voltage: '110kV', operator: 'Tata Power' },
  },

  // ── Distribution Hubs ───────────────────────────────────────

  // 9
  {
    name: 'Colaba Distribution Hub',
    type: 'power', subtype: 'distribution',
    location: { lat: 18.9067, lng: 72.8147 },
    status: 'operational', capacity: 60, currentLoad: 52, criticalityScore: 83,
    properties: { operator: 'BEST', zone: 'South Mumbai (Colaba–Churchgate)' },
  },

  // 10
  {
    name: 'BKC Commercial Grid',
    type: 'power', subtype: 'distribution',
    location: { lat: 19.0596, lng: 72.8656 },
    status: 'operational', capacity: 80, currentLoad: 72, criticalityScore: 86,
    properties: {
      operator: 'Tata Power', zone: 'BKC–Bandra',
      note: 'Feeds Mumbai\'s financial district; highest commercial load density in city',
    },
  },

  // 11
  {
    name: 'Andheri Distribution Hub',
    type: 'power', subtype: 'distribution',
    location: { lat: 19.1136, lng: 72.8697 },
    status: 'operational', capacity: 70, currentLoad: 58, criticalityScore: 73,
    properties: { operator: 'Adani Electricity', zone: 'Andheri–Jogeshwari' },
  },

  // 12
  {
    name: 'Powai Distribution Hub',
    type: 'power', subtype: 'distribution',
    location: { lat: 19.1176, lng: 72.9060 },
    status: 'operational', capacity: 55, currentLoad: 48, criticalityScore: 71,
    properties: { operator: 'Tata Power', zone: 'Powai–Vikhroli tech corridor' },
  },

  // 13
  {
    name: 'Kurla Distribution Hub',
    type: 'power', subtype: 'distribution',
    location: { lat: 19.0650, lng: 72.8800 },
    status: 'operational', capacity: 65, currentLoad: 55, criticalityScore: 74,
    properties: { operator: 'Tata Power', zone: 'Kurla–Ghatkopar–Chembur' },
  },

  // 14
  {
    name: 'Malad Distribution Hub',
    type: 'power', subtype: 'distribution',
    location: { lat: 19.1870, lng: 72.8480 },
    status: 'operational', capacity: 60, currentLoad: 48, criticalityScore: 65,
    properties: { operator: 'Adani Electricity', zone: 'Malad–Goregaon' },
  },

  // ── Renewables & Backup Generators ─────────────────────────

  // 15
  {
    name: 'Solar Park Navi Mumbai',
    type: 'power', subtype: 'power_plant',
    location: { lat: 19.0330, lng: 73.0297 },
    status: 'operational', capacity: 80, currentLoad: 35, criticalityScore: 48,
    properties: { fuelType: 'solar', outputMW: 100, operator: 'Tata Power Solar' },
  },

  // 16
  {
    name: 'KEM Hospital Diesel Generator Set',
    type: 'power', subtype: 'generator',
    location: { lat: 19.0000, lng: 72.8420 },
    status: 'operational', capacity: 25, currentLoad: 0, criticalityScore: 68,
    properties: {
      fuelType: 'diesel', ratedKVA: 2000, backupFor: 'KEM Hospital',
      note: 'Critical life-safety backup; auto-starts within 10s of grid failure',
    },
  },

  // 17
  {
    name: 'CSIA Airport Standby Generator Set',
    type: 'power', subtype: 'generator',
    location: { lat: 19.0896, lng: 72.8656 },
    status: 'operational', capacity: 30, currentLoad: 0, criticalityScore: 70,
    properties: { fuelType: 'diesel', ratedKVA: 3000, backupFor: 'CSIA T2 Airport' },
  },

  // ── MSETCL 400kV Transmission Hubs ─────────────────────────

  // 18
  {
    name: 'Kalwa 400kV Transmission Hub',
    type: 'power', subtype: 'transmission',
    location: { lat: 19.2000, lng: 72.9800 },
    status: 'operational', capacity: 250, currentLoad: 200, criticalityScore: 91,
    properties: {
      operator: 'MSETCL', voltage: '400kV',
      note: 'Primary MSETCL bulk-power gateway into Mumbai from the eastern interstate grid',
    },
  },

  // 19
  {
    name: 'Padgha 400kV Transmission Hub',
    type: 'power', subtype: 'transmission',
    location: { lat: 19.3100, lng: 73.0600 },
    status: 'operational', capacity: 200, currentLoad: 155, criticalityScore: 83,
    properties: {
      operator: 'MSETCL', voltage: '400kV',
      note: 'Northern MSETCL entry point; feeds Borivali–Mira Bhayandar corridor',
    },
  },

  // ============================================================
  // WATER — indices 20–33
  // Operator: BMC (Brihanmumbai Municipal Corporation)
  // ============================================================

  // 20
  {
    name: 'Bhandup Complex Water Treatment Plant',
    type: 'water', subtype: 'treatment_plant',
    location: { lat: 19.1550, lng: 72.9370 },
    status: 'operational', capacity: 100, currentLoad: 88, criticalityScore: 98,
    properties: {
      capacityMLD: 2135, source: 'Upper Vaitarna + Bhatsa reservoirs',
      operator: 'BMC', note: "Asia's single largest water treatment complex; failure affects ~12M people",
    },
  },

  // 21
  {
    name: 'Panjrapur (Pise) Water Treatment Plant',
    type: 'water', subtype: 'treatment_plant',
    location: { lat: 19.2200, lng: 72.9950 },
    status: 'operational', capacity: 80, currentLoad: 68, criticalityScore: 90,
    properties: { capacityMLD: 910, source: 'Middle Vaitarna reservoir', operator: 'BMC' },
  },

  // 22
  {
    name: 'Vihar Lake Reservoir',
    type: 'water', subtype: 'storage',
    location: { lat: 19.1480, lng: 72.9280 },
    status: 'operational', capacity: 70, currentLoad: 55, criticalityScore: 85,
    properties: {
      capacityML: 27924, type: 'source_reservoir', operator: 'BMC',
      note: 'Located within Sanjay Gandhi National Park; one of six lakes supplying Mumbai',
    },
  },

  // 23
  {
    name: 'Tansa Pipeline Terminal (Bhandup)',
    type: 'water', subtype: 'pipeline_terminal',
    location: { lat: 19.1600, lng: 72.9400 },
    status: 'operational', capacity: 60, currentLoad: 48, criticalityScore: 80,
    properties: {
      source: 'Tansa Lake', pipelineLengthKm: 98, capacityMLD: 455, operator: 'BMC',
      note: '98 km gravity pipeline from Tansa; oldest continuous supply pipeline in Mumbai',
    },
  },

  // 24
  {
    name: 'Veravali Main Pump Station',
    type: 'water', subtype: 'pump_station',
    location: { lat: 19.0800, lng: 72.8900 },
    status: 'operational', capacity: 70, currentLoad: 58, criticalityScore: 89,
    properties: {
      pumpCount: 10, operatingPressureBar: 4.5, operator: 'BMC',
      note: 'Primary booster station distributing treated water to South and Central Mumbai zones',
    },
  },

  // 25
  {
    name: 'Dharavi Intermediate Pump Station',
    type: 'water', subtype: 'pump_station',
    location: { lat: 19.0400, lng: 72.8540 },
    status: 'operational', capacity: 50, currentLoad: 42, criticalityScore: 78,
    properties: {
      pumpCount: 6, operator: 'BMC',
      note: 'Boosts supply pressure to Ghatkopar–Kurla eastern distribution zone',
    },
  },

  // 26
  {
    name: 'Malabar Hill Reservoir',
    type: 'water', subtype: 'storage',
    location: { lat: 18.9550, lng: 72.7950 },
    status: 'operational', capacity: 60, currentLoad: 45, criticalityScore: 82,
    properties: {
      capacityML: 120, yearBuilt: 1879, operator: 'BMC',
      note: "One of Mumbai's oldest service reservoirs (1879); gravity-feeds premium South Mumbai zone",
    },
  },

  // 27
  {
    name: 'Powai Lake Reservoir',
    type: 'water', subtype: 'storage',
    location: { lat: 19.1260, lng: 72.9070 },
    status: 'operational', capacity: 40, currentLoad: 32, criticalityScore: 55,
    properties: { capacityML: 12300, operator: 'BMC', source: 'Bhandup augmentation + rainfall' },
  },

  // 28
  {
    name: 'Tulsi Lake Reservoir',
    type: 'water', subtype: 'storage',
    location: { lat: 19.1800, lng: 72.9100 },
    status: 'operational', capacity: 35, currentLoad: 28, criticalityScore: 52,
    properties: {
      capacityML: 8510, operator: 'BMC',
      note: 'Part of Western Lakes system inside SGNP',
    },
  },

  // 29
  {
    name: 'South Mumbai Water Distribution Main',
    type: 'water', subtype: 'distribution',
    location: { lat: 18.9400, lng: 72.8300 },
    status: 'operational', capacity: 70, currentLoad: 60, criticalityScore: 83,
    properties: { operator: 'BMC', zone: 'Colaba–Fort–Mahalaxmi–Sion' },
  },

  // 30
  {
    name: 'Worli-Prabhadevi Water Distribution',
    type: 'water', subtype: 'distribution',
    location: { lat: 19.0100, lng: 72.8200 },
    status: 'degraded',
    capacity: 50, currentLoad: 45, criticalityScore: 70,
    properties: {
      operator: 'BMC', zone: 'Worli–Mahim–Prabhadevi',
      note: 'Aging cast-iron mains; recurring pressure drops; BMC replacement pending',
    },
  },

  // 31
  {
    name: 'Andheri-Goregaon Water Distribution',
    type: 'water', subtype: 'distribution',
    location: { lat: 19.1400, lng: 72.8500 },
    status: 'operational', capacity: 55, currentLoad: 42, criticalityScore: 65,
    properties: { operator: 'BMC', zone: 'Andheri–Goregaon–Malad' },
  },

  // 32
  {
    name: 'Thane-Mulund Water Distribution',
    type: 'water', subtype: 'distribution',
    location: { lat: 19.1800, lng: 72.9700 },
    status: 'operational', capacity: 45, currentLoad: 38, criticalityScore: 60,
    properties: { operator: 'BMC', zone: 'Thane–Mulund belt' },
  },

  // 33
  {
    name: 'Ghatkopar-Kurla Water Distribution',
    type: 'water', subtype: 'distribution',
    location: { lat: 19.0700, lng: 72.8870 },
    status: 'operational', capacity: 50, currentLoad: 43, criticalityScore: 66,
    properties: { operator: 'BMC', zone: 'Ghatkopar–Kurla–Chembur' },
  },

  // ============================================================
  // TRANSPORT — indices 34–56
  // ============================================================

  // ── Expressways & Arterial Roads ────────────────────────────

  // 34
  {
    name: 'Western Express Highway (WEH / NH-48)',
    type: 'transport', subtype: 'highway',
    location: { lat: 19.1300, lng: 72.8530 },
    status: 'operational', capacity: 100, currentLoad: 85, criticalityScore: 90,
    properties: {
      lanes: 8, lengthKm: 25, dailyTraffic: 350000,
      note: 'Primary north–south spine of western suburbs; connects Dahisar to Bandra flyover',
    },
  },

  // 35
  {
    name: 'Eastern Express Highway (EEH / NH-48 spur)',
    type: 'transport', subtype: 'highway',
    location: { lat: 19.0900, lng: 72.9100 },
    status: 'operational', capacity: 90, currentLoad: 75, criticalityScore: 85,
    properties: {
      lanes: 6, lengthKm: 22, dailyTraffic: 280000,
      note: 'North–south corridor linking CSMT area to Thane via Kurla and Mulund',
    },
  },

  // 36
  {
    name: 'Eastern Freeway (Mumbai Freeway)',
    type: 'transport', subtype: 'highway',
    location: { lat: 18.9800, lng: 72.8600 },
    status: 'operational', capacity: 75, currentLoad: 50, criticalityScore: 78,
    properties: {
      lanes: 6, lengthKm: 16.8, dailyTraffic: 90000,
      note: "India's first elevated urban freeway; P D Mello Rd (CSMT) to Ghatkopar; bypasses 26 traffic signals",
    },
  },

  // 37
  {
    name: 'Mumbai-Pune Expressway (NH-48)',
    type: 'transport', subtype: 'highway',
    location: { lat: 19.0200, lng: 73.0300 },
    status: 'operational', capacity: 80, currentLoad: 60, criticalityScore: 82,
    properties: {
      lanes: 6, lengthKm: 94, dailyTraffic: 150000,
      note: 'Critical intercity freight and passenger corridor; entry via SCLR at Anik',
    },
  },

  // 38
  {
    name: 'JVLR (Jogeshwari-Vikhroli Link Road)',
    type: 'transport', subtype: 'arterial_road',
    location: { lat: 19.1070, lng: 72.8950 },
    status: 'operational', capacity: 65, currentLoad: 55, criticalityScore: 76,
    properties: {
      lanes: 4, lengthKm: 10.7, dailyTraffic: 120000,
      note: 'Only major east–west connector in mid-suburb band linking WEH and EEH',
    },
  },

  // 39
  {
    name: 'SCLR (Santacruz-Chembur Link Road)',
    type: 'transport', subtype: 'arterial_road',
    location: { lat: 19.0630, lng: 72.8810 },
    status: 'operational', capacity: 60, currentLoad: 50, criticalityScore: 73,
    properties: {
      lanes: 4, lengthKm: 6.45, dailyTraffic: 100000,
      note: 'Elevated east–west link connecting Santacruz WR to Chembur; city entry from NH-48',
    },
  },

  // ── Sea Links & Bridges ─────────────────────────────────────

  // 40
  {
    name: 'Bandra-Worli Sea Link (BWSL)',
    type: 'transport', subtype: 'bridge',
    location: { lat: 19.0375, lng: 72.8200 },
    status: 'operational', capacity: 70, currentLoad: 58, criticalityScore: 93,
    properties: {
      spanKm: 5.6, lanes: 8, dailyTraffic: 37000, tollCollected: true,
      note: 'Cable-stayed bridge; sole direct western-coast link; cuts Bandra–Worli from 45 min to 7 min; critical ambulance corridor to KEM',
    },
  },

  // 41
  {
    name: 'Vashi Creek Bridge (Sion-Panvel Highway)',
    type: 'transport', subtype: 'bridge',
    location: { lat: 19.0650, lng: 72.9980 },
    status: 'operational', capacity: 65, currentLoad: 55, criticalityScore: 86,
    properties: {
      spanKm: 1.8, connectsTo: 'Navi Mumbai via Thane Creek',
      note: 'Critical bridge on Sion–Panvel Highway; failure severs main road artery to Navi Mumbai',
    },
  },

  // 42
  {
    name: 'Atal Setu (Mumbai Trans-Harbour Link)',
    type: 'transport', subtype: 'bridge',
    location: { lat: 19.0100, lng: 72.9700 },
    status: 'operational', capacity: 75, currentLoad: 40, criticalityScore: 82,
    properties: {
      spanKm: 21.8, lanes: 6, opened: 2024,
      note: "India's longest sea bridge (Jan 2024); Sewri to Nhava Sheva; cuts JNPT travel from 60 min to 20 min",
    },
  },

  // ── Railway & Metro Stations ────────────────────────────────

  // 43
  {
    name: 'CSMT (Chhatrapati Shivaji Maharaj Terminus)',
    type: 'transport', subtype: 'transit_hub',
    location: { lat: 18.9398, lng: 72.8355 },
    status: 'operational', capacity: 100, currentLoad: 90, criticalityScore: 98,
    properties: {
      railLines: 'Central Railway mainline + Harbour Line terminus',
      dailyPassengers: 3500000, platforms: 18,
      note: "UNESCO World Heritage Site; India's busiest railway terminus; hub for 3.5M daily passengers",
    },
  },

  // 44
  {
    name: 'Mumbai Central & Churchgate Stations (WR)',
    type: 'transport', subtype: 'transit_hub',
    location: { lat: 18.9712, lng: 72.8197 },
    status: 'operational', capacity: 90, currentLoad: 78, criticalityScore: 92,
    properties: {
      railLines: 'Western Railway mainline (Mumbai Central) + Churchgate local terminus',
      dailyPassengers: 1500000, platforms: 8,
      note: 'WR mainline terminus and Churchgate local terminus; gateway for north/central India passengers via WR',
    },
  },

  // 45
  {
    name: 'Dadar Junction (CR + WR interchange)',
    type: 'transport', subtype: 'transit_hub',
    location: { lat: 19.0176, lng: 72.8426 },
    status: 'operational', capacity: 95, currentLoad: 88, criticalityScore: 96,
    properties: {
      railLines: 'Central Railway mainline + Western Railway suburban interchange',
      dailyPassengers: 5000000,
      note: "India's busiest interchange station; connects CR and WR networks; 5M daily passengers",
    },
  },

  // 46
  {
    name: 'Andheri Station (WR + Metro 1 / 2A / 7)',
    type: 'transport', subtype: 'transit_hub',
    location: { lat: 19.1197, lng: 72.8464 },
    status: 'operational', capacity: 80, currentLoad: 70, criticalityScore: 88,
    properties: {
      railLines: 'Western Railway suburban', metro: 'Metro Lines 1, 2A, 7 interchange',
      dailyPassengers: 1200000,
      note: "Mumbai's most important multi-modal hub; WR + 3 metro lines converge",
    },
  },

  // 47
  {
    name: 'Kurla Station & LTT (CR + Harbour Line)',
    type: 'transport', subtype: 'transit_hub',
    location: { lat: 19.0724, lng: 72.8795 },
    status: 'operational', capacity: 85, currentLoad: 75, criticalityScore: 88,
    properties: {
      railLines: 'CR Mainline + Harbour Line', nearbyTerminus: 'Lokmanya Tilak Terminus (LTT)',
      dailyPassengers: 900000,
      note: 'Major CR hub; LTT is origin of long-distance trains to South & East India',
    },
  },

  // 48
  {
    name: 'Ghatkopar Station (CR + Metro Line 1 terminus)',
    type: 'transport', subtype: 'transit_hub',
    location: { lat: 19.0868, lng: 72.9088 },
    status: 'operational', capacity: 75, currentLoad: 65, criticalityScore: 83,
    properties: {
      railLines: 'CR suburban', metro: 'Metro Line 1 eastern terminus',
      dailyPassengers: 600000,
      note: 'Eastern Metro Line 1 terminus; key CR↔Metro interchange serving Ghatkopar belt',
    },
  },

  // ── Airport & Ports ─────────────────────────────────────────

  // 49
  {
    name: 'Chhatrapati Shivaji Maharaj International Airport T2',
    type: 'transport', subtype: 'airport',
    location: { lat: 19.0896, lng: 72.8656 },
    status: 'operational', capacity: 100, currentLoad: 78, criticalityScore: 95,
    properties: {
      runways: 2, dailyFlights: 950, annualPassengers: '50M',
      note: "India's 2nd-busiest airport; single operational airport for Mumbai; runway closure cascades nationally",
    },
  },

  // 50
  {
    name: 'Mumbai Port Trust (Ballard Pier)',
    type: 'transport', subtype: 'port',
    location: { lat: 18.9500, lng: 72.8460 },
    status: 'operational', capacity: 80, currentLoad: 60, criticalityScore: 78,
    properties: {
      berths: 12, annualCargoTons: '20M', operator: 'Mumbai Port Authority',
      note: 'City-side port; handles passenger ferries, dry bulk, petroleum products',
    },
  },

  // 51
  {
    name: 'JNPT Nhava Sheva Port',
    type: 'transport', subtype: 'port',
    location: { lat: 18.9500, lng: 72.9450 },
    status: 'operational', capacity: 100, currentLoad: 80, criticalityScore: 88,
    properties: {
      berths: 24, annualTEU: '6M', operator: 'JNPA',
      note: "India's largest container port; ~55% of national container traffic; closure impacts national supply chains",
    },
  },

  // ── Metro Lines ─────────────────────────────────────────────

  // 52
  {
    name: 'Metro Line 1 (Versova–Andheri–Ghatkopar)',
    type: 'transport', subtype: 'metro',
    location: { lat: 19.1000, lng: 72.8770 },
    status: 'operational', capacity: 70, currentLoad: 55, criticalityScore: 78,
    properties: {
      stations: 12, lengthKm: 11.4, dailyPassengers: 400000,
      operator: 'Mumbai Metro One Pvt Ltd',
      note: "Mumbai's first metro (2014); sole east–west cross-suburban rapid transit link",
    },
  },

  // 53
  {
    name: 'Metro Line 2A (Dahisar–D.N.Nagar)',
    type: 'transport', subtype: 'metro',
    location: { lat: 19.2000, lng: 72.8450 },
    status: 'operational', capacity: 65, currentLoad: 42, criticalityScore: 70,
    properties: {
      stations: 17, lengthKm: 18.6, operator: 'MMRDA',
      note: 'Runs parallel to WEH; significantly reduces WEH road congestion in western suburbs',
    },
  },

  // 54
  {
    name: 'Metro Line 7 (Andheri East–Dahisar East)',
    type: 'transport', subtype: 'metro',
    location: { lat: 19.1700, lng: 72.8650 },
    status: 'operational', capacity: 65, currentLoad: 40, criticalityScore: 70,
    properties: {
      stations: 13, lengthKm: 16.5, operator: 'MMRDA',
      note: 'Eastern suburbs north–south corridor; interchanges with Metro 2A at Dahisar East',
    },
  },

  // 55
  {
    name: 'BEST Bus Depot Worli',
    type: 'transport', subtype: 'bus_depot',
    location: { lat: 19.0150, lng: 72.8250 },
    status: 'operational', capacity: 60, currentLoad: 48, criticalityScore: 65,
    properties: {
      buses: 200, routes: 45, operator: 'BEST Undertaking',
      note: "Largest BEST depot; critical for bus network serving South-Central Mumbai; last-mile for suburban rail commuters",
    },
  },

  // 56
  {
    name: 'Thane Station (CR)',
    type: 'transport', subtype: 'transit_hub',
    location: { lat: 19.1860, lng: 72.9750 },
    status: 'operational', capacity: 85, currentLoad: 72, criticalityScore: 83,
    properties: {
      railLines: 'CR Mainline + CR Suburban',
      dailyPassengers: 800000,
      note: 'Gateway station for Thane city; major entry/exit to Mumbai Metropolitan Region from the east',
    },
  },

  // ============================================================
  // TELECOM — indices 57–71
  // Operators: Jio, Airtel, MTNL, BSNL, Vodafone-Idea, Tata Comm
  // ============================================================

  // 57
  {
    name: 'Jio Data Center Navi Mumbai',
    type: 'telecom', subtype: 'data_center',
    location: { lat: 19.0530, lng: 73.0200 },
    status: 'operational', capacity: 100, currentLoad: 72, criticalityScore: 95,
    properties: {
      racks: 500, tierLevel: 4, operator: 'Reliance Jio',
      note: 'Tier-IV; primary Jio internet exchange and Mumbai-region CDN origin; connects to submarine CLS',
    },
  },

  // 58
  {
    name: 'Airtel NOC Powai',
    type: 'telecom', subtype: 'data_center',
    location: { lat: 19.1180, lng: 72.9050 },
    status: 'operational', capacity: 80, currentLoad: 58, criticalityScore: 88,
    properties: {
      racks: 200, tierLevel: 3, operator: 'Airtel',
      note: "Airtel's Mumbai Network Operations Centre; manages city-wide 4G/5G RAN and fiber",
    },
  },

  // 59
  {
    name: 'MTNL Telephone Exchange Fort',
    type: 'telecom', subtype: 'exchange',
    location: { lat: 18.9340, lng: 72.8360 },
    status: 'degraded',
    capacity: 50, currentLoad: 42, criticalityScore: 72,
    properties: {
      type: 'PSTN + DSL Broadband', operator: 'MTNL', subscribers: 500000,
      note: 'Aging legacy exchange; ~500k South Mumbai landline and broadband subscribers; equipment obsolescence risk',
    },
  },

  // 60
  {
    name: 'Vodafone-Idea (Vi) NOC Andheri',
    type: 'telecom', subtype: 'data_center',
    location: { lat: 19.1100, lng: 72.8680 },
    status: 'operational', capacity: 70, currentLoad: 52, criticalityScore: 78,
    properties: {
      operator: 'Vodafone-Idea Ltd', tierLevel: 3,
      note: "Vi's Mumbai NOC managing merged 4G network post Vodafone-Idea integration",
    },
  },

  // 61
  {
    name: 'Jio 5G Cell Tower BKC',
    type: 'telecom', subtype: 'cell_tower',
    location: { lat: 19.0596, lng: 72.8656 },
    status: 'operational', capacity: 60, currentLoad: 50, criticalityScore: 72,
    properties: {
      coverage: '5G NR (SA)', rangeKm: 2, operator: 'Jio',
      note: 'High-density 5G standalone tower; serves BKC financial district and Bandra West',
    },
  },

  // 62
  {
    name: 'Airtel 5G Cell Tower Andheri',
    type: 'telecom', subtype: 'cell_tower',
    location: { lat: 19.1136, lng: 72.8497 },
    status: 'operational', capacity: 50, currentLoad: 38, criticalityScore: 62,
    properties: { coverage: '4G / 5G NSA', rangeKm: 3, operator: 'Airtel' },
  },

  // 63
  {
    name: 'Jio 5G Cell Tower Thane',
    type: 'telecom', subtype: 'cell_tower',
    location: { lat: 19.2183, lng: 72.9781 },
    status: 'operational', capacity: 50, currentLoad: 35, criticalityScore: 58,
    properties: { coverage: '5G NR', rangeKm: 3, operator: 'Jio' },
  },

  // 64
  {
    name: 'BSNL Cell Tower Dadar',
    type: 'telecom', subtype: 'cell_tower',
    location: { lat: 19.0180, lng: 72.8430 },
    status: 'operational', capacity: 40, currentLoad: 30, criticalityScore: 55,
    properties: { coverage: '4G LTE', rangeKm: 3, operator: 'BSNL' },
  },

  // 65
  {
    name: 'Airtel 5G Cell Tower Colaba',
    type: 'telecom', subtype: 'cell_tower',
    location: { lat: 18.9067, lng: 72.8090 },
    status: 'operational', capacity: 45, currentLoad: 36, criticalityScore: 60,
    properties: { coverage: '5G NSA', rangeKm: 2, operator: 'Airtel' },
  },

  // 66
  {
    name: 'Vi 4G Cell Tower Kurla',
    type: 'telecom', subtype: 'cell_tower',
    location: { lat: 19.0724, lng: 72.8795 },
    status: 'operational', capacity: 40, currentLoad: 32, criticalityScore: 55,
    properties: { coverage: '4G LTE', rangeKm: 3, operator: 'Vodafone-Idea' },
  },

  // 67
  {
    name: 'Tata Communications Fiber Backbone (South Mumbai)',
    type: 'telecom', subtype: 'fiber_node',
    location: { lat: 18.9700, lng: 72.8300 },
    status: 'operational', capacity: 90, currentLoad: 65, criticalityScore: 90,
    properties: {
      bandwidthGbps: 200, operator: 'Tata Communications',
      note: 'Core IP/MPLS peering hub; connects ISPs, govt. agencies and enterprises in South Mumbai; direct conduit for Police and EOC comms',
    },
  },

  // 68
  {
    name: 'Jio Fiber Hub Powai',
    type: 'telecom', subtype: 'fiber_node',
    location: { lat: 19.1176, lng: 72.9060 },
    status: 'operational', capacity: 70, currentLoad: 48, criticalityScore: 72,
    properties: { bandwidthGbps: 100, operator: 'Jio' },
  },

  // 69
  {
    name: 'Airtel Fiber Hub Thane',
    type: 'telecom', subtype: 'fiber_node',
    location: { lat: 19.2000, lng: 72.9700 },
    status: 'operational', capacity: 60, currentLoad: 40, criticalityScore: 65,
    properties: { bandwidthGbps: 60, operator: 'Airtel' },
  },

  // 70
  {
    name: 'Submarine Cable Landing Station (CLS) Versova',
    type: 'telecom', subtype: 'submarine_cable',
    location: { lat: 19.1600, lng: 72.8100 },
    status: 'operational', capacity: 100, currentLoad: 55, criticalityScore: 97,
    properties: {
      bandwidthTbps: 100, cables: 'MENA, i2i, TGN-EA, SMW-4, Bay of Bengal Gateway',
      operator: 'Multiple ISPs (Tata, Airtel, Jio co-located)',
      note: "Single physical landing station for all of Mumbai's international subsea cables; catastrophic single point of failure for international internet",
    },
  },

  // 71
  {
    name: 'MTNL Broadband Exchange Bandra',
    type: 'telecom', subtype: 'exchange',
    location: { lat: 19.0544, lng: 72.8406 },
    status: 'operational', capacity: 45, currentLoad: 35, criticalityScore: 60,
    properties: {
      type: 'ADSL / VDSL Broadband', operator: 'MTNL', subscribers: 120000,
    },
  },

  // ============================================================
  // EMERGENCY — indices 72–89
  // BMC Hospitals, Fire Brigade, Police, MCGM EOC, NDRF, Coast Guard
  // ============================================================

  // 72
  {
    name: 'KEM Hospital (King Edward Memorial)',
    type: 'emergency', subtype: 'hospital',
    location: { lat: 19.0000, lng: 72.8420 },
    status: 'operational', capacity: 100, currentLoad: 88, criticalityScore: 98,
    properties: {
      beds: 1800, traumaLevel: 1, type: 'Government (BMC)', established: 1926,
      note: "Mumbai's largest public hospital; primary Level-1 trauma referral centre; serves ~2M OPD annually",
    },
  },

  // 73
  {
    name: 'Lilavati Hospital',
    type: 'emergency', subtype: 'hospital',
    location: { lat: 19.0509, lng: 72.8289 },
    status: 'operational', capacity: 80, currentLoad: 62, criticalityScore: 88,
    properties: {
      beds: 314, traumaLevel: 1, type: 'Private (charitable trust)', suburb: 'Bandra',
      note: 'Leading private tertiary hospital; advanced cardiac and neuro centre; frequent referral from western suburbs',
    },
  },

  // 74
  {
    name: 'Sion Hospital (LTM General)',
    type: 'emergency', subtype: 'hospital',
    location: { lat: 19.0396, lng: 72.8621 },
    status: 'operational', capacity: 75, currentLoad: 65, criticalityScore: 89,
    properties: {
      beds: 1500, traumaLevel: 1, type: 'Government (BMC)',
      note: 'Major BMC teaching hospital; trauma centre for Central and Eastern Mumbai; handles mass-casualty burns',
    },
  },

  // 75
  {
    name: 'Nair Hospital (BYL Nair Charitable)',
    type: 'emergency', subtype: 'hospital',
    location: { lat: 18.9870, lng: 72.8310 },
    status: 'operational', capacity: 70, currentLoad: 58, criticalityScore: 86,
    properties: {
      beds: 1200, traumaLevel: 2, type: 'Government (BMC)', suburb: 'Mumbai Central',
      note: 'Key BMC hospital near Mumbai Central; attached dental college; important for South-Central zone',
    },
  },

  // 76
  {
    name: 'Cooper Hospital (RN Cooper Municipal General)',
    type: 'emergency', subtype: 'hospital',
    location: { lat: 19.1040, lng: 72.8357 },
    status: 'operational', capacity: 65, currentLoad: 50, criticalityScore: 80,
    properties: {
      beds: 600, traumaLevel: 2, type: 'Government (BMC)', suburb: 'Juhu',
      note: 'Primary BMC hospital for Andheri–Juhu belt; north-western zone referral centre',
    },
  },

  // 77
  {
    name: 'Hinduja Hospital (P.D. Hinduja National)',
    type: 'emergency', subtype: 'hospital',
    location: { lat: 19.0350, lng: 72.8380 },
    status: 'operational', capacity: 70, currentLoad: 55, criticalityScore: 84,
    properties: {
      beds: 350, traumaLevel: 1, type: 'Private (charitable trust)', suburb: 'Mahim',
      note: 'Leading private hospital in Mahim; advanced organ transplant and cardiac surgery',
    },
  },

  // 78
  {
    name: 'Mumbai Fire Brigade HQ (Byculla)',
    type: 'emergency', subtype: 'fire_station',
    location: { lat: 18.9790, lng: 72.8330 },
    status: 'operational', capacity: 50, currentLoad: 35, criticalityScore: 88,
    properties: {
      fireEngines: 8, waterTenders: 6, aerialPlatforms: 2, personnel: 120, region: 'South Mumbai',
      note: 'MFB Headquarters; coordinates 34 fire stations city-wide; HAZMАТ response centre',
    },
  },

  // 79
  {
    name: 'Fire Station Andheri',
    type: 'emergency', subtype: 'fire_station',
    location: { lat: 19.1150, lng: 72.8500 },
    status: 'operational', capacity: 40, currentLoad: 28, criticalityScore: 78,
    properties: { fireEngines: 5, personnel: 80, region: 'Western Suburbs' },
  },

  // 80
  {
    name: 'Fire Station Mulund',
    type: 'emergency', subtype: 'fire_station',
    location: { lat: 19.1720, lng: 72.9560 },
    status: 'operational', capacity: 35, currentLoad: 22, criticalityScore: 72,
    properties: { fireEngines: 4, personnel: 60, region: 'Eastern Suburbs' },
  },

  // 81
  {
    name: 'Fire Station Kurla',
    type: 'emergency', subtype: 'fire_station',
    location: { lat: 19.0730, lng: 72.8800 },
    status: 'operational', capacity: 35, currentLoad: 25, criticalityScore: 74,
    properties: {
      fireEngines: 4, personnel: 65, region: 'Central Suburbs',
      note: 'Covers dense Dharavi–Kurla corridor; high chemical and industrial hazard risk area',
    },
  },

  // 82
  {
    name: 'Mumbai Police Commissioner HQ (Crawford Market)',
    type: 'emergency', subtype: 'police_station',
    location: { lat: 18.9471, lng: 72.8336 },
    status: 'operational', capacity: 60, currentLoad: 48, criticalityScore: 94,
    properties: {
      officers: 500, type: 'Commissioner of Police Office',
      note: 'Apex command of Mumbai Police; coordinates all 95 police stations; interfaces with state and central security agencies',
    },
  },

  // 83
  {
    name: 'Bandra Police Station',
    type: 'emergency', subtype: 'police_station',
    location: { lat: 19.0544, lng: 72.8406 },
    status: 'operational', capacity: 35, currentLoad: 28, criticalityScore: 68,
    properties: {
      officers: 120, jurisdiction: 'Bandra Division',
      note: 'High-profile jurisdiction covering Bandra West–BKC financial corridor',
    },
  },

  // 84
  {
    name: 'Kurla Police Station',
    type: 'emergency', subtype: 'police_station',
    location: { lat: 19.0726, lng: 72.8800 },
    status: 'operational', capacity: 35, currentLoad: 28, criticalityScore: 65,
    properties: { officers: 100, jurisdiction: 'Kurla Division' },
  },

  // 85
  {
    name: 'MCGM (BMC) Disaster Control Room',
    type: 'emergency', subtype: 'eoc',
    location: { lat: 18.9388, lng: 72.8354 },
    status: 'operational', capacity: 45, currentLoad: 18, criticalityScore: 97,
    properties: {
      type: 'Emergency Operations Centre', established: 2005,
      coordinatesWith: ['NDRF', 'Fire Brigade', 'Police', 'Hospitals', 'Coast Guard'],
      note: 'Situated at BMC HQ, CST Road; activated during cyclones, floods, fires; NDRF liaison cell',
    },
  },

  // 86
  {
    name: 'Police Emergency Control Room (Dial 100)',
    type: 'emergency', subtype: 'dispatch',
    location: { lat: 18.9500, lng: 72.8350 },
    status: 'operational', capacity: 35, currentLoad: 25, criticalityScore: 96,
    properties: {
      operators: 60, linesCapacity: 200, emergencyNumber: '100',
      note: 'Unified police dispatch handling ~10,000 calls/day; interfaces with 112 India Emergency Response System; sole citywide police dispatch hub',
    },
  },

  // 87
  {
    name: 'NDRF 4th Battalion HQ (Kharghar)',
    type: 'emergency', subtype: 'rescue_unit',
    location: { lat: 19.0450, lng: 73.0680 },
    status: 'operational', capacity: 40, currentLoad: 10, criticalityScore: 85,
    properties: {
      teams: 8, personnel: 250,
      specialization: 'Flood rescue, structural collapse, CBRN (chemical/biological/radiological/nuclear)',
      note: 'National Disaster Response Force; federal rapid-reaction rescue unit for Mumbai and Maharashtra region',
    },
  },

  // 88
  {
    name: 'BMC Flood Emergency Shelter Worli',
    type: 'emergency', subtype: 'shelter',
    location: { lat: 19.0100, lng: 72.8180 },
    status: 'operational', capacity: 60, currentLoad: 0, criticalityScore: 58,
    properties: {
      capacityPersons: 5000, type: 'Cyclone + Flood Relief',
      note: 'Activated during monsoon season; serves coastal evacuations from Worli Koliwada and Mahim',
    },
  },

  // 89
  {
    name: 'Indian Coast Guard Station Mumbai',
    type: 'emergency', subtype: 'coast_guard',
    location: { lat: 18.9230, lng: 72.8330 },
    status: 'operational', capacity: 45, currentLoad: 12, criticalityScore: 78,
    properties: {
      vessels: 6, helicopters: 2, jurisdiction: 'Maharashtra coast (0–200 NM)',
      note: 'Maritime search and rescue; offshore oil platform emergencies; anti-smuggling; ICGS Samudra Prahari homeport',
    },
  },
];

// ============================================================
// DEPENDENCIES
// [sourceIdx, targetIdx, type, strength(0–1), bidirectional, description]
// ALL indices verified against the 90-node array above.
// ============================================================
type DepTuple = [number, number, string, number, boolean, string];

const seedDependencies: DepTuple[] = [

  // ──────────────────────────────────────────────────────────
  // POWER — INTERNAL
  // Generation → Transmission → Substation → Distribution
  // ──────────────────────────────────────────────────────────

  // Generation → Transmission
  [0, 18, 'power_supply', 0.95, false, 'Trombay Plant (1580 MW) primary bulk supply to Kalwa 400kV Transmission Hub'],
  [0, 3,  'power_supply', 0.92, false, 'Trombay Plant direct 220kV feed to Dharavi Substation (south grid tie)'],
  [1, 19, 'power_supply', 0.88, false, 'Dahanu Plant (500 MW) bulk feed to Padgha 400kV Transmission Hub'],
  [1, 4,  'power_supply', 0.85, false, 'Dahanu Plant direct 220kV feed to Salsette Substation'],
  [2, 18, 'power_supply', 0.80, false, 'Uran Gas Plant feeds Kalwa Transmission Hub via Navi Mumbai grid tie'],

  // Transmission → Substations
  [18, 5,  'power_supply', 0.90, false, 'Kalwa 400kV Hub to Aarey Colony 400kV Substation (step-down)'],
  [18, 3,  'power_supply', 0.88, false, 'Kalwa 400kV Hub reinforces Dharavi 220kV Substation (redundant ring)'],
  [18, 7,  'power_supply', 0.85, false, 'Kalwa 400kV Hub to Vikhroli 220kV Substation'],
  [19, 6,  'power_supply', 0.85, false, 'Padgha 400kV Hub to Borivali 110kV Substation'],
  [19, 4,  'power_supply', 0.82, false, 'Padgha 400kV Hub to Salsette 220kV Substation (northern backup ring)'],

  // Substations → Distribution
  [3,  9,  'power_supply', 0.90, false, 'Dharavi 220kV Sub → Colaba Distribution Hub (South Mumbai)'],
  [3,  10, 'power_supply', 0.92, false, 'Dharavi 220kV Sub → BKC Commercial Grid'],
  [4,  11, 'power_supply', 0.88, false, 'Salsette 220kV Sub → Andheri Distribution Hub'],
  [5,  12, 'power_supply', 0.85, false, 'Aarey 400kV Sub → Powai Distribution Hub'],
  [7,  13, 'power_supply', 0.88, false, 'Vikhroli 220kV Sub → Kurla Distribution Hub'],
  [6,  14, 'power_supply', 0.82, false, 'Borivali 110kV Sub → Malad Distribution Hub'],
  [8,  13, 'power_supply', 0.80, false, 'Chembur 110kV Sub → Kurla Distribution Hub (southern backup ring)'],
  [15, 12, 'power_supply', 0.65, false, 'Solar Park Navi Mumbai daytime supplement to Powai Distribution'],

  // ──────────────────────────────────────────────────────────
  // POWER → WATER
  // ──────────────────────────────────────────────────────────
  [5,  20, 'power_supply', 0.95, false, 'Aarey 400kV Sub powers Bhandup Complex WTP (2135 MLD; Asia\'s largest)'],
  [4,  21, 'power_supply', 0.90, false, 'Salsette 220kV Sub powers Panjrapur WTP (910 MLD)'],
  [3,  24, 'power_supply', 0.90, false, 'Dharavi 220kV Sub powers Veravali Main Pump Station'],
  [3,  25, 'power_supply', 0.88, false, 'Dharavi 220kV Sub powers Dharavi Intermediate Pump Station'],
  [10, 29, 'power_supply', 0.80, false, 'BKC Grid powers South Mumbai Water Distribution mains'],
  [9,  26, 'power_supply', 0.78, false, 'Colaba Hub powers Malabar Hill Reservoir booster pumps'],

  // ──────────────────────────────────────────────────────────
  // POWER → TELECOM
  // ──────────────────────────────────────────────────────────
  [12, 57, 'power_supply', 0.92, false, 'Powai Distribution powers Jio Data Center Navi Mumbai (Tier-IV)'],
  [12, 58, 'power_supply', 0.90, false, 'Powai Distribution powers Airtel NOC Powai'],
  [10, 61, 'power_supply', 0.85, false, 'BKC Grid powers Jio 5G Tower BKC'],
  [11, 62, 'power_supply', 0.80, false, 'Andheri Distribution powers Airtel 5G Tower Andheri'],
  [9,  67, 'power_supply', 0.85, false, 'Colaba Hub powers Tata Communications Fiber Backbone (South Mumbai)'],
  [10, 68, 'power_supply', 0.80, false, 'BKC Grid powers Jio Fiber Hub Powai'],
  [11, 60, 'power_supply', 0.82, false, 'Andheri Distribution powers Vi NOC Andheri'],
  [9,  65, 'power_supply', 0.78, false, 'Colaba Hub powers Airtel 5G Tower Colaba'],
  [9,  59, 'power_supply', 0.80, false, 'Colaba Hub powers MTNL Telephone Exchange Fort'],

  // ──────────────────────────────────────────────────────────
  // POWER → EMERGENCY
  // ──────────────────────────────────────────────────────────
  [3,  72, 'power_supply', 0.97, false, 'Dharavi 220kV Sub primary supply to KEM Hospital (life-critical load)'],
  [16, 72, 'power_supply', 0.80, false, 'KEM Hospital DG Set auto-starts as backup within 10 s of grid failure'],
  [10, 73, 'power_supply', 0.92, false, 'BKC Grid powers Lilavati Hospital Bandra'],
  [3,  74, 'power_supply', 0.90, false, 'Dharavi 220kV Sub powers Sion Hospital'],
  [9,  75, 'power_supply', 0.88, false, 'Colaba Hub powers Nair Hospital Mumbai Central'],
  [14, 76, 'power_supply', 0.85, false, 'Malad Distribution powers Cooper Hospital Juhu'],
  [10, 77, 'power_supply', 0.88, false, 'BKC Grid powers Hinduja Hospital Mahim'],
  [9,  78, 'power_supply', 0.85, false, 'Colaba Hub powers Mumbai Fire Brigade HQ Byculla'],
  [11, 79, 'power_supply', 0.82, false, 'Andheri Distribution powers Fire Station Andheri'],
  [13, 81, 'power_supply', 0.80, false, 'Kurla Distribution powers Fire Station Kurla'],
  [9,  82, 'power_supply', 0.90, false, 'Colaba Hub powers Police Commissioner HQ Crawford Market'],
  [9,  85, 'power_supply', 0.95, false, 'Colaba Hub powers MCGM Disaster Control Room (EOC; life-critical)'],
  [9,  86, 'power_supply', 0.95, false, 'Colaba Hub powers Police Emergency Control Room Dial 100'],

  // ──────────────────────────────────────────────────────────
  // POWER → TRANSPORT
  // ──────────────────────────────────────────────────────────
  [10, 43, 'power_supply', 0.90, false, 'BKC Grid powers CSMT railway signaling, OHE and station systems'],
  [10, 45, 'power_supply', 0.88, false, 'BKC Grid powers Dadar Junction signal and interlocking systems'],
  [17, 49, 'power_supply', 0.75, false, 'CSIA Airport DG Set provides backup power to T2 critical systems'],
  [11, 46, 'power_supply', 0.82, false, 'Andheri Distribution powers Andheri Station systems'],
  [13, 47, 'power_supply', 0.82, false, 'Kurla Distribution powers Kurla Station and LTT systems'],
  [13, 48, 'power_supply', 0.82, false, 'Kurla Distribution powers Ghatkopar Station systems'],
  [10, 52, 'power_supply', 0.85, false, 'BKC Grid powers Metro Line 1 OHE traction supply (750V DC)'],
  [14, 53, 'power_supply', 0.85, false, 'Malad Distribution powers Metro Line 2A traction along WEH corridor'],
  [11, 54, 'power_supply', 0.85, false, 'Andheri Distribution powers Metro Line 7 traction (Andheri–Dahisar E)'],

  // ──────────────────────────────────────────────────────────
  // WATER — INTERNAL
  // Source → Treatment → Pumping → Distribution → Storage
  // ──────────────────────────────────────────────────────────
  [22, 20, 'water_supply', 0.90, false, 'Vihar Lake gravity-feeds raw water to Bhandup Complex WTP'],
  [23, 20, 'water_supply', 0.85, false, 'Tansa Pipeline Terminal (98 km gravity main) delivers raw water to Bhandup WTP'],
  [20, 24, 'water_supply', 0.95, false, 'Bhandup WTP treated water feeds Veravali Main Pump Station for pressurization'],
  [21, 31, 'water_supply', 0.90, false, 'Panjrapur WTP supplies Andheri-Goregaon Water Distribution zone'],
  [24, 29, 'water_supply', 0.92, false, 'Veravali Main Pump Station pressurizes South Mumbai Distribution Main'],
  [24, 26, 'water_supply', 0.85, false, 'Veravali Pump fills Malabar Hill Reservoir (gravity storage, 1879)'],
  [24, 30, 'water_supply', 0.88, false, 'Veravali Pump feeds Worli-Prabhadevi Water Distribution zone'],
  [20, 32, 'water_supply', 0.80, false, 'Bhandup WTP feeds Thane-Mulund Distribution belt via rising mains'],
  [20, 27, 'water_supply', 0.75, false, 'Bhandup WTP augments Powai Lake Reservoir during surplus capacity'],
  [21, 28, 'water_supply', 0.78, false, 'Panjrapur WTP supplements Tulsi Lake Reservoir'],
  [25, 33, 'water_supply', 0.85, false, 'Dharavi Intermediate Pump Station supplies Ghatkopar-Kurla Distribution zone'],
  [20, 33, 'water_supply', 0.80, false, 'Bhandup WTP direct supply to Ghatkopar-Kurla Distribution (alternate main)'],

  // ──────────────────────────────────────────────────────────
  // WATER → EMERGENCY
  // ──────────────────────────────────────────────────────────
  [29, 72, 'water_supply', 0.92, false, 'South Mumbai Distribution supplies KEM Hospital (surgical sterile water + fire suppression)'],
  [29, 75, 'water_supply', 0.85, false, 'South Mumbai Distribution supplies Nair Hospital'],
  [30, 74, 'water_supply', 0.88, false, 'Worli-Prabhadevi Distribution supplies Sion Hospital'],
  [29, 78, 'water_supply', 0.75, false, 'South Mumbai Distribution supplies Fire Brigade HQ (firefighting hydrant pressure)'],
  [31, 76, 'water_supply', 0.80, false, 'Andheri-Goregaon Distribution supplies Cooper Hospital Juhu'],
  [30, 77, 'water_supply', 0.82, false, 'Worli Distribution supplies Hinduja Hospital Mahim'],

  // ──────────────────────────────────────────────────────────
  // TRANSPORT — INTERNAL
  // Road network connectivity and rail/metro interchange links
  // ──────────────────────────────────────────────────────────

  // Road–road connections
  [34, 40, 'physical_access', 0.90, true,  'WEH (NH-48) connects to Bandra-Worli Sea Link at Bandra Reclamation junction'],
  [35, 38, 'physical_access', 0.85, true,  'EEH connects to JVLR at Ghatkopar-Vikhroli interchange (LBS Marg junction)'],
  [35, 39, 'physical_access', 0.85, true,  'EEH connects to SCLR at Chembur (Anik-Panjarpol junction)'],
  [37, 39, 'physical_access', 0.80, true,  'Mumbai-Pune Expressway (NH-48) enters city via SCLR at Anik junction'],
  [36, 43, 'physical_access', 0.85, true,  'Eastern Freeway originates at P D Mello Rd adjacent to CSMT; critical South Mumbai freight access'],
  [40, 41, 'physical_access', 0.82, true,  'Bandra-Worli Sea Link southern approach connects to Sion-Panvel Highway (Vashi Bridge corridor)'],
  [41, 42, 'physical_access', 0.80, true,  'Vashi Creek Bridge and Atal Setu (MTHL) share Navi Mumbai approach via Palm Beach Road'],
  [38, 39, 'physical_access', 0.78, true,  'JVLR intersects SCLR at Kurla-Santacruz junction; east-west suburban arterial crossroads'],

  // Rail station connections (CR, WR, Harbour Line)
  [44, 45, 'physical_access', 0.88, true,  'Mumbai Central / Churchgate to Dadar Junction via WR suburban rail'],
  [43, 45, 'physical_access', 0.90, true,  'CSMT to Dadar Junction via CR mainline and fast suburban rail'],
  [45, 46, 'physical_access', 0.85, true,  'Dadar Junction to Andheri Station via WR suburban rail'],
  [45, 47, 'physical_access', 0.88, true,  'Dadar Junction to Kurla via CR mainline and Harbour Line'],
  [47, 48, 'physical_access', 0.82, true,  'Kurla Station to Ghatkopar Station via CR suburban rail'],
  [47, 38, 'physical_access', 0.78, true,  'Kurla Station accesses JVLR via LBS Marg (major road-rail interchange)'],
  [56, 47, 'physical_access', 0.80, true,  'Thane Station to Kurla via CR suburban rail (key regional junction)'],

  // Metro connections
  [48, 52, 'physical_access', 0.85, true,  'Ghatkopar Station is eastern terminus of Metro Line 1; CR↔Metro interchange'],
  [46, 52, 'physical_access', 0.85, true,  'Andheri Station is mid-point hub on Metro Line 1 (Versova–Ghatkopar)'],
  [46, 53, 'physical_access', 0.80, true,  'Andheri Station connects to Metro Line 2A (south terminus at DN Nagar)'],
  [46, 54, 'physical_access', 0.80, true,  'Andheri East is southern terminus of Metro Line 7'],

  // Port connectivity
  [51, 42, 'physical_access', 0.85, true,  'JNPT Nhava Sheva Port connected via Atal Setu (MTHL) approach; cuts port access time by 60%'],

  // ──────────────────────────────────────────────────────────
  // TRANSPORT → EMERGENCY
  // Road and rail access enabling ambulance / fire / rescue deployment
  // ──────────────────────────────────────────────────────────
  [40, 72, 'physical_access', 0.85, true,  'Bandra-Worli Sea Link enables significantly faster ambulance access to KEM Hospital Parel from Bandra'],
  [34, 73, 'physical_access', 0.80, true,  'WEH Bandra exit provides primary ambulance access to Lilavati Hospital Bandra West'],
  [35, 74, 'physical_access', 0.75, true,  'EEH provides emergency vehicle access route to Sion Hospital'],
  [38, 76, 'physical_access', 0.72, true,  'JVLR provides ambulance corridor to Cooper Hospital Juhu from eastern zones'],
  [34, 79, 'physical_access', 0.75, true,  'WEH enables Fire Station Andheri rapid deployment to northern suburbs'],
  [36, 81, 'physical_access', 0.72, true,  'Eastern Freeway gives Fire Station Kurla rapid access to port and eastern zones'],

  // ──────────────────────────────────────────────────────────
  // TELECOM — INTERNAL
  // Submarine → Core DC → Fiber hubs → Cell towers
  // ──────────────────────────────────────────────────────────

  // Submarine cable → Core nodes
  [70, 57, 'data_link', 0.92, true,  'CLS Versova to Jio Data Center NM (international internet peering)'],
  [70, 67, 'data_link', 0.90, true,  'CLS Versova to Tata Comm Fiber Backbone (international transit traffic)'],

  // Core DC → Fiber hubs
  [57, 68, 'data_link', 0.95, true,  'Jio DC NM to Jio Fiber Hub Powai (inter-DC protected fiber ring)'],
  [58, 69, 'data_link', 0.90, true,  'Airtel NOC Powai to Airtel Fiber Hub Thane (ring backbone)'],

  // Fiber hubs → Exchanges / Cell towers (backhaul / fronthaul)
  [67, 59, 'data_link', 0.88, false, 'Tata Comm Backbone to MTNL Exchange Fort (wholesale broadband transit)'],
  [68, 61, 'data_link', 0.85, false, 'Jio Fiber Hub Powai to Jio 5G Tower BKC (fronthaul fiber)'],
  [69, 63, 'data_link', 0.80, false, 'Airtel Fiber Hub Thane to Jio 5G Tower Thane (shared fiber duct arrangement)'],
  [57, 64, 'data_link', 0.82, false, 'Jio DC to BSNL Tower Dadar (national roaming backhaul agreement)'],
  [67, 65, 'data_link', 0.90, false, 'Tata Comm Backbone to Airtel 5G Tower Colaba (enterprise backhaul)'],
  [60, 66, 'data_link', 0.85, false, 'Vi NOC Andheri to Vi 4G Tower Kurla (fronthaul fiber)'],
  [67, 71, 'data_link', 0.82, false, 'Tata Comm Backbone to MTNL Broadband Exchange Bandra (wholesale transit)'],
  [71, 59, 'data_link', 0.80, true,  'MTNL Exchange Bandra to MTNL Exchange Fort (MTNL internal core ring)'],

  // ──────────────────────────────────────────────────────────
  // TELECOM → EMERGENCY
  // Communications backbone feeding emergency services
  // ──────────────────────────────────────────────────────────
  [67, 86, 'data_link', 0.95, false, 'Tata Comm Fiber Backbone primary connectivity to Police Emergency Control Room (Dial 100)'],
  [61, 86, 'data_link', 0.85, false, 'Jio 5G Tower BKC wireless backup link to Police Emergency Control Room'],
  [67, 85, 'data_link', 0.92, false, 'Tata Comm Fiber Backbone to MCGM Disaster Control Room EOC (dedicated government circuit)'],
  [57, 72, 'data_link', 0.85, false, 'Jio DC to KEM Hospital HIS (Hospital Information System) and PACS (radiology)'],
  [67, 82, 'data_link', 0.88, false, 'Tata Comm Fiber Backbone to Mumbai Police Commissioner HQ'],
  [58, 73, 'data_link', 0.80, false, 'Airtel NOC Powai leased line to Lilavati Hospital network'],

  // ──────────────────────────────────────────────────────────
  // EMERGENCY — INTERNAL
  // Command-and-control, dispatch, coordination
  // ──────────────────────────────────────────────────────────
  [86, 85, 'operational', 0.92, true,  'Police Control Room (100) ↔ MCGM Disaster Control Room real-time event coordination'],
  [86, 78, 'operational', 0.88, false, 'Police Control Room (100) dispatches Mumbai Fire Brigade HQ Byculla'],
  [86, 79, 'operational', 0.85, false, 'Police Control Room (100) dispatches Fire Station Andheri'],
  [86, 80, 'operational', 0.82, false, 'Police Control Room (100) dispatches Fire Station Mulund'],
  [86, 81, 'operational', 0.80, false, 'Police Control Room (100) dispatches Fire Station Kurla'],
  [86, 82, 'operational', 0.90, false, 'Police Control Room (100) escalates major incidents to Police Commissioner HQ'],
  [85, 72, 'operational', 0.85, false, 'MCGM Disaster Control activates KEM Hospital mass-casualty surge protocol'],
  [85, 87, 'operational', 0.80, false, 'MCGM Disaster Control requests and directs NDRF 4th Battalion deployment'],
  [85, 88, 'operational', 0.78, false, 'MCGM Disaster Control activates BMC Flood Emergency Shelter Worli'],
  [82, 83, 'operational', 0.75, false, 'Police Commissioner HQ commands Bandra Police Station (Bandra Division)'],
  [82, 84, 'operational', 0.75, false, 'Police Commissioner HQ commands Kurla Police Station (Kurla Division)'],
  [85, 89, 'operational', 0.72, false, 'MCGM Disaster Control coordinates marine rescues with Indian Coast Guard Mumbai'],
  [87, 88, 'operational', 0.70, false, 'NDRF 4th Battalion provides relief personnel support to BMC Flood Shelter during major disasters'],
];

// ============================================================
// SEED FUNCTION
// ============================================================
async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexus';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  // Clear existing collections
  await InfrastructureNode.deleteMany({});
  await Dependency.deleteMany({});
  await Scenario.deleteMany({});
  await User.deleteMany({});
  await WeatherEvent.deleteMany({});
  await Alert.deleteMany({});
  console.log('Cleared existing data');

  // Insert nodes
  const createdNodes = await InfrastructureNode.insertMany(seedNodes);
  console.log(`Inserted ${createdNodes.length} infrastructure nodes`);

  // Build dependency documents (filter any accidental out-of-range indices)
  const depDocs = seedDependencies
    .filter(([src, tgt]) => src < createdNodes.length && tgt < createdNodes.length)
    .map(([src, tgt, depType, strength, bidir, desc]) => ({
      sourceNodeId:    createdNodes[src]._id,
      targetNodeId:    createdNodes[tgt]._id,
      dependencyType:  depType,
      strength,
      bidirectional:   bidir,
      description:     desc,
    }));

  const createdDeps = await Dependency.insertMany(depDocs);
  console.log(`Inserted ${createdDeps.length} dependencies`);

  // ── Scenarios ──────────────────────────────────────────────
  // Node indices match the 90-node array exactly.
  const scenarios = [
    {
      name: 'Trombay Thermal Power Plant Failure',
      description:
        'Trombay Thermal Power Station (1580 MW, 8 units) trips during peak monsoon season. '
        + 'Cascades to Dharavi 220kV Sub → KEM Hospital, Police HQ, MCGM Disaster Control, BKC Grid, CSMT signaling.',
      type: 'power_outage',
      initialFailures: [{ nodeId: createdNodes[0]._id, failureType: 'complete' }],
      parameters: { severity: 'critical', estimatedDuration: '12h', season: 'monsoon', affectedMW: 1580 },
    },
    {
      name: 'Bandra-Worli Sea Link Closure',
      description:
        'BWSL closed due to structural concerns during a cyclonic storm warning. '
        + 'Severs the fastest ambulance corridor to KEM Hospital; all WEH–South Mumbai traffic diverted via Mahim Causeway.',
      type: 'road_disruption',
      initialFailures: [{ nodeId: createdNodes[40]._id, failureType: 'complete' }],
      parameters: { severity: 'high', estimatedDuration: '48h', weather: 'cyclone' },
    },
    {
      name: 'Bhandup Complex WTP Contamination Event',
      description:
        'Major chemical contamination detected at Bhandup WTP (2135 MLD). '
        + 'Supply cut to 12M people; cascades to Veravali Pump, South Mumbai Distribution, hospitals and fire stations.',
      type: 'water_disruption',
      initialFailures: [{ nodeId: createdNodes[20]._id, failureType: 'complete' }],
      parameters: { severity: 'critical', estimatedDuration: '72h', affectedPopulationMillion: 12 },
    },
    {
      name: 'Monsoon Mega-Flood — Multi-System Cascade',
      description:
        '300 mm/day rainfall (2005-level event). Dharavi Substation floods → South Mumbai grid collapses. '
        + 'EEH closed (waterlogging at Sion). Vashi Bridge submerged. Kurla Station inundated. '
        + 'Simultaneous hospital power loss, telecom degradation, and road network isolation.',
      type: 'extreme_weather',
      initialFailures: [
        { nodeId: createdNodes[3]._id,  failureType: 'complete' },  // Dharavi 220kV Sub
        { nodeId: createdNodes[35]._id, failureType: 'complete' },  // EEH
        { nodeId: createdNodes[41]._id, failureType: 'complete' },  // Vashi Bridge
        { nodeId: createdNodes[47]._id, failureType: 'partial'  },  // Kurla Station
      ],
      parameters: { severity: 'catastrophic', estimatedDuration: '96h', rainfallMmPerDay: 300 },
    },
    {
      name: 'Submarine Cable Landing Station Damage',
      description:
        'CLS Versova damaged by ship anchor dragging across cable bundle. '
        + 'All MENA / i2i / TGN-EA / SMW-4 systems cut. International internet bandwidth drops >90%; '
        + 'Jio DC and Tata Comm Backbone lose peering; Police and EOC lose redundant circuits.',
      type: 'telecom_failure',
      initialFailures: [{ nodeId: createdNodes[70]._id, failureType: 'complete' }],
      parameters: { severity: 'high', estimatedDuration: '168h', internationalBandwidthLoss: '90%' },
    },
    {
      name: 'Dahanu Plant Unplanned Trip',
      description:
        'Dahanu Thermal Plant (500 MW) trips unexpectedly due to boiler tube leakage. '
        + 'Adani Electricity suburban grid (Andheri, Malad, Borivali) drops voltage; '
        + 'Metro Lines 2A and 7 traction supplies degrade; Salsette Substation on partial load.',
      type: 'power_outage',
      initialFailures: [{ nodeId: createdNodes[1]._id, failureType: 'complete' }],
      parameters: { severity: 'high', estimatedDuration: '8h', affectedMW: 500 },
    },
    {
      name: 'Veravali Main Pump Station Failure',
      description:
        'All 10 Veravali pumps fail due to electrical fault. '
        + 'Treated water cannot be pressurized to South Mumbai; Malabar Hill Reservoir drains within 6h; '
        + 'KEM Hospital, Nair Hospital, Fire Brigade HQ lose municipal water supply.',
      type: 'water_disruption',
      initialFailures: [{ nodeId: createdNodes[24]._id, failureType: 'complete' }],
      parameters: { severity: 'critical', estimatedDuration: '18h', affectedZone: 'South Mumbai' },
    },
  ];

  const createdScenarios = await Scenario.insertMany(scenarios);
  console.log(`Inserted ${createdScenarios.length} scenarios`);

  // ── Demo Users ─────────────────────────────────────────────
  const users = [
    { name: 'Admin User',       email: 'admin@nexus.gov.in',    password: 'admin123',    role: 'admin',    zone: 'Mumbai' },
    { name: 'Rajesh Sharma',    email: 'rajesh@mcgm.gov.in',    password: 'official123', role: 'official', zone: 'South Mumbai' },
    { name: 'Priya Desai',      email: 'priya@mcgm.gov.in',     password: 'official123', role: 'official', zone: 'Western Suburbs' },
    { name: 'Amit Patel',       email: 'amit@citizen.in',       password: 'citizen123',  role: 'citizen',  zone: 'Andheri' },
    { name: 'Sneha Kulkarni',   email: 'sneha@citizen.in',      password: 'citizen123',  role: 'citizen',  zone: 'Dadar-Prabhadevi' },
  ];

  for (const u of users) {
    await User.create(u);
  }
  console.log(`Created ${users.length} demo users`);

  // ── Monsoon / Flood-Risk WeatherEvents ────────────────────
  // Logical IDs map to createdNodes[] by sector index ranges.
  const logicalNodeMap: Record<string, mongoose.Types.ObjectId> = {
    p2: createdNodes[1]._id,
    p3: createdNodes[2]._id,
    p4: createdNodes[3]._id,
    p5: createdNodes[4]._id,
    p6: createdNodes[5]._id,
    p8: createdNodes[7]._id,
    p9: createdNodes[8]._id,
    p10: createdNodes[9]._id,
    p11: createdNodes[10]._id,
    w4: createdNodes[23]._id,
    w5: createdNodes[24]._id,
    w8: createdNodes[27]._id,
    w9: createdNodes[28]._id,
    t1: createdNodes[34]._id,
    t2: createdNodes[35]._id,
    t3: createdNodes[36]._id,
    t4: createdNodes[37]._id,
    t6: createdNodes[39]._id,
    t7: createdNodes[40]._id,
    t8: createdNodes[41]._id,
    t9: createdNodes[42]._id,
    t10: createdNodes[43]._id,
    t11: createdNodes[44]._id,
    c2: createdNodes[58]._id,
    c3: createdNodes[59]._id,
    c5: createdNodes[61]._id,
    c7: createdNodes[63]._id,
    c8: createdNodes[64]._id,
    e3: createdNodes[74]._id,
    e4: createdNodes[75]._id,
    e5: createdNodes[76]._id,
    e6: createdNodes[77]._id,
  };

  const weatherEvents = [
    {
      zoneName: 'Dharavi',
      season: 'monsoon',
      riskMultiplier: 2.1,
      floodZone: true,
      historicalFailures: 47,
      affectedNodeIds: [logicalNodeMap.p2, logicalNodeMap.p9, logicalNodeMap.c5, logicalNodeMap.e5, logicalNodeMap.t6],
    },
    {
      zoneName: 'Sion',
      season: 'monsoon',
      riskMultiplier: 1.9,
      floodZone: true,
      historicalFailures: 38,
      affectedNodeIds: [logicalNodeMap.p3, logicalNodeMap.p11, logicalNodeMap.t2, logicalNodeMap.c8],
    },
    {
      zoneName: 'Kurla East',
      season: 'monsoon',
      riskMultiplier: 1.7,
      floodZone: true,
      historicalFailures: 31,
      affectedNodeIds: [logicalNodeMap.p9, logicalNodeMap.t6, logicalNodeMap.t11, logicalNodeMap.w4],
    },
    {
      zoneName: 'Andheri Subway',
      season: 'monsoon',
      riskMultiplier: 1.6,
      floodZone: true,
      historicalFailures: 29,
      affectedNodeIds: [logicalNodeMap.t3, logicalNodeMap.t4, logicalNodeMap.p5, logicalNodeMap.w5, logicalNodeMap.c3],
    },
    {
      zoneName: 'Malad Creek',
      season: 'monsoon',
      riskMultiplier: 1.5,
      floodZone: true,
      historicalFailures: 22,
      affectedNodeIds: [logicalNodeMap.p10, logicalNodeMap.t9, logicalNodeMap.w5],
    },
    {
      zoneName: 'Ghatkopar',
      season: 'monsoon',
      riskMultiplier: 1.8,
      floodZone: true,
      historicalFailures: 35,
      affectedNodeIds: [logicalNodeMap.w4, logicalNodeMap.t11, logicalNodeMap.p9],
    },
    {
      zoneName: 'Bandra Low-lying',
      season: 'monsoon',
      riskMultiplier: 1.3,
      floodZone: false,
      historicalFailures: 14,
      affectedNodeIds: [logicalNodeMap.t1, logicalNodeMap.t10, logicalNodeMap.e6],
    },
    {
      zoneName: 'Worli Seafront',
      season: 'monsoon',
      riskMultiplier: 1.4,
      floodZone: true,
      historicalFailures: 18,
      affectedNodeIds: [logicalNodeMap.w8, logicalNodeMap.t1, logicalNodeMap.c2],
    },
    {
      zoneName: 'Colaba Tip',
      season: 'monsoon',
      riskMultiplier: 1.2,
      floodZone: false,
      historicalFailures: 9,
      affectedNodeIds: [logicalNodeMap.p8, logicalNodeMap.e3, logicalNodeMap.e4],
    },
    {
      zoneName: 'Trombay Creek',
      season: 'monsoon',
      riskMultiplier: 1.5,
      floodZone: true,
      historicalFailures: 21,
      affectedNodeIds: [logicalNodeMap.p4, logicalNodeMap.t7],
    },
    {
      zoneName: 'Powai Overflow',
      season: 'monsoon',
      riskMultiplier: 1.6,
      floodZone: true,
      historicalFailures: 26,
      affectedNodeIds: [logicalNodeMap.w9, logicalNodeMap.c7, logicalNodeMap.p6],
    },
    {
      zoneName: 'Vikhroli Mangrove',
      season: 'monsoon',
      riskMultiplier: 1.3,
      floodZone: false,
      historicalFailures: 11,
      affectedNodeIds: [logicalNodeMap.t8, logicalNodeMap.p4],
    },
  ];

  const createdWeatherEvents = await WeatherEvent.insertMany(weatherEvents);
  const monsoonCount = await WeatherEvent.countDocuments({ season: 'monsoon' });
  console.log(`Inserted ${createdWeatherEvents.length} monsoon weather events`);
  console.log(`Monsoon WeatherEvent count: ${monsoonCount}`);
  if (monsoonCount !== 12) {
    throw new Error(`Expected 12 monsoon weather events, found ${monsoonCount}`);
  }

  // ── Ward Alerts ───────────────────────────────────────────
  const nodeByName = (name: string) => {
    const n = createdNodes.find((x) => x.name === name);
    if (!n) throw new Error(`Missing node for alert seed: ${name}`);
    return n;
  };

  const alerts = [
    // Dharavi (4: 2 critical, 1 warning, 1 info)
    {
      nodeId: nodeByName('Dharavi 220kV Substation')._id,
      severity: 'critical',
      title: 'Dharavi Substation Overload Spike',
      description: 'Load on Dharavi 220kV Substation crossed safe threshold during evening peak. Local outages possible if demand does not drop.',
      wardId: 'Dharavi',
    },
    {
      nodeId: nodeByName('Dharavi Intermediate Pump Station')._id,
      severity: 'critical',
      title: 'Pump Failure Risk at Dharavi Station',
      description: 'Two pumps at Dharavi Intermediate Pump Station are operating above normal duty cycle. Water pressure may fall in nearby blocks.',
      wardId: 'Dharavi',
    },
    {
      nodeId: nodeByName('Kurla Station & LTT (CR + Harbour Line)')._id,
      severity: 'warning',
      title: 'Kurla Station Congestion Advisory',
      description: 'Flood-prone approaches near Kurla Station are seeing heavy congestion. Emergency access lanes should be kept clear.',
      wardId: 'Dharavi',
    },
    {
      nodeId: nodeByName('KEM Hospital (King Edward Memorial)')._id,
      severity: 'info',
      title: 'KEM Hospital Backup Drills Completed',
      description: 'KEM Hospital completed backup power and triage response drills. No service disruption reported.',
      wardId: 'Dharavi',
    },

    // Sion (2)
    {
      nodeId: nodeByName('Sion Hospital (LTM General)')._id,
      severity: 'warning',
      title: 'Sion Hospital Ambulance Queue Delay',
      description: 'Average ambulance handover time at Sion Hospital rose above target due to high emergency admissions.',
      wardId: 'Sion',
    },
    {
      nodeId: nodeByName('Eastern Express Highway (EEH / NH-48 spur)')._id,
      severity: 'info',
      title: 'EEH Drainage Clearance Update',
      description: 'Drainage desilting along EEH near Sion completed for this week. Travel remains normal.',
      wardId: 'Sion',
    },

    // Andheri (2)
    {
      nodeId: nodeByName('Andheri Distribution Hub')._id,
      severity: 'warning',
      title: 'Andheri Grid Voltage Fluctuation',
      description: 'Andheri Distribution Hub reported short voltage dips during peak load transfer. Sensitive equipment should use stabilizers.',
      wardId: 'Andheri',
    },
    {
      nodeId: nodeByName('Fire Station Andheri')._id,
      severity: 'info',
      title: 'Andheri Fire Response Drill',
      description: 'Fire Station Andheri completed rapid response drill across western corridor with normal turnout times.',
      wardId: 'Andheri',
    },

    // Bandra (2)
    {
      nodeId: nodeByName('Bandra-Worli Sea Link (BWSL)')._id,
      severity: 'warning',
      title: 'High Wind Watch on BWSL',
      description: 'Traffic authorities issued high-wind watch on Bandra-Worli Sea Link. Speed restrictions may apply during gust periods.',
      wardId: 'Bandra',
    },
    {
      nodeId: nodeByName('Lilavati Hospital')._id,
      severity: 'info',
      title: 'Lilavati Emergency Bed Availability Stable',
      description: 'Lilavati Hospital reports stable emergency bed availability for the next 12 hours.',
      wardId: 'Bandra',
    },

    // Worli (2)
    {
      nodeId: nodeByName('Worli-Prabhadevi Water Distribution')._id,
      severity: 'critical',
      title: 'Low Pressure Alert in Worli Main',
      description: 'Worli-Prabhadevi Water Distribution line pressure dropped below safety threshold. Intermittent supply expected in high-rise zones.',
      wardId: 'Worli',
    },
    {
      nodeId: nodeByName('BMC Flood Emergency Shelter Worli')._id,
      severity: 'info',
      title: 'Worli Shelter Readiness Confirmed',
      description: 'BMC Flood Emergency Shelter at Worli confirmed readiness and stock checks for monsoon contingency.',
      wardId: 'Worli',
    },
  ];

  const createdAlerts = await Alert.insertMany(alerts);
  console.log(`Inserted ${createdAlerts.length} ward alerts`);

  // ── Summary ────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────');
  console.log('  Seed complete! Summary');
  console.log('─────────────────────────────────────────────');
  console.log(`  Nodes       : ${createdNodes.length}`);
  console.log(`  Dependencies: ${createdDeps.length}`);
  console.log(`  Scenarios   : ${createdScenarios.length}`);
  console.log(`  Users       : ${users.length}`);
  console.log(`  WeatherEvts : ${createdWeatherEvents.length}`);
  console.log(`  Alerts      : ${createdAlerts.length}`);

  const sectors: Record<string, number> = {};
  for (const n of createdNodes) {
    sectors[n.type] = (sectors[n.type] || 0) + 1;
  }
  console.log('\n  Nodes by sector:');
  for (const [sector, count] of Object.entries(sectors)) {
    console.log(`    ${sector.padEnd(10)}: ${count}`);
  }

  console.log('\n  Demo credentials:');
  console.log('    Admin    : admin@nexus.gov.in   / admin123');
  console.log('    Official : rajesh@mcgm.gov.in   / official123');
  console.log('    Citizen  : amit@citizen.in       / citizen123');
  console.log('─────────────────────────────────────────────\n');

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});