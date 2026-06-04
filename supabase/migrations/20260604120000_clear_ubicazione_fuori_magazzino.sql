-- Monitor da sbancalare / a terra: nessuna ubicazione a scaffale
UPDATE inventory_items
SET
  scaffale = NULL,
  ripiano = NULL,
  bancale = NULL,
  bancale_verificato = false,
  bancale_verificato_at = NULL,
  bancale_verificato_da = NULL
WHERE
  category = 'monitor'
  AND bancale_stato_operativo IN ('da_sbancalare', 'a_terra')
  AND (
    scaffale IS NOT NULL
    OR ripiano IS NOT NULL
    OR bancale IS NOT NULL
    OR bancale_verificato = true
  );
