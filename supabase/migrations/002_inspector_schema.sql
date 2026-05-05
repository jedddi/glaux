-- =============================================================================
-- Glaux Inspector Phase Schema Migration
-- =============================================================================

-- =============================================================================
-- PROJECTS TABLE EXTENSIONS
-- =============================================================================
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS model_format TEXT CHECK (model_format IN ('onnx', 'tflite')),
  ADD COLUMN IF NOT EXISTS active_model_asset_id UUID REFERENCES model_assets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_projects_active_model ON projects (active_model_asset_id);

-- =============================================================================
-- MODEL_ASSETS TABLE EXTENSIONS
-- =============================================================================
ALTER TABLE model_assets
  ADD COLUMN IF NOT EXISTS format TEXT CHECK (format IN ('onnx', 'tflite')),
  ADD COLUMN IF NOT EXISTS upload_status TEXT NOT NULL DEFAULT 'completed' CHECK (upload_status IN ('pending', 'uploading', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS parse_status TEXT NOT NULL DEFAULT 'pending' CHECK (parse_status IN ('pending', 'processing', 'completed', 'failed')),
  ADD COLUMN IF NOT EXISTS parse_error TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DROP TRIGGER IF EXISTS update_model_assets_updated_at ON model_assets;
CREATE TRIGGER update_model_assets_updated_at
  BEFORE UPDATE ON model_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_model_assets_parse_status ON model_assets (parse_status);

-- =============================================================================
-- MODEL_SUMMARIES TABLE EXTENSIONS
-- =============================================================================
ALTER TABLE model_summaries
  ADD COLUMN IF NOT EXISTS model_asset_id UUID REFERENCES model_assets(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS operator_count INTEGER,
  ADD COLUMN IF NOT EXISTS input_shapes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS output_shapes JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS inputs_json JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS outputs_json JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS operators_json JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS architecture_json JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tflite_metadata_json JSONB,
  ADD COLUMN IF NOT EXISTS edge_hints_json JSONB;

CREATE INDEX IF NOT EXISTS idx_model_summaries_asset ON model_summaries (model_asset_id);

-- =============================================================================
-- ACTIVITY_EVENTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS activity_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'model_uploaded',
    'model_parse_started',
    'model_parse_completed',
    'model_parse_failed',
    'inspector_viewed',
    'evaluator_viewed',
    'failures_viewed'
  )),
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_events_project ON activity_events (project_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_type ON activity_events (event_type);
CREATE INDEX IF NOT EXISTS idx_activity_events_created ON activity_events (created_at DESC);

-- =============================================================================
-- RLS POLICIES FOR ACTIVITY_EVENTS
-- =============================================================================
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on activity_events" ON activity_events;
DROP POLICY IF EXISTS "Allow public insert on activity_events" ON activity_events;

CREATE POLICY "Allow public read on activity_events" ON activity_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert on activity_events" ON activity_events FOR INSERT WITH CHECK (true);
