-- Migration 009: Add color column to resources table
-- Required for bienvenue/index.html resource management

-- Add color column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'resources' AND column_name = 'color'
    ) THEN
        ALTER TABLE resources ADD COLUMN color VARCHAR(7) DEFAULT '#3B82F6';
        COMMENT ON COLUMN resources.color IS 'Hex color code for resource avatar display';
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON resources TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON resources TO anon;

