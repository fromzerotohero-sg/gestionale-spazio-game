import { GRADI, type MonitorGrado } from '@/data/inventory';

export const GRADO_CUSTOM_VALUE = '__custom__';
export const GRADO_NONE = '__none__';

export type GradoFormMode = MonitorGrado | typeof GRADO_CUSTOM_VALUE | typeof GRADO_NONE;

export function isPresetGrado(value: string | null | undefined): value is MonitorGrado {
  return value === 'A' || value === 'B' || value === 'C';
}

export function gradoToFormState(grado: string | null | undefined): {
  mode: GradoFormMode;
  custom: string;
} {
  if (!grado) {
    return { mode: GRADO_NONE, custom: '' };
  }
  if (isPresetGrado(grado)) {
    return { mode: grado, custom: '' };
  }
  return { mode: GRADO_CUSTOM_VALUE, custom: grado };
}

export function resolveGradoValue(mode: GradoFormMode, custom: string, fallback?: string): string | null | undefined {
  if (mode === GRADO_NONE) return null;
  if (mode === GRADO_CUSTOM_VALUE) {
    const trimmed = custom.trim();
    return trimmed || fallback;
  }
  return mode;
}

export { GRADI };
