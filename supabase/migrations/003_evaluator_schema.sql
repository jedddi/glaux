-- =============================================================================
-- Glaux Evaluator Phase Schema Migration
-- =============================================================================

-- =============================================================================
-- EVALUATIONS TABLE EXTENSIONS
-- =============================================================================
ALTER TABLE evaluations
  ADD COLUMN IF NOT EXISTS model_asset_id UUID REFERENCES model_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS dataset_source JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dataset_file_path TEXT,
  ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS loss NUMERIC(10, 6),
  ADD COLUMN IF NOT EXISTS sample_count INTEGER,
  ADD COLUMN IF NOT EXISTS class_count INTEGER,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add 'queued' to the status check constraint
ALTER TABLE evaluations DROP CONSTRAINT IF EXISTS evaluations_status_check;
ALTER TABLE evaluations ADD CONSTRAINT evaluations_status_check
  CHECK (status IN ('idle', 'queued', 'running', 'completed', 'failed'));

-- Update existing 'pending' status to 'idle' and 'complete' to 'completed'
UPDATE evaluations SET status = 'idle' WHERE status = 'pending';
UPDATE evaluations SET status = 'completed' WHERE status = 'complete';

CREATE INDEX IF NOT EXISTS idx_evaluations_model_asset ON evaluations (model_asset_id);

DROP TRIGGER IF EXISTS update_evaluations_updated_at ON evaluations;
CREATE TRIGGER update_evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ACTIVITY_EVENTS EXTENSIONS — add evaluator event types
-- =============================================================================
ALTER TABLE activity_events DROP CONSTRAINT IF EXISTS activity_events_event_type_check;
ALTER TABLE activity_events ADD CONSTRAINT activity_events_event_type_check
  CHECK (event_type IN (
    'model_uploaded',
    'model_parse_started',
    'model_parse_completed',
    'model_parse_failed',
    'inspector_viewed',
    'evaluator_viewed',
    'evaluation_started',
    'evaluation_completed',
    'evaluation_failed',
    'evaluation_dataset_uploaded',
    'failures_viewed'
  ));