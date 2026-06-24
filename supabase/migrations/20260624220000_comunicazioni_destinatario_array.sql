ALTER TABLE public.comunicazioni 
  ALTER COLUMN destinatario TYPE text[] 
  USING CASE 
    WHEN destinatario IS NULL THEN NULL 
    ELSE ARRAY[destinatario] 
  END;
