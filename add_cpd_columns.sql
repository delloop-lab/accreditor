-- Add ICF category columns to the cpd table if they don't exist
ALTER TABLE cpd ADD COLUMN IF NOT EXISTS core_competency BOOLEAN DEFAULT false;
ALTER TABLE cpd ADD COLUMN IF NOT EXISTS resource_development BOOLEAN DEFAULT false;
ALTER TABLE cpd ADD COLUMN IF NOT EXISTS core_competency_hours NUMERIC DEFAULT 0;
ALTER TABLE cpd ADD COLUMN IF NOT EXISTS resource_development_hours NUMERIC DEFAULT 0;
ALTER TABLE cpd ADD COLUMN IF NOT EXISTS icf_cce_hours BOOLEAN DEFAULT true;

-- Verify the columns were added
SELECT column_name, data_type, column_default, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'cpd' AND column_name IN (
  'core_competency',
  'resource_development',
  'core_competency_hours',
  'resource_development_hours',
  'icf_cce_hours'
);
