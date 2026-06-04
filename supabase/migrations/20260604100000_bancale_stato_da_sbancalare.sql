-- Stati bancale: da sbancalare / a terra + nota libera (facoltativi)
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS bancale_stato_operativo_note text;

ALTER TABLE public.inventory_items
  ALTER COLUMN bancale_stato_operativo DROP DEFAULT;

ALTER TABLE public.inventory_items
  ALTER COLUMN bancale_stato_operativo DROP NOT NULL;

ALTER TABLE public.inventory_items
  DROP CONSTRAINT IF EXISTS inventory_items_bancale_stato_operativo_check;

UPDATE public.inventory_items
SET bancale_stato_operativo = 'da_sbancalare'
WHERE category = 'monitor'
  AND bancale_stato_operativo IN ('in_prelievo', 'a_riposo');

UPDATE public.inventory_items
SET bancale_stato_operativo = 'a_terra'
WHERE category = 'monitor' AND bancale_stato_operativo = 'in_postazione';

UPDATE public.inventory_items
SET bancale_stato_operativo = NULL
WHERE category <> 'monitor'
   OR (
     bancale_stato_operativo IS NOT NULL
     AND bancale_stato_operativo NOT IN ('da_sbancalare', 'a_terra')
   );

ALTER TABLE public.inventory_items
  ADD CONSTRAINT inventory_items_bancale_stato_operativo_check
  CHECK (
    bancale_stato_operativo IS NULL
    OR bancale_stato_operativo IN ('da_sbancalare', 'a_terra')
  );
