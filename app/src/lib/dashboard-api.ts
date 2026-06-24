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

const CATEGORY_COLORS: Record<string, string> = {
  schede: "#D0FF59",
  cabinet: "#22C55E",
  cambiamonete: "#3B82F6",
  accessori: "#8B5CF6",
  monitor: "#F97316",
};

const CATEGORY_NAMES: Record<string, string> = {
  schede: "Schede",
  cabinet: "Cabinet",
  cambiamonete: "Cambia Monete",
  accessori: "Accessori",
  monitor: "Monitor",
};

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

  // 1. Fetch all inventory items for stats
  const { data: items, error: itemsError } = await (supabase
    .from("inventory_items")
    .select("*") as any);

  if (itemsError) throw itemsError;

  // Compute category stats
  const catMap = new Map<string, { value: number; items: number }>();
  let totalValue = 0;
  let totalItems = 0;

  for (const item of (items ?? []) as any[]) {
    const cat = item.categoria as string;
    const prezzo = Number(item.prezzo_unitario) || 0;
    const qty = Number(item.quantita) || 0;
    const val = prezzo * qty;

    totalValue += val;
    totalItems += qty;

    const existing = catMap.get(cat);
    if (existing) {
      existing.value += val;
      existing.items += qty;
    } else {
      catMap.set(cat, { value: val, items: qty });
    }
  }

  const categories: DashboardCategoryStat[] = Array.from(catMap.entries())
    .map(([cat, data]) => ({
      name: CATEGORY_NAMES[cat] || cat,
      category: cat,
      value: Math.round(data.value * 100) / 100,
      items: data.items,
      color: CATEGORY_COLORS[cat] || "#525252",
    }))
    .sort((a, b) => b.value - a.value);

  // 2. Fetch recent activity
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

  // 3. Generate alerts
  const alerts: DashboardAlert[] = [];

  // Low stock (less than 5 units)
  const lowStockItems = (items ?? [])
    .filter((i: any) => Number(i.quantita) > 0 && Number(i.quantita) <= 5)
    .slice(0, 3);

  for (const item of lowStockItems) {
    alerts.push({
      id: `low-${item.id || Math.random()}`,
      severity: "rosso",
      title: `Scorte basse — ${item.nome}`,
      description: `Solo ${item.quantita} unità rimaste in magazzino`,
      time: "adesso",
    });
  }

  // Urgent comunicazioni
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
    totalValue,
    totalItems,
    categories,
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
