
-- 1. Add unique constraint on tenant_id + month + year
ALTER TABLE public.payments 
ADD CONSTRAINT payments_tenant_month_year_unique 
UNIQUE (tenant_id, month, year);

-- 2. Create atomic advance payment function
CREATE OR REPLACE FUNCTION public.create_advance_payments(
  p_tenant_id UUID,
  p_start_month INTEGER,
  p_start_year INTEGER,
  p_months_count INTEGER,
  p_amount_per_month NUMERIC,
  p_expected_amount NUMERIC,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_current_month INTEGER := p_start_month;
  v_current_year INTEGER := p_start_year;
  v_carry_over NUMERIC := 0;
  v_prev_month INTEGER;
  v_prev_year INTEGER;
  v_note TEXT;
  v_created_count INTEGER := 0;
  v_updated_count INTEGER := 0;
BEGIN
  -- Validate inputs
  IF p_months_count < 1 OR p_months_count > 12 THEN
    RAISE EXCEPTION 'months_count must be between 1 and 12';
  END IF;

  v_note := COALESCE(p_notes || ' ', '') || '(Oldindan to''lov - ' || p_months_count || ' oy)';

  FOR i IN 1..p_months_count LOOP
    -- Calculate carry over from previous month
    v_prev_month := v_current_month - 1;
    v_prev_year := v_current_year;
    IF v_prev_month = 0 THEN
      v_prev_month := 12;
      v_prev_year := v_current_year - 1;
    END IF;

    SELECT GREATEST(0, COALESCE(expected_amount + carry_over_debt - paid_amount, 0))
    INTO v_carry_over
    FROM payments
    WHERE tenant_id = p_tenant_id AND month = v_prev_month AND year = v_prev_year;

    IF NOT FOUND THEN
      v_carry_over := 0;
    END IF;

    -- Upsert payment record
    INSERT INTO payments (tenant_id, month, year, expected_amount, paid_amount, carry_over_debt, notes, payment_date)
    VALUES (p_tenant_id, v_current_month, v_current_year, p_expected_amount, p_amount_per_month, v_carry_over, v_note, now())
    ON CONFLICT (tenant_id, month, year) 
    DO UPDATE SET 
      paid_amount = EXCLUDED.paid_amount,
      notes = EXCLUDED.notes,
      payment_date = now(),
      updated_at = now();

    -- Move to next month
    v_current_month := v_current_month + 1;
    IF v_current_month > 12 THEN
      v_current_month := 1;
      v_current_year := v_current_year + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'months_processed', p_months_count);
END;
$$;
