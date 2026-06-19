CREATE TABLE IF NOT EXISTS public.comunicazioni (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autore public.gestionale_operatore NOT NULL,
  destinatario public.gestionale_operatore,
  messaggio text NOT NULL,
  urgente boolean NOT NULL DEFAULT false,
  archiviata boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comunicazioni_created ON public.comunicazioni (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comunicazioni_autore ON public.comunicazioni (autore);
CREATE INDEX IF NOT EXISTS idx_comunicazioni_destinatario ON public.comunicazioni (destinatario);
CREATE INDEX IF NOT EXISTS idx_comunicazioni_archiviata ON public.comunicazioni (archiviata);

ALTER TABLE public.comunicazioni ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comunicazioni_anon_all ON public.comunicazioni;
CREATE POLICY comunicazioni_anon_all ON public.comunicazioni
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
