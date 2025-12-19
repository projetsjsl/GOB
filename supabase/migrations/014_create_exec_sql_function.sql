-- Migration 014: Create exec_sql RPC function for executing SQL migrations
-- This function allows executing SQL statements via Supabase RPC

CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Execute the SQL statement
    EXECUTE sql;
    
    -- Return success
    RETURN jsonb_build_object('success', true, 'message', 'SQL executed successfully');
EXCEPTION
    WHEN OTHERS THEN
        -- Return error details
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM,
            'sqlstate', SQLSTATE
        );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO service_role;

COMMENT ON FUNCTION exec_sql IS 'Execute SQL statements via RPC. Use with caution - requires SECURITY DEFINER privileges.';

