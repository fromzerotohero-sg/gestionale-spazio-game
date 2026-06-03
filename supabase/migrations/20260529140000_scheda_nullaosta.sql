-- Tracciamento nullaosta schede (solo category = schede)
ALTER TABLE public.inventory_items
  ADD COLUMN IF NOT EXISTS scheda_doc_inviata_at timestamptz,
  ADD COLUMN IF NOT EXISTS nullaosta_ricevuto_at timestamptz,
  ADD COLUMN IF NOT EXISTS nullaosta_prezzo_incrementato boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nullaosta_segretaria_ok boolean NOT NULL DEFAULT false;
