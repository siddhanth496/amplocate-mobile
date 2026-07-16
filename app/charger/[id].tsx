import { useCallback, useEffect, useState } from 'react';
import { View, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ChevronLeft, Navigation, Zap, Clock, IndianRupee, Coffee,
  CheckCircle2, XCircle, Car, Users, MapPin,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { getCharger, submitReport } from '@/api/endpoints';
import type { ChargerDetail } from '@/api/types';
import { colors, font, radius, relColor, relLabel, timeAgo, CONNECTOR_LABELS } from '@/theme/tokens';
import { Btn, Card, Display, ErrorNote, RelRing, Skeleton, Txt } from '@/components/ui';
import MapWebView from '@/components/MapWebView';

const REPORT_META: Record<string, { label: string; color: string; Icon: any }> = {
  working: { label: 'Working', color: colors.emerald, Icon: CheckCircle2 },
  broken: { label: 'Broken', color: colors.rose, Icon: XCircle },
  ice_blocked: { label: 'ICE blocked', color: colors.amber, Icon: Car },
  queue: { label: 'Queue', color: colors.amber, Icon: Users },
  check_in: { label: 'Check-in', color: colors.brand, Icon: MapPin },
};

export default function ChargerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [charger, setCharger] = useState<ChargerDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reporting, setReporting] = useState<string | null>(null);
  const [reportDone, setReportDone] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    getCharger(id).then(setCharger).catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const quickReport = async (type: string) => {
    if (!id) return;
    setReporting(type); setReportDone(null); setError(null);
    try {
      await submitReport(id, { report_type: type });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setReportDone(type);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setReporting(null); }
  };

  if (!charger) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: 16, paddingTop: insets.top + 12, gap: 14 }}>
        <Skeleton w={90} h={16} />
        <Skeleton w="100%" h={190} r={24} />
        <Skeleton w="100%" h={130} r={24} />
        {error && <ErrorNote message={error} />}
      </View>
    );
  }

  const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${charger.lat},${charger.lng}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 8, paddingBottom: 40, gap: 14 }}
    >
      <Pressable onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <ChevronLeft size={16} color={colors.textSecondary} />
        <Txt size={13} color={colors.textSecondary} family={font.med}>Back</Txt>
      </Pressable>

      {/* Header */}
      <Card>
        <View style={{ flexDirection: 'row', gap: 14 }}>
          <View style={{ flex: 1 }}>
            <Display size={19}>{charger.name}</Display>
            <Txt size={12} color={colors.textSecondary} style={{ marginTop: 4 }}>
              {charger.operator} · {charger.address || charger.city}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <View style={{ backgroundColor: colors.surface2, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 }}>
                <Txt size={11} family={font.bold} color={relColor(charger.reliability_score)}>
                  {relLabel(charger.reliability_score)}
                </Txt>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={11} color={colors.textTertiary} />
                <Txt size={11} color={colors.textTertiary}>verified {timeAgo(charger.last_verified_at)}</Txt>
              </View>
            </View>
          </View>
          <RelRing score={charger.reliability_score} size={72} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Btn label="Navigate" style={{ flex: 1 }}
            icon={<Navigation size={15} color={colors.onBrand} />}
            onPress={() => Linking.openURL(navigateUrl)} />
        </View>
      </Card>

      {/* Connectors */}
      <Card>
        <Txt size={13} family={font.bold} style={{ marginBottom: 10 }}>Connectors</Txt>
        <View style={{ gap: 8 }}>
          {charger.connectors.map((c, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', gap: 12,
              backgroundColor: colors.surface2, borderRadius: radius.r3, padding: 12,
            }}>
              <View style={{ backgroundColor: colors.brandSoft, borderRadius: radius.r2, padding: 8 }}>
                <Zap size={16} color={colors.brand} />
              </View>
              <View>
                <Txt size={13} family={font.semi}>{CONNECTOR_LABELS[c.type] || c.type}</Txt>
                <Txt size={11} color={colors.textTertiary}>
                  {c.power_kw} kW · {c.count || 1} gun{(c.count || 1) > 1 ? 's' : ''}
                </Txt>
              </View>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 16, marginTop: 12 }}>
          {charger.price_per_kwh != null && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <IndianRupee size={13} color={colors.textSecondary} />
              <Txt size={13} color={colors.textSecondary} family={font.med}>{charger.price_per_kwh}/kWh</Txt>
            </View>
          )}
          {charger.amenities?.length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Coffee size={13} color={colors.textSecondary} />
              <Txt size={12} color={colors.textSecondary} numberOfLines={1}>
                {charger.amenities.map((a) => a.replace('_', ' ')).join(', ')}
              </Txt>
            </View>
          )}
        </View>
      </Card>

      {/* Quick report */}
      <Card>
        <Txt size={13} family={font.bold}>Been here just now?</Txt>
        <Txt size={11} color={colors.textTertiary} style={{ marginTop: 2 }}>
          Your report updates the reliability score for everyone.
        </Txt>
        {reportDone && (
          <View style={{ backgroundColor: colors.emeraldSoft, borderRadius: radius.r2, padding: 10, marginTop: 10 }}>
            <Txt size={11} color={colors.emerald} family={font.semi}>
              Thanks — “{REPORT_META[reportDone].label}” recorded.
            </Txt>
          </View>
        )}
        {error && <View style={{ marginTop: 10 }}><ErrorNote message={error} /></View>}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
          {Object.entries(REPORT_META).map(([type, meta]) => (
            <Pressable key={type} disabled={!!reporting} onPress={() => quickReport(type)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: colors.surface2, borderRadius: radius.r3,
                paddingHorizontal: 12, paddingVertical: 10,
                opacity: reporting ? 0.5 : pressed ? 0.8 : 1,
              })}>
              <meta.Icon size={14} color={meta.color} />
              <Txt size={11} family={font.semi} color={meta.color}>
                {reporting === type ? 'Sending…' : meta.label}
              </Txt>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Recent reports */}
      {charger.recent_reports?.length > 0 && (
        <Card>
          <Txt size={13} family={font.bold} style={{ marginBottom: 10 }}>Recent community reports</Txt>
          <View style={{ gap: 10 }}>
            {charger.recent_reports.map((r) => {
              const meta = REPORT_META[r.report_type] || REPORT_META.check_in;
              return (
                <View key={r.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <meta.Icon size={15} color={meta.color} />
                  <Txt size={13} family={font.med} style={{ flex: 1 }} numberOfLines={1}>
                    {meta.label}{r.comment ? ` — “${r.comment}”` : ''}
                  </Txt>
                  <Txt size={11} color={colors.textTertiary}>{timeAgo(r.created_at)}</Txt>
                </View>
              );
            })}
          </View>
        </Card>
      )}

      {/* Mini map */}
      <View style={{ height: 200, borderRadius: radius.r5, overflow: 'hidden', borderWidth: 1, borderColor: colors.line }}>
        <MapWebView center={[charger.lat, charger.lng]} zoom={15} chargers={[charger]} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}
