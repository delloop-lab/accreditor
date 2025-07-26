-- Update CPD table to support multiple document types
-- This adds new columns for document type and supporting document while maintaining backward compatibility

-- Add new columns for enhanced document support
ALTER TABLE cpd 
ADD COLUMN document_type VARCHAR(50) DEFAULT 'Certificate',
ADD COLUMN supporting_document TEXT;

-- Add comment to explain the new fields
COMMENT ON COLUMN cpd.document_type IS 'Type of supporting document (Certificate, Transcript, Receipt, etc.)';
COMMENT ON COLUMN cpd.supporting_document IS 'URL or path to the supporting document file';

-- Create an index on document_type for better query performance
CREATE INDEX idx_cpd_document_type ON cpd(document_type);

-- Update existing records to have a default document type
UPDATE cpd 
SET document_type = 'Certificate' 
WHERE document_type IS NULL;

-- Optional: Add a check constraint to ensure document_type is one of the valid values
ALTER TABLE cpd 
ADD CONSTRAINT chk_document_type 
CHECK (document_type IN (
  'Certificate',
  'Transcript', 
  'Receipt',
  'Attendance Record',
  'Reading Notes',
  'Reflection Journal',
  'Assessment Results',
  'Other'
));

-- Create a view for easier querying of CPD with document information
CREATE OR REPLACE VIEW cpd_with_documents AS
SELECT 
  id,
  user_id,
  title,
  date,
  activity_date,
  hours,
  type,
  cpd_type,
  learning_method,
  provider,
  provider_organization,
  description,
  key_learnings,
  application_to_practice,
  icf_competencies,
  certificate_proof,
  document_type,
  supporting_document,
  created_at,
  updated_at
FROM cpd;

-- Grant permissions for the view
GRANT SELECT ON cpd_with_documents TO authenticated;

-- Example queries for the new functionality:

-- 1. Get all CPD activities with their document types
-- SELECT title, document_type, supporting_document FROM cpd WHERE user_id = 'your-user-id';

-- 2. Get CPD activities by document type
-- SELECT title, hours, document_type FROM cpd WHERE document_type = 'Certificate';

-- 3. Get CPD activities that have supporting documents
-- SELECT title, document_type, supporting_document FROM cpd WHERE supporting_document IS NOT NULL;

-- 4. Get CPD summary by document type
-- SELECT document_type, COUNT(*) as count, SUM(hours) as total_hours 
-- FROM cpd 
-- WHERE user_id = 'your-user-id' 
-- GROUP BY document_type;

-- 5. Get CPD activities with both old and new document fields
-- SELECT 
--   title,
--   COALESCE(supporting_document, certificate_proof) as document_url,
--   COALESCE(document_type, 'Certificate') as document_type
-- FROM cpd 
-- WHERE user_id = 'your-user-id'; 