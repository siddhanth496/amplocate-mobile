import { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { Plus, Trash2, Star, Bike, Car as CarIcon, BatteryMedium, Zap } from 'lucide-react-native';
import { deleteVehicle, listMyVehicles, updateVehicle } from '@/api/endpoints';
import type { Vehicle } from '@/api/types';
import { colors, font, radius, CONNECTOR_LABELS } from '@/theme/tokens';
import { Btn, Card, Display, ErrorNote, Skeleton, Txt } from '@/components/ui';

function VehicleCard({ v, onChanged }: { v: Vehicle; onChanged: () => void }) {
  const [soc, setSoc] = useState(Math.round(v.battery_soc));
  const Icon = v.category === '2W' ? Bike : CarIcon;
  const rangeKm = Math.round((v.battery_kwh * soc / 100) / v.efficiency_wh_per_km * 1000);

  return (
    <Card style={{ borderColor: v.is_default ? colors.brand : colors.line, borderWidth: v.is_default ? 1.5 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ backgroundColor: colors.brandSoft, borderRadius: radius.r3, padding: 12 }}>
          <Icon size={20} color={colors.brand} />
        </View>
        <View style={{ flex: 1 }}>
          <Display size={15}>{v.make} {v.model}</Display>
          <Txt size={11} color={colors.textTertiary} style={{ marginTop: 2 }} numberOfLines={1}>
            {v.battery_kwh} kWh · {v.connector_types.map((c) => CONNECTOR_LABELS[c] || c).join(' · ')}
          </Txt>
        </View>
        {v.is_default ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.brandSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Star size={10} color={colors.brand} fill={colors.brand} />
            <Txt size={10} family={font.bold} color={colors.brand}>Default</Txt>
          </View>
        ) : (
          <Pressable onPress={async () => { await updateVehicle(v.id, { is_default: true }); onChanged(); }}
            style={{ backgroundColor: colors.surface2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Txt size={10} family={font.semi} color={colors.textSecondary}>Set default</Txt>
          </Pressable>
        )}
      </View>

      <View style={{ marginTop: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <BatteryMedium size={14} color={colors.textSecondary} />
            <Txt size={11} color={colors.textSecondary} family={font.semi}>Battery</Txt>
          </View>
          <Txt size={12} family={font.bold} color={soc < 20 ? colors.rose : colors.brand}>
            {soc}% · ~{rangeKm} km
          </Txt>
        </View>
        <Slider
          minimumValue={0} maximumValue={100} step={1}
          value={soc}
          onValueChange={(x: number) => setSoc(Math.round(x))}
          onSlidingComplete={async (x: number) => { await updateVehicle(v.id, { battery_soc: Math.round(x) }); onChanged(); }}
          minimumTrackTintColor={colors.brand}
          maximumTrackTintColor={colors.surface3}
          thumbTintColor={colors.brand}
        />
      </View>

      <Pressable
        onPress={() => Alert.alert('Remove vehicle', `Remove ${v.make} ${v.model}?`, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: async () => { await deleteVehicle(v.id); onChanged(); } },
        ])}
        style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 4, padding: 4 }}
      >
        <Trash2 size={12} color={colors.textTertiary} />
        <Txt size={11} color={colors.textTertiary} family={font.semi}>Remove</Txt>
      </Pressable>
    </Card>
  );
}

export default function GarageScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    listMyVehicles().then(setVehicles).catch((e) => setError(e.message));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => { load(); }, [load]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40, gap: 12 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Display size={19}>My garage</Display>
          <Txt size={11} color={colors.textSecondary} style={{ marginTop: 2 }}>
            Your EVs power compatibility and trip planning.
          </Txt>
        </View>
        <Btn label="Add EV" icon={<Plus size={15} color={colors.onBrand} />}
          style={{ paddingHorizontal: 16, paddingVertical: 11 }}
          onPress={() => router.push('/add-vehicle')} />
      </View>

      {error && <ErrorNote message={error} />}

      {!vehicles && (
        <>
          <Skeleton w="100%" h={170} r={24} />
          <Skeleton w="100%" h={170} r={24} />
        </>
      )}

      {vehicles?.length === 0 && (
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 30 }}>
          <View style={{ backgroundColor: colors.brandSoft, borderRadius: 999, padding: 14 }}>
            <Zap size={22} color={colors.brand} />
          </View>
          <Display size={15}>No vehicles yet</Display>
          <Txt size={12} color={colors.textSecondary} style={{ textAlign: 'center' }}>
            Add your EV to see compatible chargers and plan risk-free trips.
          </Txt>
          <Btn label="Add your first EV" onPress={() => router.push('/add-vehicle')} style={{ alignSelf: 'stretch', marginTop: 6 }} />
        </Card>
      )}

      {vehicles?.map((v) => <VehicleCard key={v.id} v={v} onChanged={load} />)}
    </ScrollView>
  );
}
