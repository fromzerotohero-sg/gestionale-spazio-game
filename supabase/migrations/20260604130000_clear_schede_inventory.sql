-- Svuota schede demo: il cliente inserisce i dati reali da zero
DELETE FROM public.inventory_activity
WHERE item_id IN (
  SELECT id FROM public.inventory_items WHERE category = 'schede'
);

DELETE FROM public.inventory_items WHERE category = 'schede';

DELETE FROM public.schede_prenotazioni;
