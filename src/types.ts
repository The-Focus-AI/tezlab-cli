export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

export interface TokenData {
  access_token: string;
  created_at: number;
  expires_in: number;
}

export interface Vehicle {
  id: string;
  vin: string;
  display_name: string;
  car_type: string;
  car_type_full?: string;
  make: string;
  battery_level: number;
  charging: boolean | null;
  locked: boolean | null;
  sentry: boolean | null;
  polling_enabled: boolean;
}

export interface VehicleData {
  id: string;
  last_latitude: number;
  last_longitude: number;
  model_name: string;
  last_log_time: number;
  last_heading: number | null;
  software_version: string | null;
  last_battery_range: number | null;
  last_battery_range_units: string;
  est_eff: number;
  deepsleep_supported: boolean;
  deepsleep: boolean;
}

export interface TezlabResponse {
  vehicle: {
    available_vehicles: Vehicle[];
    selected_vehicle: string;
    data: VehicleData;
  };
}

export interface LocationInfo {
  address: {
    road?: string;
    city?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export interface RangeLost {
  low: number;
  medium: number;
  high: number;
  phantom: number;
  units: string;
  low_string: string;
  medium_string: string;
  high_string: string;
  phantom_string: string;
}

export interface ChargeReport {
  id: number;
  start_time_ms: number;
  stop_time_ms: number;
  start_percent: number;
  end_percent: number;
  vehicle: Vehicle;
  est_max_range: number;
  est_max_range_units: string;
  unplugged: string;
  distance_traveled: number;
  distance_traveled_units: string;
  unused_range: number;
  remaining_range: number;
  efficiency: number;
  efficiency_string: string;
  overall_efficiency: number;
  overall_efficiency_string: string;
  average_temp: number;
  average_temp_units: string;
  climate_mins_idle: number;
  climate_mins_idle_duration_string: string;
  sentry_mins_idle: number;
  sentry_mins_idle_duration_string: string;
  num_trips: number;
  longest_trip: number;
  longest_trip_units: string;
  elec_cost_string: string;
  est_fuel_savings_string: string;
  energy_used_string: string;
  range_lost_by_drive_efficiency: RangeLost;
}

export interface Config {
  BASE_URL: string;
  CLIENT_ID: string;
  CLIENT_SECRET: string;
  TOKEN_FILE: string;
}

export interface ChargeSession {
  id: number;
  detail: string;
  display_type: string;
  subscription_limited: boolean;
  battery_detail: string;
  battery_detail_action: string | null;
  has_charged_since: boolean;
  range_lost_by_drive_efficiency: RangeLost;
  range_used_string: string;
  start_time_ms: number;
  stop_time_ms: number;
  start_percent: number;
  end_percent: number;
  vehicle: {
    id: number;
    display_name: string;
    car_type: string;
  };
  est_max_range: number;
  est_max_range_units: string;
  est_max_range_string: string;
  unplugged: string;
  distance_traveled: number;
  distance_traveled_units: string;
  distance_traveled_string: string;
  line_detail_autoload: string;
  line_detail_request: string | null;
  unused_range: number;
  remaining_range: number;
  efficiency: number | null;
  efficiency_string: string;
  overall_efficiency: number | null;
  overall_efficiency_string: string;
  average_temp: number;
  average_temp_units: string;
  average_temp_string: string;
  climate_mins_idle: number;
  climate_mins_idle_duration_string: string;
  sentry_mins_idle: number;
  sentry_mins_idle_duration_string: string;
  sentry_string: string;
  sentry_icon: string;
  cabin_overheat_show: boolean;
  cabin_overheat_mins_idle: number;
  cabin_overheat_idle_duration_string: string;
  battery_heater_show: boolean;
  battery_heater_mins_idle: number;
  battery_heater_idle_duration_string: string;
  num_trips: number;
  longest_trip: number;
  longest_trip_units: string;
  longest_trip_string: string;
  elec_cost_string: string;
  est_fuel_savings_string: string;
  energy_used_string: string;
}

export interface RoadTrip {
  id: string;
  detail: string;
  subscription_limited: boolean;
  finalized: boolean;
  delete: string;
  display_type: string;
  title: string;
  start_time_ms: number;
  stop_time_ms: number;
  distance_traveled: number;
  distance_traveled_units: string;
  distance_traveled_string: string;
  route: {
    lines: string[];
    drive_markers: {
      latitude: number;
      longitude: number;
      type: string;
    }[];
    charger_markers: {
      latitude: number;
      longitude: number;
      fast: boolean;
      type: string;
    }[];
  };
}

export interface RoadTripsResponse {
  road_trips: RoadTrip[];
  meta: {
    current_page: number;
    next_page: number | null;
    prev_page: number | null;
    total_pages: number;
    total_count: number;
    per_page: number;
    allow_create_road_trip: boolean;
    feature_sample: {
      [key: string]: {
        available: boolean;
        next_available: string | null;
        num_available: number | null;
        user_pro: boolean;
      };
    };
  };
}

export interface StatItem {
  title: string;
  display_type: string;
  icon: string;
  stat: string;
  summary: boolean;
}

export interface StatsResponse {
  id: number;
  from_date: number;
  model_name: string;
  efficiency_string: string;
  avg_speed_string: string;
  stats: StatItem[];
  efficiency_pct: string;
  vehicle_id: number;
  vehicle_tesla_id: number;
  vehicle_vin: string;
}

export interface TrendItem {
  day: number;
  day_str: string;
  dist_mi: number;
  bar_h: number;
}

export interface TrendsResponse {
  trends: TrendItem[];
}

export interface Award {
  award: string;
  user_id: number;
  name: string;
  image: string;
  award_string: string;
  model_name: string;
}

export interface Rating {
  rating: number;
  responses: number;
}

export interface RatingCategory {
  [key: string]: Rating;
}

export interface Supercharger {
  id: number | null;
  uuid?: string;
  name: string;
  address?: string;
  latitude: number | string;
  longitude: number | string;
  stalls?: number;
  status?: string;
  distance?: number;
  distance_units?: string;
  power?: number;
  visited?: boolean;
  num_comments?: number;
  awards?: Award[];
  rating?: RatingCategory;
}

export interface SuperchargersResponse {
  superchargers: Supercharger[];
}

export interface StallCount {
  total?: number;
  available?: number;
  in_use?: number;
}

export interface Review {
  id: number;
  comment: string;
  created_at: string;
  user_name: string;
}

export interface CostInfo {
  cost_type: string;
  updated_recently: boolean;
  user_free_supercharging: boolean;
  local: {
    tier_1: string | null;
    tier_1_string: string | null;
    tier_2: string | null;
    tier_2_string: string | null;
    kwh: string | null;
    kwh_string: string | null;
  };
  usd: {
    tier_1: string | null;
    tier_2: string | null;
    kwh: string | null;
  };
}

export interface Currency {
  description: string;
  code: string;
  symbol: string;
  symbol_display: string;
  usd_exchange: number;
  usd_exchange_date: number;
  is_user_default: boolean;
}

export interface SuperchargerDetail extends Supercharger {
  hours?: string;
  amenities?: string[];
  stall_count?: StallCount;
  reviews?: Review[];
  photos?: string[];
  detail?: string;
  cost_string?: string;
  cost?: CostInfo;
  currency_local?: Currency;
  user_num_charges_string?: string;
  user_total_cost_string?: string;
  user_range_added_string?: string;
  user_avg_session_length?: string;
  tile_url?: string;
}
