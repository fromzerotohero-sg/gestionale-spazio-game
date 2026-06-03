import { GRADI, type MonitorGrado } from '@/data/inventory';

export const GRADO_CUSTOM_VALUE = '__custom__';

export type GradoFormMode = MonitorGrado | typeof GRADO_CUSTOM_VALUE;

export function isPresetGrado(value: string | undefined): value is MonitorGrado {
  return value === 'A' || value === 'B' || value === 'C';
}

export function gradoToFormState(grado: string | undefined): {
  mode: GradoFormMode;
  custom: string;
} {
  if (!grado || isPresetGrado(grado)) {
    return { mode: (grado as MonitorGrado) || 'A', custom: '' };
  }
  return { mode: GRADO_CUSTOM_VALUE, custom: grado };
}

export function resolveGradoValue(mode: GradoFormMode, custom: string, fallback = 'A'): string {
  if (mode === GRADO_CUSTOM_VALUE) {
    const trimmed = custom.trim();
    return trimmed || fallback;
  }
  return mode;
}

export { GRADI };
