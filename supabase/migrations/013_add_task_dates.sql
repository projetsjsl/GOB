-- Migration 013: Add start_date and end_date columns to task_templates
-- These columns store absolute dates for tasks in Q1 2026 (2026-01-01 to 2026-03-31)

-- Add start_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_templates' 
        AND column_name = 'start_date'
    ) THEN
        ALTER TABLE public.task_templates 
        ADD COLUMN start_date DATE DEFAULT '2026-01-01';
    END IF;
END $$;

-- Add end_date column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_templates' 
        AND column_name = 'end_date'
    ) THEN
        ALTER TABLE public.task_templates 
        ADD COLUMN end_date DATE DEFAULT '2026-01-01';
    END IF;
END $$;

-- Add constraint to ensure dates are in Q1 2026
ALTER TABLE public.task_templates 
DROP CONSTRAINT IF EXISTS task_templates_dates_q1_2026;

ALTER TABLE public.task_templates 
ADD CONSTRAINT task_templates_dates_q1_2026 
CHECK (
    (start_date IS NULL OR (start_date >= '2026-01-01' AND start_date <= '2026-03-31')) AND
    (end_date IS NULL OR (end_date >= '2026-01-01' AND end_date <= '2026-03-31'))
);

-- Update existing rows to have default dates if they are NULL
UPDATE public.task_templates 
SET 
    start_date = COALESCE(start_date, '2026-01-01'),
    end_date = COALESCE(end_date, '2026-01-01')
WHERE start_date IS NULL OR end_date IS NULL;

-- Create index for date queries
CREATE INDEX IF NOT EXISTS idx_task_templates_start_date ON public.task_templates(start_date);
CREATE INDEX IF NOT EXISTS idx_task_templates_end_date ON public.task_templates(end_date);







