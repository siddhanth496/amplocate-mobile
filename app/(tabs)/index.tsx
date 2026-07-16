import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, FlatList, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { Zap, BatteryMedium, Car, Sparkles, ChevronRight, SlidersHorizontal } from 'lucide-react-native';
import MapWebView from '@/components/MapWebView';
import PlaceSearch from '@/components/PlaceSearch';
import { AmpMark, Card, Chip, Display, ErrorNote, RelRing, Skeleton, Txt } from '@/components/ui';
import { getNearby, listMyVehicles } from '@/api/endpoints';
import type { Charger, Vehicle } from '@/api/types';
import { colors, font, radius, timeAgo, CONNECTOR_LABELS } from '@/theme/tokens';

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const CONNECTORS = Object.keys(CONNECTOR_LABELS);

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Charging late?';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function ChargerRow({ c, onPress }: { c: Charger; onPress: () => void }) {
  const power = Math.max(...c.connectors.map((x) => x.power_kw || 0), 0);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <Card style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <RelRing score={c.reliability_score} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Display size={15} numberOfLines={1}>{c.name}</Display>
            <Txt size={11} color={colors.textTertiary} numberOfLines={1} style={{ marginTop: 2 }}>
              {c.operator} · {c.distance_km} km · verified {timeAgo(c.last_verified_at)}
            </Txt>
          </View>
          <ChevronRight size={16} color={colors.textTertiary} />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10, paddingLeft: 56 }}>
          {c.compatible === true && (
            <View style={{ backgroundColor: colors.emeraldSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Zap size={10} color={colors.emerald} />
              <Txt size={10} color={colors.emerald} family={font.semi}>Fits your EV</Txt>
            </View>
          )}
          {c.compatible === false && (
            <View style={{ backgroundColor: colors.roseSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Txt size={10} color={colors.rose} family={font.semi}>Incompatible</Txt>
            </View>
          )}
          {power > 0 && (
            <View style={{ backgroundColor: power >= 50 ? colors.brand : colors.surface2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Txt size={10} color={power >= 50 ? colors.onBrand : colors.textSecondary} family={font.bold}>
                {power >= 50 ? `⚡ ${power} kW fast` : `${power} kW`}
              </Txt>
            </View>
          )}
          {c.price_per_kwh != null && (
            <View style={{ backgroundColor: colors.surface2, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
              <Txt size={10} color={colors.textSecondary} family={font.med}>₹{c.price_per_kwh}/kWh</Txt>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [chargers, setChargers] = useState<Charger[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [locReady, setLocReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [connector, setConnector] = useState<string | null>(null);
  const [reliableOnly, setReliableOnly] = useState(false);

  const vehicle = useMemo(() => vehicles.find((v) => v.is_default) || vehicles[0], [vehicles]);

  useEffect(() => {
    listMyVehicles().then(setVehicles).catch(() => {});
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const loc: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setUserLoc(loc);
          setCenter(loc);
        }
      } finally {
        // Only start searching once we know where the user is (or that we
        // can't know) — avoids a first fetch centered on the wrong city.
        setLocReady(true);
      }
    })();
  }, []);

  const fetchChargers = useCallback(async () => {
    if (!locReady) return;
    setLoading(true); setError(null);
    try {
      const rows = await getNearby({
        lat: center[0], lng: center[1], radius_km: 25, limit: 60,
        connector_type: connector || undefined,
        min_reliability: reliableOnly ? 0.8 : undefined,
        vehicle_id: vehicle?.id,
      });
      setChargers(rows);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [center, connector, reliableOnly, vehicle?.id, locReady]);

  useEffect(() => { fetchChargers(); }, [fetchChargers]);

  const reliableCount = chargers.filter((c) => c.reliability_score >= 0.8).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Map with floating header */}
      <View style={{ height: 320 }}>
        <MapWebView
          center={center}
          zoom={12}
          chargers={chargers}
          userLocation={userLoc}
          onChargerPress={(id) => router.push(`/charger/${id}`)}
          style={{ flex: 1 }}
        />
        <View style={{ position: 'absolute', top: insets.top + 8, left: 12, right: 12, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <AmpMark size={44} />
          <View style={{ flex: 1 }}>
            <PlaceSearch placeholder="Search an area…" onSelect={(p) => setCenter([p.lat, p.lng])} />
          </View>
          <Pressable
            onPress={() => (vehicle ? router.push('/garage') : router.push('/add-vehicle'))}
            style={{
              height: 46, borderRadius: radius.r4, paddingHorizontal: 10,
              backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line2,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
          >
            <Car size={15} color={colors.brand} />
            {vehicle ? (
              <>
                <BatteryMedium size={14} color={vehicle.battery_soc < 20 ? colors.rose : colors.emerald} />
                <Txt size={12} family={font.bold} color={vehicle.battery_soc < 20 ? colors.rose : colors.emerald}>
                  {Math.round(vehicle.battery_soc)}%
                </Txt>
              </>
            ) : (
              <Txt size={11} family={font.bold} color={colors.brand}>Add EV</Txt>
            )}
          </Pressable>
        </View>
      </View>

      {/* List */}
      <FlatList
        data={loading && chargers.length === 0 ? [] : chargers}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={loading && chargers.length > 0} onRefresh={fetchChargers} tintColor={colors.brand} />}
        ListHeaderComponent={
          <View style={{ gap: 10, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Sparkles size={12} color={colors.brand} />
                  <Txt size={11} color={colors.brand} family={font.semi}>{greeting()}</Txt>
                </View>
                <Display size={18} style={{ marginTop: 2 }}>
                  {loading ? 'Scanning the grid…'
                    : reliableCount > 0 ? `${reliableCount} reliable chargers around you`
                    : `${chargers.length} chargers nearby`}
                </Display>
              </View>
              <Pressable onPress={() => setShowFilters((s) => !s)}
                style={{
                  padding: 10, borderRadius: radius.r3,
                  backgroundColor: showFilters ? colors.brandSoft : colors.surface,
                  borderWidth: 1, borderColor: colors.line,
                }}>
                <SlidersHorizontal size={16} color={showFilters ? colors.brand : colors.textSecondary} />
              </Pressable>
            </View>

            {showFilters && (
              <Card style={{ padding: 12, gap: 10 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {CONNECTORS.map((c) => (
                    <Chip key={c} label={CONNECTOR_LABELS[c]} active={connector === c}
                      onPress={() => setConnector(connector === c ? null : c)} />
                  ))}
                </View>
                <Chip label={reliableOnly ? '✓ Reliable only (80%+)' : 'Reliable only (80%+)'}
                  active={reliableOnly} onPress={() => setReliableOnly(!reliableOnly)} />
              </Card>
            )}

            {error && <ErrorNote message={error} />}
            {loading && chargers.length === 0 && (
              <View style={{ gap: 10 }}>
                {[0, 1, 2, 3].map((i) => (
                  <Card key={i} style={{ padding: 14, gap: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      <Skeleton w={44} h={44} r={22} />
                      <View style={{ flex: 1, gap: 6 }}>
                        <Skeleton w="70%" />
                        <Skeleton w="45%" h={10} />
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <ChargerRow c={item} onPress={() => router.push(`/charger/${item.id}`)} />
        )}
      />
    </View>
  );
}
