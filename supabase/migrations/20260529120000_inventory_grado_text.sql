-- Grado monitor: da enum A/B/C a testo libero (mantiene valori esistenti)
ALTER TABLE public.inventory_items
  ALTER COLUMN grado TYPE text USING grado::text;
