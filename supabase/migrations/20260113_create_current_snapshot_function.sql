-- Function to atomically create a current snapshot per ticker
CREATE OR REPLACE FUNCTION public.create_current_snapshot(
  p_ticker text,
  p_profile_id text,
  p_user_id text,
  p_notes text,
  p_snapshot_date date,
  p_is_watchlist boolean,
  p_auto_fetched boolean,
  p_annual_data jsonb,
  p_assumptions jsonb,
  p_company_info jsonb,
  p_sync_metadata jsonb default null
)
RETURNS public.finance_pro_snapshots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_row public.finance_pro_snapshots;
  has_sync_metadata boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(p_ticker));

  UPDATE public.finance_pro_snapshots
    SET is_current = false
    WHERE ticker = p_ticker AND is_current = true;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'finance_pro_snapshots'
      AND column_name = 'sync_metadata'
  ) INTO has_sync_metadata;

  IF has_sync_metadata THEN
    INSERT INTO public.finance_pro_snapshots (
      ticker,
      profile_id,
      user_id,
      notes,
      snapshot_date,
      is_current,
      is_watchlist,
      auto_fetched,
      annual_data,
      assumptions,
      company_info,
      sync_metadata
    ) VALUES (
      p_ticker,
      p_profile_id,
      p_user_id,
      p_notes,
      p_snapshot_date,
      true,
      p_is_watchlist,
      p_auto_fetched,
      p_annual_data,
      p_assumptions,
      p_company_info,
      p_sync_metadata
    ) RETURNING * INTO new_row;
  ELSE
    INSERT INTO public.finance_pro_snapshots (
      ticker,
      profile_id,
      user_id,
      notes,
      snapshot_date,
      is_current,
      is_watchlist,
      auto_fetched,
      annual_data,
      assumptions,
      company_info
    ) VALUES (
      p_ticker,
      p_profile_id,
      p_user_id,
      p_notes,
      p_snapshot_date,
      true,
      p_is_watchlist,
      p_auto_fetched,
      p_annual_data,
      p_assumptions,
      p_company_info
    ) RETURNING * INTO new_row;
  END IF;

  RETURN new_row;
END;
$$;
