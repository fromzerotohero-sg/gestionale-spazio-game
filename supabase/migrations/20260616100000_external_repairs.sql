CREATE TABLE IF NOT EXISTS public.external_repairs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,

  -- Cliente e commessa
  cliente text NOT NULL DEFAULT '',
  commessa text NOT NULL DEFAULT '',
  fabbisogno text NOT NULL DEFAULT '',

  -- Dove
  ubicazione text NOT NULL DEFAULT '',
  dove_montato text NOT NULL DEFAULT '',

  -- Descrizioni
  descrizione_guasto text NOT NULL DEFAULT '',
  descrizione_riparazione text NOT NULL DEFAULT '',

  -- Tempi e tecnico
  tecnico public.gestionale_operatore,
  data_inizio date NOT NULL DEFAULT CURRENT_DATE,
  data_fine date,
  tempo_impiegato_minuti integer NOT NULL DEFAULT 0,

  -- Fornitore (specifico esterno)
  fornitore text NOT NULL DEFAULT '',
  data_invio date,
  consegna_prevista date,
  data_rientro date,

  -- Stato
  stato text NOT NULL DEFAULT 'da_inviare'
    CHECK (stato IN ('da_inviare', 'inviato', 'in_riparazione', 'rientrato', 'montato', 'chiuso')),

  -- Materiali JSON
  materiali jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Tabella lavori
  lavori jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Timeline
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- Note
  note text NOT NULL DEFAULT '',

  -- Audit
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by public.gestionale_operatore,
  updated_by public.gestionale_operatore
);

CREATE INDEX IF NOT EXISTS idx_external_repairs_stato ON public.external_repairs (stato);
CREATE INDEX IF NOT EXISTS idx_external_repairs_code ON public.external_repairs (code);
CREATE INDEX IF NOT EXISTS idx_external_repairs_created ON public.external_repairs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_repairs_fornitore ON public.external_repairs (fornitore);

ALTER TABLE public.external_repairs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS external_repairs_anon_all ON public.external_repairs;
CREATE POLICY external_repairs_anon_all ON public.external_repairs
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
