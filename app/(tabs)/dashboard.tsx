import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  Gauge, Zap, BatteryCharging, MapPin, Flag, IndianRupee, Leaf,
  CheckCircle2, XCircle, ChevronRight, Timer, Plug,
} from 'lucide-react-native';
import { getMyStats, listMyVehicles } from '@/api/endpoints';
import type { Stats, Vehicle } from '@/api/types';
import { colors, font, radius, timeAgo, CONNECTOR_LABELS } from '@/theme/tokens';
import { Btn, Card, Display, ErrorNote, Skeleton, SocBar, Txt } from '@/components/ui';

function StatTile({ Icon, value, label }: { Icon: any; value: string | number; label: string }) {
  return (
    <Card style={{ flex: 1, minWidth: '30%', padding: 14 }}>
      <View style={{ backgroundColor: colors.brandSoft, alignSelf: 'flex-start', borderRadius: radius.r2, padding: 8 }}>
        <Icon size={16} color={colors.brand} />
      </View>
      <Display size={18} style={{ marginTop: 10 }}>{value}</Display>
      <Txt size={10} color={colors.textTertiary} style={{ marginTop: 3 }}>{label}</Txt>
    </Card>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [vs, st] = await Promise.all([listMyVehicles(), getMyStats()]);
      setVehicles(vs); setStats(st); setError(null);
    } catch (e: any) { setError(e.message); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const vehicle = useMemo(() => vehicles?.find((v) => v.is_default) || vehicles?.[0], [vehicles]);

  if (!vehicles || !stats) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16, paddingTop: insets.top + 12, gap: 14 }}>
        <Skeleton w={150} h={22} />
        <Skeleton w="100%" h={200} r={24} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Skeleton w={'31%' as const} h={110} r={24} />
          <Skeleton w={'31%' as const} h={110} r={24} />
          <Skeleton w={'31%' as const} h={110} r={24} />
        </View>
        {error && <ErrorNote message={error} />}
      </View>
    );
  }

  const soc = vehicle ? Math.round(vehicle.battery_soc) : 0;
  const rangeKm = vehicle ? Math.round((vehicle.battery_kwh * soc / 100) / vehicle.efficiency_wh_per_km * 1000) : 0;
  const fullRange = vehicle ? Math.round(vehicle.battery_kwh / vehicle.efficiency_wh_per_km * 1000) : 0;
  const chargeKwh = vehicle ? vehicle.battery_kwh * 0.6 : 0;
  const dcMin = vehicle && vehicle.max_dc_power_kw > 0 ? Math.round(chargeKwh / (vehicle.max_dc_power_kw * 0.85) * 60) : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40, gap: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.brand}
        onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
    >
      <View>
        <Display size={19}>EV Dashboard</Display>
        <Txt size={12} color={colors.textSecondary} style={{ marginTop: 2 }}>
          Your car, your charging life, at a glance.
        </Txt>
      </View>

      {vehicle ? (
        <View style={{
          borderRadius: radius.r5, padding: 18,
          backgroundColor: colors.brandDeep, borderWidth: 1, borderColor: 'rgba(163,230,53,0.25)',
        }}>
          <Txt size={10} family={font.bold} color={colors.textTertiary} style={{ letterSpacing: 1.5 }}>YOUR EV</Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <Display size={21}>{vehicle.make} {vehicle.model}</Display>
            <Pressable onPress={() => router.push('/garage')}
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 }}>
              <Txt size={10} family={font.bold}>Manage</Txt>
            </Pressable>
          </View>
          <View style={{ marginTop: 14 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Txt size={11} color={colors.textSecondary} family={font.semi}>Battery</Txt>
              <Txt size={11} family={font.bold}>{soc}% · ~{rangeKm} km left</Txt>
            </View>
            <SocBar value={soc} danger={soc < 20} />
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 16, rowGap: 12 }}>
            {[
              [Zap, `${vehicle.battery_kwh} kWh`, 'battery pack'],
              [Gauge, `${fullRange} km`, 'full range'],
              [Timer, dcMin ? `~${dcMin} min` : 'AC only', dcMin ? `20→80% @ ${vehicle.max_dc_power_kw} kW` : '20→80% on AC'],
              [Plug, vehicle.connector_types.map((c) => CONNECTOR_LABELS[c] || c).join(' · '), 'ports'],
            ].map(([Icon, v, l]: any, i) => (
              <View key={i} style={{ width: '50%' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Icon size={12} color={colors.textTertiary} />
                  <Txt size={12.5} family={font.bold} numberOfLines={1} style={{ flex: 1 }}>{v}</Txt>
                </View>
                <Txt size={9} color={colors.textTertiary} style={{ marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>{l}</Txt>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
          <Display size={15}>No EV added yet</Display>
          <Txt size={12} color={colors.textSecondary}>Add your car or scooter to unlock the dashboard.</Txt>
          <Btn label="Add your EV" onPress={() => router.push('/add-vehicle')} style={{ alignSelf: 'stretch' }} />
        </Card>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <StatTile Icon={BatteryCharging} value={`${stats.energy_kwh} kWh`} label="energy charged" />
        <StatTile Icon={Zap} value={stats.success_rate != null ? `${Math.round(stats.success_rate * 100)}%` : '—'} label={`success · ${stats.sessions_total} sessions`} />
        <StatTile Icon={MapPin} value={stats.chargers_visited} label="chargers visited" />
        <StatTile Icon={IndianRupee} value={`₹${Math.round(stats.est_cost_inr)}`} label="est. spend" />
        <StatTile Icon={Leaf} value={`${stats.co2_saved_kg} kg`} label="CO₂ saved" />
        <StatTile Icon={Flag} value={stats.reports_count} label="reports" />
      </View>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Txt size={13} family={font.bold} style={{ padding: 14, paddingBottom: 8 }}>Recent charging sessions</Txt>
        {stats.recent_sessions.length === 0 ? (
          <Txt size={12} color={colors.textTertiary} style={{ paddingHorizontal: 14, paddingBottom: 16 }}>
            No sessions yet — start one from any charger page when you plug in.
          </Txt>
        ) : stats.recent_sessions.map((s, i, arr) => (
          <Pressable key={i} onPress={() => router.push(`/charger/${s.charger_id}`)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13,
              backgroundColor: pressed ? colors.surface2 : 'transparent',
              borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: colors.line,
            })}>
            {s.successful ? <CheckCircle2 size={16} color={colors.emerald} />
              : s.successful === false ? <XCircle size={16} color={colors.rose} />
              : <BatteryCharging size={16} color={colors.amber} />}
            <View style={{ flex: 1 }}>
              <Txt size={13} family={font.semi} numberOfLines={1}>{s.charger_name}</Txt>
              <Txt size={11} color={colors.textTertiary}>
                {timeAgo(s.started_at)}{s.energy_kwh ? ` · ${s.energy_kwh} kWh` : ''}
              </Txt>
            </View>
            <ChevronRight size={14} color={colors.textTertiary} />
          </Pressable>
        ))}
      </Card>
    </ScrollView>
  );
}
