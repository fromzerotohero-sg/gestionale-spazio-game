import { getSupabase, isSupabaseConfigured, supabaseConfigError } from "@/lib/supabase";

export interface DashboardCategoryStat {
  name: string;
  category: string;
  value: number;
  items: number;
  color: string;
}

export interface DashboardActivity {
  id: string;
  action: string;
  item: string;
  operatore: string;
  time: string;
  type: "verde" | "blu" | "arancione" | "grigio";
}

export interface DashboardAlert {
  id: string;
  severity: "rosso" | "giallo" | "verde";
  title: string;
  description: string;
  time: string;
}

export interface DashboardData {
  totalValue: number;
  totalItems: number;
  categories: DashboardCategoryStat[];
  activities: DashboardActivity[];
  alerts: DashboardAlert[];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "adesso";
  if (mins < 60) return `${mins} min fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "ora" : "ore"} fa`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "giorno" : "giorni"} fa`;
}

const ACTION_TYPE: Record<string, DashboardActivity["type"]> = {
  create: "verde",
  carico: "verde",
  update: "blu",
  delete: "grigio",
  prelievo: "arancione",
};

export async function fetchDashboardData(): Promise<DashboardData> {
  if (!isSupabaseConfigured) {
    throw new Error(supabaseConfigError ?? "Supabase non configurato");
  }

  const supabase = getSupabase();

  // 1. Fetch recent activity
  const { data: activityData, error: actError } = await (supabase
    .from("inventory_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10) as any);

  if (actError) throw actError;

  const activities: DashboardActivity[] = (activityData ?? []).map((a: any) => ({
    id: a.id,
    action: mapActivityAction(a.action),
    item: a.summary || "",
    operatore: a.operatore || "Sistema",
    time: timeAgo(a.created_at),
    type: ACTION_TYPE[a.action] || "blu",
  }));

  // 2. Generate alerts from urgent comunicazioni
  const alerts: DashboardAlert[] = [];

  const { data: urgenti } = await (supabase
    .from("comunicazioni")
    .select("*")
    .eq("urgente", true)
    .eq("archiviata", false)
    .order("created_at", { ascending: false })
    .limit(2) as any);

  for (const com of (urgenti ?? [])) {
    const msg = (com.messaggio as string).slice(0, 60);
    alerts.push({
      id: `urg-${com.id}`,
      severity: "giallo",
      title: "Comunicazione urgente",
      description: msg + (com.messaggio.length > 60 ? "..." : ""),
      time: timeAgo(com.created_at),
    });
  }

  return {
    totalValue: 0,
    totalItems: 0,
    categories: [],
    activities,
    alerts,
  };
}

function mapActivityAction(action: string): string {
  const map: Record<string, string> = {
    create: "Aggiunto",
    carico: "Carico",
    prelievo: "Prelievo",
    update: "Modificato",
    delete: "Eliminato",
  };
  return map[action] || action;
}
