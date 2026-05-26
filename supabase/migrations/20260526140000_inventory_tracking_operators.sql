-- Tracciamento operatore e storico movimenti inventario
CREATE TYPE public.gestionale_operatore AS ENUM ('Giangrossi', 'Irene', 'Matteo', 'Paolo');

ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS last_modified_by public.gestionale_operatore;

CREATE TABLE IF NOT EXISTS public.inventory_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id text NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  operatore public.gestionale_operatore NOT NULL,
  action text NOT NULL CHECK (action IN ('creazione', 'modifica', 'prelievo', 'carico', 'eliminazione')),
  quantity_before integer,
  quantity_after integer,
  summary text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_activity_item_created
  ON public.inventory_activity (item_id, created_at DESC);

ALTER TABLE public.inventory_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS inventory_activity_anon_all ON public.inventory_activity;
CREATE POLICY inventory_activity_anon_all ON public.inventory_activity
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
