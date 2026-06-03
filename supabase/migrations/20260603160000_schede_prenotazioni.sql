CREATE TABLE IF NOT EXISTS public.schede_prenotazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_scheda text NOT NULL,
  cliente text NOT NULL,
  operatore public.gestionale_operatore,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schede_prenotazioni_created
  ON public.schede_prenotazioni (created_at DESC);

ALTER TABLE public.schede_prenotazioni ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS schede_prenotazioni_anon_all ON public.schede_prenotazioni;
CREATE POLICY schede_prenotazioni_anon_all ON public.schede_prenotazioni
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
