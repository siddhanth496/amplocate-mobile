import React, { ReactNode } from 'react';
import {
  View, Text, Pressable, ActivityIndicator, StyleProp, ViewStyle, TextStyle,
} from 'react-native';
import Svg, { Circle as SvgCircle, Path, Rect, Defs, LinearGradient, Stop } from 'react-native-svg';
import { colors, font, radius, relColor } from '../theme/tokens';

/* ── Typography ── */
export function Txt({
  children, size = 14, color = colors.textPrimary, family = font.reg, style, numberOfLines,
}: {
  children: ReactNode; size?: number; color?: string; family?: string;
  style?: StyleProp<TextStyle>; numberOfLines?: number;
}) {
  return (
    <Text numberOfLines={numberOfLines} style={[{ fontSize: size, color, fontFamily: family }, style]}>
      {children}
    </Text>
  );
}

export const Display = (p: Parameters<typeof Txt>[0]) => <Txt family={font.display} {...p} />;

/* ── Surfaces ── */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{
      backgroundColor: colors.surface, borderRadius: radius.r5,
      borderWidth: 1, borderColor: colors.line, padding: 16,
    }, style]}>
      {children}
    </View>
  );
}

/* ── Buttons ── */
export function Btn({
  label, onPress, kind = 'primary', disabled, loading, style, icon,
}: {
  label: string; onPress?: () => void; kind?: 'primary' | 'soft' | 'ghost' | 'danger';
  disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle>; icon?: ReactNode;
}) {
  const bg = kind === 'primary' ? colors.brand
    : kind === 'soft' ? colors.brandSoft
    : kind === 'danger' ? colors.roseSoft
    : colors.surface2;
  const fg = kind === 'primary' ? colors.onBrand
    : kind === 'danger' ? colors.rose
    : kind === 'soft' ? colors.brand
    : colors.textSecondary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [{
        backgroundColor: bg, borderRadius: radius.r4, paddingVertical: 14,
        alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8,
        opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        ...(kind === 'primary' ? { shadowColor: colors.brand, shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 } : {}),
      }, style]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon}
      <Txt size={14} color={fg} family={font.bold}>{label}</Txt>
    </Pressable>
  );
}

export function Chip({
  label, active, onPress, color, bg,
}: { label: string; active?: boolean; onPress?: () => void; color?: string; bg?: string }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: active ? colors.brand : bg || colors.surface2,
        paddingHorizontal: 10, paddingVertical: 7, borderRadius: radius.r2,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Txt size={11} family={font.semi} color={active ? colors.onBrand : color || colors.textSecondary}>
        {label}
      </Txt>
    </Pressable>
  );
}

/* ── Brand mark ── */
export function AmpMark({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="ampg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#65a30d" />
          <Stop offset="0.6" stopColor="#a3e635" />
          <Stop offset="1" stopColor="#d4f76a" />
        </LinearGradient>
      </Defs>
      <Rect width={64} height={64} rx={17} fill="url(#ampg)" />
      <Path d="M35 10 L18 37 h11 l-4 17 L44 26 h-11 z" fill="#10150a" />
    </Svg>
  );
}

/* ── Reliability ring ── */
export function RelRing({ score, size = 44 }: { score: number; size?: number }) {
  const stroke = size > 40 ? 4 : 3.5;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <SvgCircle cx={size / 2} cy={size / 2} r={r} stroke={colors.surface3} strokeWidth={stroke} fill="none" />
        <SvgCircle
          cx={size / 2} cy={size / 2} r={r}
          stroke={relColor(score)} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c}`}
          strokeDashoffset={c * (1 - Math.min(Math.max(score, 0), 1))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Txt size={size > 40 ? 11 : 9} family={font.bold}>{Math.round(score * 100)}</Txt>
    </View>
  );
}

/* ── Battery bar ── */
export function SocBar({ value, danger }: { value: number; danger?: boolean }) {
  return (
    <View style={{ height: 10, borderRadius: 6, backgroundColor: colors.surface3, overflow: 'hidden' }}>
      <View style={{
        width: `${Math.min(Math.max(value, 0), 100)}%`, height: '100%', borderRadius: 6,
        backgroundColor: danger ? colors.rose : colors.brand,
      }} />
    </View>
  );
}

/* ── Skeleton ── */
export function Skeleton({ w, h = 14, r = 10, style }: {
  w: number | `${number}%`; h?: number; r?: number; style?: StyleProp<ViewStyle>;
}) {
  return <View style={[{ width: w, height: h, borderRadius: r, backgroundColor: colors.surface2, opacity: 0.7 }, style]} />;
}

/* ── Centered loading / error states ── */
export function CenterSpinner() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.brand} size="large" />
    </View>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <View style={{ backgroundColor: colors.roseSoft, borderRadius: radius.r3, padding: 12 }}>
      <Txt size={13} color={colors.rose} family={font.med}>{message}</Txt>
    </View>
  );
}
