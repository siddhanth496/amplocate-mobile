import { api } from './client';
import type { CatalogEntry, Charger, ChargerDetail, Stats, TripPlan, Vehicle } from './types';

// ── Auth ──
export const sendOtp = (phone: string) =>
  api.post<{ message: string; dev_otp: string | null }>('/auth/otp/request', { phone }, false);

export const verifyOtp = (phone: string, code: string) =>
  api.post<{ access_token: string; is_new_user: boolean }>('/auth/otp/verify', { phone, code }, false);

export const getMe = () => api.get<{ id: string; phone: string; name: string | null }>('/auth/me');
export const updateMe = (updates: { name?: string }) => api.patch('/auth/me', updates);
export const getMyStats = () => api.get<Stats>('/auth/me/stats');

// ── Vehicles ──
export const getCatalog = () => api.get<CatalogEntry[]>('/vehicles/catalog', undefined, false);
export const listMyVehicles = () => api.get<Vehicle[]>('/vehicles');
export const addVehicle = (payload: Record<string, unknown>) => api.post<Vehicle>('/vehicles', payload);
export const updateVehicle = (id: string, body: { battery_soc?: number; is_default?: boolean }) =>
  api.patch<Vehicle>(`/vehicles/${id}`, body);
export const deleteVehicle = (id: string) => api.delete(`/vehicles/${id}`);

// ── Chargers ──
export const getNearby = (params: {
  lat: number; lng: number; radius_km?: number; connector_type?: string;
  min_reliability?: number; vehicle_id?: string; limit?: number;
}) => api.get<Charger[]>('/chargers/nearby', params);

export const getCharger = (id: string) => api.get<ChargerDetail>(`/chargers/${id}`);

export const submitReport = (chargerId: string, body: { report_type: string; comment?: string }) =>
  api.post(`/chargers/${chargerId}/reports`, body);

// ── Trips ──
export const planTrip = (body: {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  waypoints?: { lat: number; lng: number }[];
  vehicle_id: string;
  departure_soc?: number;
  pinned_chargers?: Record<string, string>;
  waypoint_charges?: Record<string, string>;
}) => api.post<TripPlan>('/trips/plan', body);

// ── Geocoding (OpenStreetMap Nominatim, free) ──
export async function searchPlaces(q: string) {
  const resp = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=in&q=${encodeURIComponent(q)}`,
    { headers: { Accept: 'application/json', 'User-Agent': 'Amplocate/0.1' } },
  );
  const data: any[] = await resp.json();
  return data.map((r) => ({
    label: String(r.display_name).split(',').slice(0, 3).join(','),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}
