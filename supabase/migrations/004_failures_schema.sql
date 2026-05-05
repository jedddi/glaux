-- =============================================================================
-- Glaux Failures Phase Schema Migration
-- =============================================================================

-- =============================================================================
-- FAILURE_ANALYSES TABLE — tracks analysis runs per evaluation
-- =============================================================================
CREATE TABLE IF NOT EXISTS failure_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  model_asset_id UUID REFERENCES model_assets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'queued', 'running', 'completed', 'failed')),
  total_failures INTEGER DEFAULT 0,
  top_confused_pairs JSONB DEFAULT '[]',
  failure_by_true_class JSONB DEFAULT '[]',
  failure_by_predicted_class JSONB DEFAULT '[]',
  provenance TEXT DEFAULT 'simulated',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failure_analyses_project ON failure_analyses (project_id);
CREATE INDEX IF NOT EXISTS idx_failure_analyses_evaluation ON failure_analyses (evaluation_id);
CREATE INDEX IF NOT EXISTS idx_failure_analyses_status ON failure_analyses (status);

DROP TRIGGER IF EXISTS update_failure_analyses_updated_at ON failure_analyses;
CREATE TRIGGER update_failure_analyses_updated_at
  BEFORE UPDATE ON failure_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- EXTEND FAILURE_SAMPLES TABLE — add columns for richer failure data
-- =============================================================================
ALTER TABLE failure_samples
  ADD COLUMN IF NOT EXISTS model_asset_id UUID REFERENCES model_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS error_type TEXT,
  ADD COLUMN IF NOT EXISTS rank INTEGER,
  ADD COLUMN IF NOT EXISTS input_preview_url TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS update_failure_samples_updated_at ON failure_samples;
CREATE TRIGGER update_failure_samples_updated_at
  BEFORE UPDATE ON failure_samples
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS for failure_analyses
-- =============================================================================
ALTER TABLE failure_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on failure_analyses" ON failure_analyses;
DROP POLICY IF EXISTS "Allow public insert on failure_analyses" ON failure_analyses;
DROP POLICY IF EXISTS "Allow public update on failure_analyses" ON failure_analyses;

CREATE POLICY "Allow public read on failure_analyses" ON failure_analyses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on failure_analyses" ON failure_analyses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on failure_analyses" ON failure_analyses FOR UPDATE USING (true);

-- =============================================================================
-- ACTIVITY_EVENTS — add failure event types
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
    'failures_viewed',
    'failure_analysis_started',
    'failure_analysis_completed',
    'failure_analysis_failed'
  ));
