export const DEFAULT_MONITOR_TIPI = [
  "LCD19",
  "LED19",
  "LED22",
  "LCD 16:10",
  "LED 16:10",
] as const;

export type MonitorTipoPreset = (typeof DEFAULT_MONITOR_TIPI)[number];

export const TIPO_CUSTOM_VALUE = "__custom__";

export type TipoFormMode = MonitorTipoPreset | typeof TIPO_CUSTOM_VALUE | string;

export function isPresetMonitorTipo(
  value: string | undefined,
): value is MonitorTipoPreset {
  return (
    !!value &&
    (DEFAULT_MONITOR_TIPI as readonly string[]).includes(value)
  );
}

export function tipoToFormState(
  tipo: string | undefined,
  knownOptions?: readonly string[],
): {
  mode: TipoFormMode;
  custom: string;
} {
  const val = tipo?.trim();
  if (!val) return { mode: "LED19", custom: "" };
  if (
    isPresetMonitorTipo(val) ||
    knownOptions?.some((o) => o === val)
  ) {
    return { mode: val, custom: "" };
  }
  return { mode: TIPO_CUSTOM_VALUE, custom: val };
}

export function resolveTipoValue(
  mode: TipoFormMode,
  custom: string,
  fallback = "LED19",
): string {
  if (mode === TIPO_CUSTOM_VALUE) {
    return custom.trim() || fallback;
  }
  return mode;
}

/** Tipi predefiniti + valori già usati sui monitor in inventario */
export function buildMonitorTipoOptions(
  items: { categoria: string; tipo?: string }[],
): string[] {
  const seen = new Set<string>(DEFAULT_MONITOR_TIPI);
  const extra: string[] = [];
  for (const item of items) {
    if (item.categoria !== "monitor" || !item.tipo) continue;
    const t = item.tipo.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    extra.push(t);
  }
  extra.sort((a, b) => a.localeCompare(b, "it"));
  return [...DEFAULT_MONITOR_TIPI, ...extra];
}
