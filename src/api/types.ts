export type Connector = { type: string; power_kw: number; count?: number };

export type Charger = {
  id: string;
  name: string;
  operator: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  connectors: Connector[];
  price_per_kwh: number | null;
  status: string;
  is_p2p: boolean;
  amenities: string[];
  reliability_score: number;
  last_verified_at: string | null;
  distance_km?: number | null;
  compatible?: boolean | null;
};

export type Report = {
  id: string;
  charger_id: string;
  report_type: string;
  comment: string | null;
  created_at: string;
};

export type ChargerDetail = Charger & { recent_reports: Report[] };

export type Vehicle = {
  id: string;
  make: string;
  model: string;
  category: string;
  battery_kwh: number;
  efficiency_wh_per_km: number;
  connector_types: string[];
  max_dc_power_kw: number;
  battery_soc: number;
  is_default: boolean;
};

export type CatalogEntry = Omit<Vehicle, 'battery_soc' | 'is_default'>;

export type TripStop = {
  charger: Charger;
  backup_charger: Charger | null;
  arrival_soc: number;
  target_soc: number;
  dwell_minutes: number;
  energy_to_add_kwh: number;
  estimated_cost: number | null;
  leg_index: number;
  alternatives: TripStop[];
};

export type TripPlan = {
  feasible: boolean;
  stops: TripStop[];
  suggestions: TripStop[];
  destination_arrival_soc: number | null;
  total_distance_km: number;
  drive_minutes: number;
  total_trip_minutes: number | null;
  confidence: 'high' | 'medium' | 'low';
  warnings: string[];
  note: string | null;
};

export type Stats = {
  sessions_total: number;
  sessions_successful: number;
  success_rate: number | null;
  energy_kwh: number;
  est_cost_inr: number;
  co2_saved_kg: number;
  reports_count: number;
  chargers_visited: number;
  vehicles_count: number;
  recent_sessions: {
    charger_id: string;
    charger_name: string;
    started_at: string;
    energy_kwh: number | null;
    successful: boolean | null;
  }[];
};

export type Place = { label: string; lat: number; lng: number };
