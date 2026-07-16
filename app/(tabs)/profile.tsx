import { useState } from 'react';
import { View, ScrollView, TextInput, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LogOut, Car, Route, Gauge, ChevronRight, Check } from 'lucide-react-native';
import { updateMe } from '@/api/endpoints';
import { useAuth } from '@/api/AuthContext';
import { colors, font, radius } from '@/theme/tokens';
import { Btn, Card, Display, Txt } from '@/components/ui';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut, refresh } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await updateMe({ name });
      setSaved(true);
      refresh();
      setTimeout(() => setSaved(false), 2000);
    } finally { setBusy(false); }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: 40, gap: 14 }}
    >
      <Display size={19}>Profile</Display>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{
            width: 54, height: 54, borderRadius: 27, backgroundColor: colors.brandSoft,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Display size={17} color={colors.brand}>{(name || user?.phone || 'A').slice(-2)}</Display>
          </View>
          <View>
            <Display size={15}>{name || 'EV Driver'}</Display>
            <Txt size={12} color={colors.textTertiary} style={{ marginTop: 2 }}>{user?.phone}</Txt>
          </View>
        </View>

        <Txt size={9} family={font.bold} color={colors.textTertiary} style={{ marginTop: 18, letterSpacing: 1.5 }}>
          DISPLAY NAME
        </Txt>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textTertiary}
            style={{
              flex: 1, backgroundColor: colors.surface2, borderRadius: radius.r3,
              paddingHorizontal: 14, paddingVertical: 12, color: colors.textPrimary, fontFamily: font.med,
            }}
          />
          <Btn
            label={saved ? '✓' : 'Save'}
            disabled={busy || !name.trim()}
            onPress={save}
            style={{ paddingHorizontal: 20, paddingVertical: 12 }}
          />
        </View>
      </Card>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {[
          { Icon: Car, label: 'My garage', desc: 'Manage vehicles and battery levels', to: '/garage' as const },
          { Icon: Route, label: 'Trip planner', desc: 'Plan a risk-free journey', to: '/trip' as const },
          { Icon: Gauge, label: 'EV dashboard', desc: 'Your charging stats', to: '/dashboard' as const },
        ].map(({ Icon, label, desc, to }, i, arr) => (
          <Pressable key={to} onPress={() => router.push(to)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
              backgroundColor: pressed ? colors.surface2 : 'transparent',
              borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: colors.line,
            })}>
            <View style={{ backgroundColor: colors.brandSoft, borderRadius: radius.r2, padding: 9 }}>
              <Icon size={17} color={colors.brand} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt size={13} family={font.semi}>{label}</Txt>
              <Txt size={11} color={colors.textTertiary}>{desc}</Txt>
            </View>
            <ChevronRight size={15} color={colors.textTertiary} />
          </Pressable>
        ))}
      </Card>

      <Btn label="Log out" kind="danger" icon={<LogOut size={15} color={colors.rose} />} onPress={signOut} />

      <Txt size={11} color={colors.textTertiary} style={{ textAlign: 'center' }}>
        Amplocate v0.1 · Charge with confidence
      </Txt>
    </ScrollView>
  );
}
