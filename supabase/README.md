# Supabase — Gestionale Spazio Games

## Progetto

- URL: `https://zcgynarwbouaaamioegr.supabase.co`

## Tabelle gestionale

| Tabella | Uso |
|---------|-----|
| `inventory_items` | Inventario (5 categorie) — **collegato all'app** |
| `repairs` | Riparazioni (pronto per integrazione) |
| `documents` | Modulistica + bucket `gestionale-documents` |
| `support_tickets` | Ticket supporto |
| `gestionale_admins` | Admin futuri (auth) |

Le tabelle `site_assets` / `site_admins` restano per il sito web esistente.

## Migrazioni applicate

1. `create_gestionale_schema`
2. `seed_inventory_items` (96 articoli)

## Rigenerare seed SQL

```bash
cd app
npx tsx ../scripts/generate-seed.mjs
```

Poi applicare `supabase/seed_inventory.sql` via Supabase SQL Editor o MCP.

## App locale

Copia `app/.env.example` in `app/.env` e inserisci URL + anon key dal dashboard Supabase.

```bash
cd app
npm install
npm run dev
```
