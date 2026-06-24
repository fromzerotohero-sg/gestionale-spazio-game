ALTER TABLE public.comunicazioni ADD COLUMN IF NOT EXISTS thread_id uuid;
UPDATE public.comunicazioni SET thread_id = id WHERE thread_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_comunicazioni_thread_id ON public.comunicazioni (thread_id);
