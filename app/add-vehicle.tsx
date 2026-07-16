import { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Slider from '@react-native-community/slider';
import { ChevronLeft, Bike, Car as CarIcon, Check } from 'lucide-react-native';
import { addVehicle, getCatalog } from '@/api/endpoints';
import type { CatalogEntry } from '@/api/types';
import { colors, font, radius, CONNECTOR_LABELS } from '@/theme/tokens';
import { Btn, Card, Chip, Display, ErrorNote, Txt } from '@/components/ui';

const ALL_CONNECTORS = Object.keys(CONNECTOR_LABELS);

function Input({ label, suffix, ...props }: any) {
  return (
    <View style={{ flex: 1 }}>
      <Txt size={9} family={font.bold} color={colors.textTertiary} style={{ letterSpacing: 1, marginBottom: 4 }}>
        {label.toUpperCase()}
      </Txt>
      <View style={{
        flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface2,
        borderRadius: radius.r3, borderWidth: 1, borderColor: colors.line,
      }}>
        <TextInput
          {...props}
          placeholderTextColor={colors.textTertiary}
          style={{ flex: 1, paddingHorizontal: 12, paddingVertical: 11, color: colors.textPrimary, fontFamily: font.med, fontSize: 13 }}
        />
        {suffix && <Txt size={11} color={colors.textTertiary} family={font.semi} style={{ paddingRight: 12 }}>{suffix}</Txt>}
      </View>
    </View>
  );
}

export default function AddVehicleScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [mode, setMode] = useState<'catalog' | 'manual'>('catalog');
  const [category, setCategory] = useState<'4W' | '2W'>('4W');
  const [selected, setSelected] = useState<CatalogEntry | null>(null);
  const [soc, setSoc] = useState(80);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // manual form
  const [form, setForm] = useState({ make: '', model: '', battery: '', range: '', dc: '' });
  const [connectors, setConnectors] = useState<string[]>([]);

  useEffect(() => { getCatalog().then(setCatalog).catch((e) => setError(e.message)); }, []);

  const entries = useMemo(() => catalog.filter((e) => e.category === category), [catalog, category]);
  const battery = parseFloat(form.battery);
  const range = parseFloat(form.range);
  const efficiency = battery > 0 && range > 0 ? (battery * 1000) / range : null;
  const manualValid = form.make.trim() && form.model.trim() && battery > 0 && range > 0 && connectors.length > 0;

  const submit = async (payload: Record<string, unknown>) => {
    setBusy(true); setError(null);
    try {
      await addVehicle(payload);
      router.back();
    } catch (e: any) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 60, gap: 14 }}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <ChevronLeft size={16} color={colors.textSecondary} />
        <Txt size={13} color={colors.textSecondary} family={font.med}>Back</Txt>
      </Pressable>

      <View>
        <Display size={19}>Add your EV</Display>
        <Txt size={12} color={colors.textSecondary} style={{ marginTop: 2 }}>
          We use this to show compatible chargers and plan safe trips.
        </Txt>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {([['4W', 'Car', CarIcon], ['2W', 'Scooter / Bike', Bike]] as const).map(([id, label, Icon]) => (
          <Pressable key={id} onPress={() => { setCategory(id); setSelected(null); }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: category === id ? colors.brandSoft : colors.surface,
              borderRadius: radius.r3, paddingHorizontal: 14, paddingVertical: 10,
              borderWidth: 1, borderColor: category === id ? colors.brand : colors.line,
            }}>
            <Icon size={15} color={category === id ? colors.brand : colors.textSecondary} />
            <Txt size={12} family={font.semi} color={category === id ? colors.brand : colors.textSecondary}>{label}</Txt>
          </Pressable>
        ))}
        <Pressable onPress={() => setMode(mode === 'catalog' ? 'manual' : 'catalog')}
          style={{
            backgroundColor: colors.surface, borderRadius: radius.r3,
            paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: colors.line,
          }}>
          <Txt size={12} family={font.semi} color={colors.brand}>
            {mode === 'catalog' ? 'Enter manually →' : '← From catalog'}
          </Txt>
        </Pressable>
      </View>

      {error && <ErrorNote message={error} />}

      {mode === 'manual' ? (
        <Card style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Input label="Make" placeholder="e.g. Citroën" value={form.make} onChangeText={(t: string) => setForm({ ...form, make: t })} />
            <Input label="Model" placeholder="e.g. ëC3" value={form.model} onChangeText={(t: string) => setForm({ ...form, model: t })} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Input label="Battery" suffix="kWh" placeholder="29.2" keyboardType="decimal-pad"
              value={form.battery} onChangeText={(t: string) => setForm({ ...form, battery: t })} />
            <Input label="Real range" suffix="km" placeholder="260" keyboardType="number-pad"
              value={form.range} onChangeText={(t: string) => setForm({ ...form, range: t })} />
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
            <Input label="Max DC (0 = AC only)" suffix="kW" placeholder="30" keyboardType="number-pad"
              value={form.dc} onChangeText={(t: string) => setForm({ ...form, dc: t })} />
            {efficiency && (
              <View style={{ flex: 1, backgroundColor: colors.brandSoft, borderRadius: radius.r3, padding: 11 }}>
                <Txt size={11} color={colors.brand} family={font.semi}>≈ {Math.round(efficiency)} Wh/km</Txt>
              </View>
            )}
          </View>
          <View>
            <Txt size={9} family={font.bold} color={colors.textTertiary} style={{ letterSpacing: 1, marginBottom: 6 }}>
              CHARGING PORTS
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {ALL_CONNECTORS.map((c) => (
                <Chip key={c} label={CONNECTOR_LABELS[c]} active={connectors.includes(c)}
                  onPress={() => setConnectors((cs) => cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c])} />
              ))}
            </View>
          </View>
        </Card>
      ) : (
        <View style={{ gap: 8 }}>
          {entries.map((e) => {
            const isSel = selected?.id === e.id;
            return (
              <Pressable key={e.id} onPress={() => setSelected(e)}>
                <Card style={{ borderColor: isSel ? colors.brand : colors.line, borderWidth: isSel ? 1.5 : 1, padding: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ flex: 1 }}>
                      <Display size={14}>{e.make} {e.model}</Display>
                      <Txt size={11} color={colors.textTertiary} style={{ marginTop: 3 }}>
                        {e.battery_kwh} kWh · ~{Math.round(e.battery_kwh / e.efficiency_wh_per_km * 1000)} km
                        {e.max_dc_power_kw > 0 ? ` · DC ${e.max_dc_power_kw} kW` : ' · AC'}
                      </Txt>
                    </View>
                    {isSel && (
                      <View style={{ backgroundColor: colors.brand, borderRadius: 999, padding: 4 }}>
                        <Check size={12} color={colors.onBrand} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}

      {(mode === 'manual' || selected) && (
        <Card style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Txt size={13} family={font.semi}>Current battery level</Txt>
            <Txt size={13} family={font.bold} color={colors.brand}>{soc}%</Txt>
          </View>
          <Slider
            minimumValue={5} maximumValue={100} step={1}
            value={soc}
            onValueChange={(v: number) => setSoc(Math.round(v))}
            minimumTrackTintColor={colors.brand}
            maximumTrackTintColor={colors.surface3}
            thumbTintColor={colors.brand}
          />
          <Btn
            label={busy ? 'Adding…' : mode === 'manual' ? 'Add my EV' : `Add ${selected?.make} ${selected?.model}`}
            loading={busy}
            disabled={mode === 'manual' ? !manualValid : !selected}
            onPress={() => mode === 'manual'
              ? submit({
                  make: form.make.trim(), model: form.model.trim(), category,
                  battery_kwh: battery, efficiency_wh_per_km: Math.round(efficiency || 0),
                  connector_types: connectors, max_dc_power_kw: parseFloat(form.dc) || 0,
                  battery_soc: soc, is_default: true,
                })
              : submit({ catalog_id: selected!.id, battery_soc: soc, is_default: true })}
          />
        </Card>
      )}
    </ScrollView>
  );
}
