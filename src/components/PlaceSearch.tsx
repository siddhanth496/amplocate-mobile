import React, { useEffect, useRef, useState } from 'react';
import { View, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { Search, MapPin, LocateFixed } from 'lucide-react-native';
import * as Location from 'expo-location';
import { searchPlaces } from '@/api/endpoints';
import type { Place } from '@/api/types';
import { colors, font, radius } from '@/theme/tokens';
import { Txt } from './ui';

export default function PlaceSearch({
  placeholder = 'Search a place…',
  onSelect,
  allowMyLocation = false,
  autoFocus = false,
}: {
  placeholder?: string;
  onSelect: (p: Place) => void;
  allowMyLocation?: boolean;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = query.trim();
    if (q.length < 3) { setResults([]); setBusy(false); return; }
    setBusy(true);
    timer.current = setTimeout(async () => {
      try { setResults(await searchPlaces(q)); }
      catch { setResults([]); }
      finally { setBusy(false); }
    }, 400);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query]);

  const useMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    onSelect({ label: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude });
  };

  return (
    <View>
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 8,
        backgroundColor: colors.surface, borderRadius: radius.r4,
        borderWidth: 1, borderColor: colors.line2, paddingHorizontal: 14, height: 46,
      }}>
        {busy
          ? <ActivityIndicator size="small" color={colors.brand} />
          : <Search size={16} color={colors.textTertiary} />}
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          autoFocus={autoFocus}
          style={{ flex: 1, color: colors.textPrimary, fontFamily: font.med, fontSize: 14 }}
        />
      </View>

      {(results.length > 0 || allowMyLocation) && (
        <View style={{
          marginTop: 6, backgroundColor: colors.surface, borderRadius: radius.r4,
          borderWidth: 1, borderColor: colors.line, overflow: 'hidden',
        }}>
          {allowMyLocation && (
            <Pressable onPress={useMyLocation}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13,
                backgroundColor: pressed ? colors.surface2 : 'transparent',
                borderBottomWidth: results.length ? 1 : 0, borderBottomColor: colors.line,
              })}>
              <LocateFixed size={15} color={colors.brand} />
              <Txt size={13} color={colors.brand} family={font.semi}>Use my current location</Txt>
            </Pressable>
          )}
          {results.map((r, i) => (
            <Pressable key={i} onPress={() => { onSelect(r); setQuery(''); setResults([]); }}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12,
                backgroundColor: pressed ? colors.surface2 : 'transparent',
              })}>
              <MapPin size={14} color={colors.textTertiary} style={{ marginTop: 2 }} />
              <Txt size={13} color={colors.textSecondary} style={{ flex: 1 }}>{r.label}</Txt>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
