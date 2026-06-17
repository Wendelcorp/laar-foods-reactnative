import { colors } from '../theme';

export type GpsColorCode = 'green' | 'yellow' | 'red' | 'unknown';

const LEGACY_LABEL_MAP: Record<string, string> = {
  O: 'OVERALL',
  WDAM: 'WEEKDAY AM',
  WEAM: 'WEEKEND AM',
  WDPM: 'WEEKDAY PM',
  WEPM: 'WEEKEND PM',
  BR: 'BRUNCH',
  AF: 'REV - AF',
  FS: 'REV - FS',
  CS: 'REV - CS',
  'FR-AM': 'FRIENDLINESS AM',
  'FR-PM': 'FRIENDLINESS PM',
  SSAM: 'SoS AM',
  SSPM: 'SoS PM',
  'G*': 'GOOGLE RATING',
  TR: 'TRAINING',
};

const RULES: Record<
  string,
  | { mode: 'lower'; greenMax: number; yellowMax: number }
  | { mode: 'higher'; greenMin: number; yellowMin: number }
> = {
  OVERALL: { mode: 'higher', greenMin: 70, yellowMin: 40 },
  'WEEKDAY AM': { mode: 'lower', greenMax: 25.0, yellowMax: 32.5 },
  'WEEKDAY PM': { mode: 'lower', greenMax: 40.0, yellowMax: 47.5 },
  'WEEKEND AM': { mode: 'lower', greenMax: 30.0, yellowMax: 37.5 },
  'WEEKEND PM': { mode: 'lower', greenMax: 42.5, yellowMax: 50.0 },
  BRUNCH: { mode: 'lower', greenMax: 35.0, yellowMax: 42.5 },
  'SoS AM': { mode: 'higher', greenMin: 50, yellowMin: 35 },
  'SoS PM': { mode: 'higher', greenMin: 50, yellowMin: 35 },
  'GSAT AM': { mode: 'higher', greenMin: 55, yellowMin: 40 },
  'GSAT PM': { mode: 'higher', greenMin: 55, yellowMin: 40 },
  'FRIENDLINESS AM': { mode: 'higher', greenMin: 55, yellowMin: 40 },
  'FRIENDLINESS PM': { mode: 'higher', greenMin: 55, yellowMin: 40 },
  'GOOGLE RATING': { mode: 'higher', greenMin: 3.7, yellowMin: 3.0 },
  'REV - FS': { mode: 'higher', greenMin: 78, yellowMin: 70 },
  'REV - AF': { mode: 'higher', greenMin: 78, yellowMin: 70 },
  'REV - CS': { mode: 'higher', greenMin: 92.5, yellowMin: 85 },
  TRAINING: { mode: 'higher', greenMin: 90, yellowMin: 80 },
};

export function normalizeGpsMetricLabel(label: string): string {
  return LEGACY_LABEL_MAP[label] ?? label;
}

export function gpsMetricColor(metric: string, value: number | null): GpsColorCode {
  if (value == null) return 'unknown';

  const rule = RULES[normalizeGpsMetricLabel(metric)];
  if (!rule) return 'unknown';

  if (rule.mode === 'lower') {
    if (value <= rule.greenMax) return 'green';
    if (value <= rule.yellowMax) return 'yellow';
    return 'red';
  }

  if (value >= rule.greenMin) return 'green';
  if (value >= rule.yellowMin) return 'yellow';
  return 'red';
}

export function gpsColorToTextColor(code?: string | null): string {
  switch (code) {
    case 'green':
      return colors.statusSuccess;
    case 'yellow':
      return colors.statusWarning;
    case 'red':
      return colors.statusError;
    default:
      return colors.textPrimary;
  }
}
