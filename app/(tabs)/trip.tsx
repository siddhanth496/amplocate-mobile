import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import * as Location from 'expo-location';
import {
  Route as RouteIcon, Circle, MapPin, Flag, Plus, X, ArrowUpDown,
  BatteryCharging, Clock, Zap, IndianRupee, ShieldCheck, AlertTriangle,
  Navigation, Sparkles, ChevronRight,
} from 'lucide-react-native';
import { listMyVehicles, planTrip } from '@/api/endpoints';
import type { Place, TripPlan, TripStop, Vehicle } from '@/api/types';
import { colors, font, radius } from '@/theme/tokens';
import { Btn, Card, Display, ErrorNote, RelRing, Txt } from '@/components/ui';
import PlaceSearch from '@/components/PlaceSearch';
import MapWebView from '@/components/MapWebView';

const MAX_WAYPOINTS = 3;

type Points = { origin: Place | null; waypoints: (Place | null)[]; dest: Place | null };

export default function TripScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [points, setPoints] = useState<Points>({ origin: null, waypoints: [], dest: null });
  const [soc, setSoc] = useState(80);
  const [active, setActive] = useState<string | null>('dest');
  const [pins, setPins] = useState<Record<number, string>>({});
  // waypoint index -> charger id: "I'll charge here" declarations (hop mechanic)
  const [wpCharges, setWpCharges] = useState<Record<number, string>>({});
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listMyVehicles().then((vs) => {
      setVehicles(vs);
      const def = vs.find((v) => v.is_default) || vs[0];
      if (def) { setVehicleId(def.id); setSoc(Math.round(def.battery_soc)); }
    }).catch((e) => setError(e.message));
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setPoints((p) => p.origin ? p : { ...p, origin: { label: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude } });
    })();
  }, []);

  const reset = () => { setPlan(null); setPins({}); };

  const setPoint = (place: Place) => {
    reset();
    setPoints((p) => {
      if (active === 'origin') return { ...p, origin: place };
      if (active === 'dest') return { ...p, dest: place };
      if (active?.startsWith('wp-')) {
        const i = Number(active.slice(3));
        const wps = [...p.waypoints]; wps[i] = place;
        return { ...p, waypoints: wps };
      }
      return p;
    });
    setActive(null);
  };

  const runPlan = async (
    pinned: Record<number, string> = pins,
    wpsOverride?: Place[],
    chargesOverride?: Record<number, string>,
  ) => {
    const wps = (wpsOverride ?? points.waypoints.filter(Boolean)) as Place[];
    if (!points.origin || !points.dest || !vehicleId) return;
    setBusy(true); setError(null);
    try {
      const res = await planTrip({
        origin: { lat: points.origin.lat, lng: points.origin.lng },
        destination: { lat: points.dest.lat, lng: points.dest.lng },
        waypoints: wps.map((w) => ({ lat: w.lat, lng: w.lng })),
        vehicle_id: vehicleId,
        departure_soc: soc,
        pinned_chargers: Object.fromEntries(Object.entries(pinned).map(([k, v]) => [String(k), v])),
        waypoint_charges: Object.fromEntries(
          Object.entries(chargesOverride ?? wpCharges).map(([k, v]) => [String(k), v]),
        ),
      });
      setPlan(res);
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  const pickAlternative = (legIndex: number, chargerId: string) => {
    const next = { ...pins, [legIndex]: chargerId };
    setPins(next);
    runPlan(next);
  };

  const rows = [
    { id: 'origin', label: 'From', value: points.origin, Icon: Circle, color: colors.brand },
    ...points.waypoints.map((w, i) => ({
      id: `wp-${i}`, label: `Stop ${i + 1}`, value: w, Icon: MapPin, color: colors.amber, wpIndex: i,
    })),
    { id: 'dest', label: 'To', value: points.dest, Icon: Flag, color: colors.rose },
  ];

  const chargeStops = plan?.stops || [];
  const legs = [points.origin, ...points.waypoints.filter(Boolean), points.dest].filter(Boolean) as Place[];

  const routePoints = useMemo(() => {
    if (legs.length < 2) return null;
    const pts: [number, number][] = [];
    legs.forEach((p, i) => {
      pts.push([p.lat, p.lng]);
      const s = chargeStops.find((x) => x.leg_index === i);
      if (s) pts.push([s.charger.lat, s.charger.lng]);
    });
    return pts;
  }, [legs, chargeStops]);

  const markers = useMemo(() => {
    const m: { lat: number; lng: number; color: string; label?: string }[] = [];
    if (points.origin) m.push({ lat: points.origin.lat, lng: points.origin.lng, color: '#a3e635', label: 'Start' });
    points.waypoints.filter(Boolean).forEach((w, i) => m.push({ lat: w!.lat, lng: w!.lng, color: '#fbbf24', label: `Stop ${i + 1}` }));
    if (points.dest) m.push({ lat: points.dest.lat, lng: points.dest.lng, color: '#fb7185', label: 'End' });
    return m;
  }, [points]);

  const mapCenter: [number, number] = legs.length
    ? [legs.reduce((a, p) => a + p.lat, 0) / legs.length, legs.reduce((a, p) => a + p.lng, 0) / legs.length]
    : [12.9716, 77.5946];

  const ready = points.origin && points.dest && vehicleId && points.waypoints.every(Boolean);
  const vehicle = vehicles.find((v) => v.id === vehicleId);
  const confColor = plan ? ({ high: colors.emerald, medium: colors.amber, low: colors.rose } as const)[plan.confidence] : colors.textTertiary;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40, gap: 14 }}
    >
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <RouteIcon size={19} color={colors.brand} />
          <Display size={19}>Plan a trip</Display>
        </View>
        <Txt size={11} color={colors.textTertiary} style={{ marginTop: 3 }}>
          Risk-free by design — 15% reserve, worst-case range, verified backups on every leg.
        </Txt>
      </View>

      {/* Map preview */}
      <View style={{ height: 200, borderRadius: radius.r5, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
        <MapWebView
          center={mapCenter}
          zoom={legs.length >= 2 ? 9 : 11}
          chargers={chargeStops.flatMap((s) => [s.charger, ...(s.backup_charger ? [s.backup_charger] : [])])}
          markers={markers}
          routePoints={routePoints}
          onMapPress={(lat, lng) => {
            if (!active) return;
            setPoint({ label: `Pinned (${lat.toFixed(3)}, ${lng.toFixed(3)})`, lat, lng });
          }}
          onChargerPress={(id) => router.push(`/charger/${id}`)}
          style={{ flex: 1 }}
        />
        {active && (
          <View style={{
            position: 'absolute', top: 10, alignSelf: 'center',
            backgroundColor: 'rgba(18,21,25,0.9)', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
          }}>
            <Txt size={11} family={font.semi}>Tap the map to set {active === 'origin' ? 'start' : active === 'dest' ? 'destination' : 'this stop'}</Txt>
          </View>
        )}
      </View>

      {/* Stops editor */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            {rows.map((row, idx) => (
              <View key={row.id}>
                {idx > 0 && <View style={{ height: 1, backgroundColor: colors.line, marginLeft: 44 }} />}
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Pressable onPress={() => { setActive(active === row.id ? null : row.id); }}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                    <row.Icon size={14} color={row.color} fill={row.id === 'origin' ? row.color : 'none'} />
                    <View style={{ flex: 1 }}>
                      <Txt size={9} family={font.bold} color={active === row.id ? colors.brand : colors.textTertiary}
                        style={{ letterSpacing: 1, textTransform: 'uppercase' }}>
                        {row.label}
                      </Txt>
                      <Txt size={13} family={font.semi} numberOfLines={1}
                        color={row.value ? colors.textPrimary : colors.textTertiary}>
                        {row.value ? row.value.label : row.id === 'dest' ? 'Where to?' : 'Choose a place'}
                      </Txt>
                    </View>
                  </Pressable>
                  {'wpIndex' in row && (
                    <Pressable onPress={() => {
                      const rm = (row as any).wpIndex as number;
                      reset();
                      setWpCharges((c) => {
                        const next: Record<number, string> = {};
                        for (const [k, v] of Object.entries(c)) {
                          const idx = Number(k);
                          if (idx === rm) continue;
                          next[idx > rm ? idx - 1 : idx] = v;
                        }
                        return next;
                      });
                      setPoints((p) => ({ ...p, waypoints: p.waypoints.filter((_, x) => x !== rm) }));
                      setActive(null);
                    }}
                      style={{ padding: 12 }}>
                      <X size={14} color={colors.textTertiary} />
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </View>
          <View style={{ justifyContent: 'center', gap: 8, paddingRight: 12 }}>
            <Pressable onPress={() => { reset(); setPoints((p) => ({ ...p, origin: p.dest, dest: p.origin })); }}
              style={{ backgroundColor: colors.surface2, borderRadius: radius.r2, padding: 9 }}>
              <ArrowUpDown size={14} color={colors.textSecondary} />
            </Pressable>
            {points.waypoints.length < MAX_WAYPOINTS && (
              <Pressable onPress={() => { reset(); setPoints((p) => ({ ...p, waypoints: [...p.waypoints, null] })); setActive(`wp-${points.waypoints.length}`); }}
                style={{ backgroundColor: colors.brandSoft, borderRadius: radius.r2, padding: 9 }}>
                <Plus size={14} color={colors.brand} />
              </Pressable>
            )}
          </View>
        </View>
        {active && (
          <View style={{ padding: 12, paddingTop: 0 }}>
            <PlaceSearch
              autoFocus
              placeholder={active === 'origin' ? 'Search starting point…' : active === 'dest' ? 'Search destination…' : 'Search this stop…'}
              allowMyLocation={active === 'origin'}
              onSelect={setPoint}
            />
          </View>
        )}
      </Card>

      {/* Vehicle + battery */}
      <Card style={{ padding: 12 }}>
        {vehicles.length === 0 ? (
          <Btn label="+ Add your EV to plan trips" kind="soft" onPress={() => router.push('/add-vehicle')} />
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable onPress={() => {
              const idx = vehicles.findIndex((v) => v.id === vehicleId);
              const next = vehicles[(idx + 1) % vehicles.length];
              setVehicleId(next.id); setSoc(Math.round(next.battery_soc)); reset();
            }} style={{ backgroundColor: colors.surface2, borderRadius: radius.r2, paddingHorizontal: 10, paddingVertical: 8, maxWidth: 130 }}>
              <Txt size={11} family={font.semi} numberOfLines={1}>{vehicle ? `${vehicle.make} ${vehicle.model}` : '—'}</Txt>
            </Pressable>
            <Slider
              style={{ flex: 1 }}
              minimumValue={5} maximumValue={100} step={1}
              value={soc}
              onValueChange={(v: number) => setSoc(Math.round(v))}
              onSlidingComplete={() => reset()}
              minimumTrackTintColor={colors.brand}
              maximumTrackTintColor={colors.surface3}
              thumbTintColor={colors.brand}
            />
            <Txt size={14} family={font.bold} color={soc < 20 ? colors.rose : colors.brand} style={{ width: 42, textAlign: 'right' }}>
              {soc}%
            </Txt>
          </View>
        )}
      </Card>

      {!plan && (
        <Btn
          label={busy ? 'Planning your trip…'
            : !points.dest ? 'Choose a destination'
            : !points.origin ? 'Choose a starting point'
            : !points.waypoints.every(Boolean) ? 'Finish adding your stops'
            : 'Plan my trip'}
          loading={busy}
          disabled={!ready}
          onPress={() => runPlan({})}
        />
      )}

      {error && <ErrorNote message={error} />}

      {plan && (
        <>
          {/* Summary hero */}
          <View style={{
            borderRadius: radius.r5, padding: 18,
            backgroundColor: colors.brandDeep, borderWidth: 1, borderColor: 'rgba(163,230,53,0.25)',
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Display size={15}>
                {plan.feasible ? (chargeStops.length === 0 ? 'No charging needed ⚡' : `${chargeStops.length} charging stop${chargeStops.length > 1 ? 's' : ''}`) : 'Not safely plannable'}
              </Display>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Txt size={9} family={font.bold} color={confColor} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                    {plan.confidence}
                  </Txt>
                </View>
                <Pressable onPress={reset} style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                  <Txt size={10} family={font.bold}>Edit</Txt>
                </Pressable>
              </View>
            </View>
            <View style={{ flexDirection: 'row', marginTop: 14 }}>
              {[
                [`${plan.total_distance_km}`, 'km'],
                [plan.total_trip_minutes ? `${Math.floor(plan.total_trip_minutes / 60)}h ${Math.round(plan.total_trip_minutes % 60)}m` : '—', 'total time'],
                [plan.destination_arrival_soc != null ? `${plan.destination_arrival_soc}%` : '—', 'arrival battery'],
              ].map(([v, l]) => (
                <View key={l as string} style={{ flex: 1 }}>
                  <Display size={19}>{v}</Display>
                  <Txt size={9} color={colors.textTertiary} style={{ marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>{l}</Txt>
                </View>
              ))}
            </View>
          </View>

          {plan.warnings?.map((w, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8, backgroundColor: colors.amberSoft, borderRadius: radius.r3, padding: 12 }}>
              <AlertTriangle size={13} color={colors.amber} style={{ marginTop: 1 }} />
              <Txt size={12} color={colors.amber} style={{ flex: 1 }}>{w}</Txt>
            </View>
          ))}

          {!plan.feasible && plan.note && <ErrorNote message={plan.note} />}

          {/* Reachable chargers you can hop to when the trip isn't plannable */}
          {!plan.feasible && plan.suggestions?.length > 0 && (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <BatteryCharging size={15} color={colors.brand} />
                <Display size={14}>Chargers you can reach right now</Display>
              </View>
              <Txt size={11} color={colors.textTertiary} style={{ marginBottom: 10 }}>
                Add one as a stop — you'll charge there, then we replan the rest.
              </Txt>
              <View style={{ gap: 8 }}>
                {plan.suggestions.map((s) => (
                  <View key={s.charger.id} style={{ backgroundColor: colors.surface2, borderRadius: radius.r4, padding: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <RelRing score={s.charger.reliability_score} size={36} />
                      <View style={{ flex: 1 }}>
                        <Txt size={13} family={font.bold} numberOfLines={1}>{s.charger.name}</Txt>
                        <Txt size={10} color={colors.textTertiary}>
                          arrive at {Math.round(s.arrival_soc)}% · charge to {Math.round(s.target_soc)}% in ~{Math.round(s.dwell_minutes)} min
                        </Txt>
                      </View>
                    </View>
                    <Pressable
                      disabled={busy}
                      onPress={() => {
                        const wp: Place = { label: `⚡ ${s.charger.name}`, lat: s.charger.lat, lng: s.charger.lng };
                        const wps = [...points.waypoints.filter(Boolean)] as Place[];
                        wps.splice(s.leg_index, 0, wp);
                        // shift existing charge declarations at/after the insert point
                        const charges: Record<number, string> = {};
                        for (const [k, v] of Object.entries(wpCharges)) {
                          const idx = Number(k);
                          charges[idx >= s.leg_index ? idx + 1 : idx] = v;
                        }
                        charges[s.leg_index] = s.charger.id;
                        setWpCharges(charges);
                        setPoints((p) => ({ ...p, waypoints: wps }));
                        setPins({});
                        runPlan({}, wps, charges);
                      }}
                      style={{ backgroundColor: colors.brand, borderRadius: radius.r2, paddingVertical: 8, alignItems: 'center', marginTop: 10 }}
                    >
                      <Txt size={11} family={font.bold} color={colors.onBrand}>Add as stop & replan</Txt>
                    </Pressable>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Timeline */}
          {plan.feasible && (
            <Card>
              {legs.map((pt, i) => {
                const isLast = i === legs.length - 1;
                const stop = chargeStops.find((s) => s.leg_index === i);
                return (
                  <View key={i}>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={{ width: 18, alignItems: 'center' }}>
                        {i === 0 ? <Circle size={13} color={colors.brand} fill={colors.brand} style={{ marginTop: 3 }} />
                          : isLast ? <Flag size={13} color={colors.rose} style={{ marginTop: 3 }} />
                          : <MapPin size={13} color={colors.amber} style={{ marginTop: 3 }} />}
                        {!isLast && <View style={{ flex: 1, width: 2.5, backgroundColor: colors.brandSoft, marginVertical: 4, borderRadius: 2 }} />}
                      </View>
                      <View style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
                        <Display size={13} numberOfLines={1}>{pt.label}</Display>
                        <Txt size={11} color={colors.textTertiary} style={{ marginTop: 1 }}>
                          {i === 0 ? `Departing at ${soc}% battery` : isLast ? `Arriving with ~${plan.destination_arrival_soc}%` : 'Via stop'}
                        </Txt>

                        {stop && !isLast && (
                          <View style={{ backgroundColor: colors.brandSoft, borderRadius: radius.r4, padding: 12, marginTop: 10 }}>
                            <Pressable onPress={() => router.push(`/charger/${stop.charger.id}`)}
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <RelRing score={stop.charger.reliability_score} size={38} />
                              <View style={{ flex: 1 }}>
                                <Display size={13} numberOfLines={1}>{stop.charger.name}</Display>
                                <Txt size={10} color={colors.textTertiary}>{stop.charger.operator}</Txt>
                              </View>
                              <ChevronRight size={14} color={colors.textTertiary} />
                            </Pressable>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
                              <MetaChip Icon={BatteryCharging} text={`${Math.round(stop.arrival_soc)}% → ${Math.round(stop.target_soc)}%`} />
                              <MetaChip Icon={Clock} text={`~${Math.round(stop.dwell_minutes)} min`} />
                              <MetaChip Icon={Zap} text={`+${stop.energy_to_add_kwh} kWh`} />
                              {stop.estimated_cost != null && <MetaChip Icon={IndianRupee} text={`~₹${Math.round(stop.estimated_cost)}`} />}
                            </View>
                            {stop.backup_charger && (
                              <View style={{ flexDirection: 'row', gap: 6, backgroundColor: colors.emeraldSoft, borderRadius: radius.r2, padding: 8, marginTop: 8 }}>
                                <ShieldCheck size={13} color={colors.emerald} style={{ marginTop: 1 }} />
                                <Txt size={10} color={colors.emerald} family={font.semi} style={{ flex: 1 }}>
                                  Backup verified: {stop.backup_charger.name}
                                </Txt>
                              </View>
                            )}
                            {stop.alternatives?.length > 0 && (
                              <View style={{ marginTop: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                  <Sparkles size={10} color={colors.textTertiary} />
                                  <Txt size={9} family={font.bold} color={colors.textTertiary} style={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                                    Other chargers on this leg
                                  </Txt>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                  {stop.alternatives.map((alt: TripStop) => (
                                    <View key={alt.charger.id} style={{ width: 175, backgroundColor: colors.surface2, borderRadius: radius.r3, padding: 10 }}>
                                      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                                        <RelRing score={alt.charger.reliability_score} size={30} />
                                        <View style={{ flex: 1 }}>
                                          <Txt size={11} family={font.bold} numberOfLines={1}>{alt.charger.name}</Txt>
                                          <Txt size={9} color={colors.textTertiary}>~{Math.round(alt.dwell_minutes)} min · arrive {Math.round(alt.arrival_soc)}%</Txt>
                                        </View>
                                      </View>
                                      <Pressable disabled={busy} onPress={() => pickAlternative(stop.leg_index, alt.charger.id)}
                                        style={{ backgroundColor: colors.surface, borderRadius: radius.r2, paddingVertical: 6, alignItems: 'center', marginTop: 8 }}>
                                        <Txt size={10} family={font.bold} color={colors.brand}>Use this charger</Txt>
                                      </Pressable>
                                    </View>
                                  ))}
                                </ScrollView>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })}
              <Btn
                label="Start navigation"
                icon={<Navigation size={15} color={colors.onBrand} />}
                style={{ marginTop: 14 }}
                onPress={() => {
                  const wp = [
                    ...points.waypoints.filter(Boolean).map((w) => `${w!.lat},${w!.lng}`),
                    ...chargeStops.map((s) => `${s.charger.lat},${s.charger.lng}`),
                  ].join('|');
                  Linking.openURL(
                    `https://www.google.com/maps/dir/?api=1&origin=${points.origin!.lat},${points.origin!.lng}&destination=${points.dest!.lat},${points.dest!.lng}${wp ? `&waypoints=${encodeURIComponent(wp)}` : ''}`,
                  );
                }}
              />
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

function MetaChip({ Icon, text }: { Icon: any; text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon size={12} color={colors.textSecondary} />
      <Txt size={11} color={colors.textSecondary} family={font.semi}>{text}</Txt>
    </View>
  );
}
