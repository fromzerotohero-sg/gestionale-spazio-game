# Deploy su Vercel — Gestionale Spazio Games

## Impostazioni obbligatorie

Vercel → **Project Settings → General**:

| Campo | Valore |
|-------|--------|
| **Root Directory** | *(lasciare VUOTO — non scrivere `app`)* |
| **Framework Preset** | Other |
| **Build Command** | *(vuoto — usa `vercel.json`)* |
| **Output Directory** | *(vuoto — usa `vercel.json`)* |

Se **Root Directory** è impostata su `app`, il sito resta in **404**: rimuovila e salva.

## Variabili d'ambiente (obbligatorie)

Vite legge `VITE_*` **solo durante la build**. Se le aggiungi dopo, serve un **nuovo deploy**.

Vercel → **Settings → Environment Variables** → aggiungi per **Production** e **Preview**:

| Nome | Valore |
|------|--------|
| `VITE_SUPABASE_URL` | `https://zcgynarwbouaaamioegr.supabase.co` — **senza** `/rest/v1` alla fine |
| `VITE_SUPABASE_ANON_KEY` | Chiave **anon** (legacy) da Supabase → Project Settings → API |

Se l’URL finisce con `/rest/v1`, le richieste diventano `/rest/v1/rest/v1/...` e ricevi **404**.

Poi: **Deployments → Redeploy** (disattiva *Use existing Build Cache*).

Senza queste variabili vedrai errori `placeholder.supabase.co` o `ERR_NAME_NOT_RESOLVED` in console.

## Come funziona la build

1. `npm install` in `app/`
2. `npm run build` in `app/` → genera `app/dist/`
3. Copia in `dist/` alla root del repo (quello che Vercel pubblica)

## Dopo il push

1. **Deployments** → ultimo deploy → deve essere **Ready** (verde)
2. Se è **Failed**, apri **Building** e leggi l’errore
3. **Redeploy** → spunta **Use existing Build Cache** = OFF

## Test locale del flusso Vercel

```bash
npm install --prefix app
npm run vercel-build
npx serve dist
```

Apri http://localhost:3000 — deve comparire la dashboard Spazio Games.
