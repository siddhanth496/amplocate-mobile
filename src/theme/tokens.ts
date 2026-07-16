// Amplocate design tokens — volt green on dark charcoal.
// Mirrors the web app's index.css palette. Single source of truth in RN.

export const colors = {
  // Ink — dark neutrals
  bg: '#0c0e10',
  surface: '#15181c',
  surface2: '#1b1f24',
  surface3: '#23282e',
  line: 'rgba(240,245,235,0.08)',
  line2: 'rgba(240,245,235,0.16)',
  textPrimary: '#f2f5ee',
  textSecondary: '#a9b1a3',
  textTertiary: '#6f7869',

  // Volt — the brand accent
  brand: '#a3e635',
  brandHi: '#bef264',
  brandDim: '#65a30d',
  brandDeep: '#1a2405',
  brandGlow: 'rgba(163,230,53,0.35)',
  brandSoft: 'rgba(163,230,53,0.12)',
  onBrand: '#141b04', // ink used on volt surfaces

  // Semantic
  emerald: '#4ade80',
  emeraldSoft: 'rgba(74,222,128,0.12)',
  rose: '#fb7185',
  roseSoft: 'rgba(251,113,133,0.12)',
  amber: '#fbbf24',
  amberSoft: 'rgba(251,191,36,0.12)',

  // Reliability bands
  relExcellent: '#a3e635', // >= 0.85
  relGood: '#4ade80',      // >= 0.70
  relModerate: '#fbbf24',  // >= 0.50
  relPoor: '#f87171',
} as const;

export const radius = { r1: 6, r2: 10, r3: 14, r4: 18, r5: 24 } as const;

export const space = (n: number) => n * 4;

export const font = {
  display: 'SpaceGrotesk_700Bold',
  displayMed: 'SpaceGrotesk_600SemiBold',
  bold: 'Inter_700Bold',
  semi: 'Inter_600SemiBold',
  med: 'Inter_500Medium',
  reg: 'Inter_400Regular',
  mono: 'JetBrainsMono_500Medium',
} as const;

export function relColor(score: number): string {
  if (score >= 0.85) return colors.relExcellent;
  if (score >= 0.7) return colors.relGood;
  if (score >= 0.5) return colors.relModerate;
  return colors.relPoor;
}

export function relLabel(score: number): string {
  if (score >= 0.85) return 'Excellent';
  if (score >= 0.7) return 'Good';
  if (score >= 0.5) return 'Moderate';
  return 'Unreliable';
}

export const CONNECTOR_LABELS: Record<string, string> = {
  CCS2: 'CCS2',
  CHAdeMO: 'CHAdeMO',
  Type2_AC: 'Type 2 AC',
  Bharat_AC001: 'Bharat AC',
  Bharat_DC001: 'Bharat DC',
  'GB/T': 'GB/T',
  Wall_3pin: '3-pin Wall',
};

export function timeAgo(iso?: string | null): string {
  if (!iso) return 'never';
  const then = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z').getTime();
  const mins = Math.max(Math.round((Date.now() - then) / 60000), 0);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}
