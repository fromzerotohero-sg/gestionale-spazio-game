CREATE TABLE IF NOT EXISTS public.moduli (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL CHECK (tipo IN ('ordine_monitor', 'ordine_schede_65')),
  titolo text NOT NULL DEFAULT '',
  cliente text NOT NULL DEFAULT '',
  agente text NOT NULL DEFAULT '',
  data_ordine date DEFAULT CURRENT_DATE,
  consegna_stimata date,
  numero_offerta text DEFAULT '',
  numero_ordine text DEFAULT '',
  articoli jsonb NOT NULL DEFAULT '[]'::jsonb,
  dati_aggiuntivi jsonb NOT NULL DEFAULT '{}'::jsonb,
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by gestionale_operatore
);

ALTER TABLE public.moduli ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS moduli_anon_all ON public.moduli;
CREATE POLICY moduli_anon_all ON public.moduli
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
