# Deploy su Vercel

## Impostazioni progetto (importante)

In **Vercel → Project Settings → General**:

| Campo | Valore |
|-------|--------|
| **Root Directory** | *(vuoto — non impostare `app`)* |
| **Framework Preset** | Other (oppure Vite, se non sovrascrive la build) |
| **Build Command** | *(lasciare vuoto — usa `vercel.json`)* |
| **Output Directory** | *(lasciare vuoto — usa `vercel.json`)* |

## Variabili d'ambiente

In **Settings → Environment Variables**:

- `VITE_SUPABASE_URL` = `https://zcgynarwbouaaamioegr.supabase.co`
- `VITE_SUPABASE_ANON_KEY` = *(anon key da Supabase Dashboard)*

Applica a **Production**, **Preview** e **Development**.

## Dopo ogni push

Vercel esegue automaticamente `vercel-build` in `app/` e pubblica `app/dist`.

Se vedi ancora `404: NOT_FOUND`, apri l’ultimo deployment → **Building** e verifica che la build sia **Ready** (non Failed).
