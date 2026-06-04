ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS bancale_stato_operativo text NOT NULL DEFAULT 'a_riposo',
  ADD COLUMN IF NOT EXISTS bancale_stato_operativo_at timestamptz,
  ADD COLUMN IF NOT EXISTS bancale_stato_operativo_da public.gestionale_operatore;

ALTER TABLE public.inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_bancale_stato_operativo_check;

ALTER TABLE public.inventory_items
  ADD CONSTRAINT inventory_items_bancale_stato_operativo_check
  CHECK (bancale_stato_operativo IN ('a_riposo', 'in_prelievo', 'in_postazione'));
