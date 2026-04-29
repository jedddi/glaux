-- =============================================================================
-- Glaux Supabase Schema
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL CHECK (char_length(name) <= 128 AND char_length(name) > 0),
  description TEXT DEFAULT '' CHECK (char_length(description) <= 512),
  model_type TEXT NOT NULL DEFAULT 'pytorch' CHECK (model_type IN ('pytorch', 'tensorflow', 'onnx', 'other')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'uploading', 'analyzing', 'complete', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for listing projects by creation date
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects (status);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Idempotent: re-running this migration must not fail if triggers already exist
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- MODEL_ASSETS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS model_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL CHECK (file_size > 0),
  file_type TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'models',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_assets_project ON model_assets (project_id);
CREATE INDEX IF NOT EXISTS idx_model_assets_created ON model_assets (created_at DESC);

-- =============================================================================
-- MODEL_SUMMARIES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS model_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_parameters BIGINT,
  trainable_parameters BIGINT,
  architecture TEXT,
  input_shape TEXT,
  output_shape TEXT,
  layer_count INTEGER,
  top1_accuracy NUMERIC(5, 2),
  summary_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_model_summaries_project ON model_summaries (project_id);

DROP TRIGGER IF EXISTS update_model_summaries_updated_at ON model_summaries;
CREATE TRIGGER update_model_summaries_updated_at
  BEFORE UPDATE ON model_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- EVALUATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  dataset_name TEXT,
  dataset_size INTEGER,
  accuracy NUMERIC(5, 2),
  precision NUMERIC(5, 2),
  recall NUMERIC(5, 2),
  f1_score NUMERIC(5, 2),
  confusion_matrix JSONB,
  per_class_metrics JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'complete', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_evaluations_project ON evaluations (project_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_status ON evaluations (status);
CREATE INDEX IF NOT EXISTS idx_evaluations_created ON evaluations (created_at DESC);

-- =============================================================================
-- FAILURE_SAMPLES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS failure_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  evaluation_id UUID NOT NULL REFERENCES evaluations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_path TEXT,
  predicted_label TEXT,
  actual_label TEXT,
  confidence NUMERIC(5, 2),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_failure_samples_evaluation ON failure_samples (evaluation_id);
CREATE INDEX IF NOT EXISTS idx_failure_samples_project ON failure_samples (project_id);

-- =============================================================================
-- EDGE_HINTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS edge_hints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  hint_type TEXT NOT NULL CHECK (hint_type IN ('boundary', 'adversarial', 'distribution_shift', 'class_imbalance')),
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edge_hints_project ON edge_hints (project_id);
CREATE INDEX IF NOT EXISTS idx_edge_hints_severity ON edge_hints (severity);

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE failure_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE edge_hints ENABLE ROW LEVEL SECURITY;

-- Idempotent policies (re-runnable in SQL Editor)
DROP POLICY IF EXISTS "Allow public read on projects" ON projects;
DROP POLICY IF EXISTS "Allow public insert on projects" ON projects;
DROP POLICY IF EXISTS "Allow public update on projects" ON projects;
DROP POLICY IF EXISTS "Allow public delete on projects" ON projects;

DROP POLICY IF EXISTS "Allow public read on model_assets" ON model_assets;
DROP POLICY IF EXISTS "Allow public insert on model_assets" ON model_assets;
DROP POLICY IF EXISTS "Allow public update on model_assets" ON model_assets;
DROP POLICY IF EXISTS "Allow public delete on model_assets" ON model_assets;

DROP POLICY IF EXISTS "Allow public read on model_summaries" ON model_summaries;
DROP POLICY IF EXISTS "Allow public insert on model_summaries" ON model_summaries;
DROP POLICY IF EXISTS "Allow public update on model_summaries" ON model_summaries;

DROP POLICY IF EXISTS "Allow public read on evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow public insert on evaluations" ON evaluations;
DROP POLICY IF EXISTS "Allow public update on evaluations" ON evaluations;

DROP POLICY IF EXISTS "Allow public read on failure_samples" ON failure_samples;
DROP POLICY IF EXISTS "Allow public insert on failure_samples" ON failure_samples;

DROP POLICY IF EXISTS "Allow public read on edge_hints" ON edge_hints;
DROP POLICY IF EXISTS "Allow public insert on edge_hints" ON edge_hints;

-- Allow public read access for now (no auth yet)
CREATE POLICY "Allow public read on projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert on projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on projects" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on projects" ON projects FOR DELETE USING (true);

CREATE POLICY "Allow public read on model_assets" ON model_assets FOR SELECT USING (true);
CREATE POLICY "Allow public insert on model_assets" ON model_assets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on model_assets" ON model_assets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on model_assets" ON model_assets FOR DELETE USING (true);

CREATE POLICY "Allow public read on model_summaries" ON model_summaries FOR SELECT USING (true);
CREATE POLICY "Allow public insert on model_summaries" ON model_summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on model_summaries" ON model_summaries FOR UPDATE USING (true);

CREATE POLICY "Allow public read on evaluations" ON evaluations FOR SELECT USING (true);
CREATE POLICY "Allow public insert on evaluations" ON evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on evaluations" ON evaluations FOR UPDATE USING (true);

CREATE POLICY "Allow public read on failure_samples" ON failure_samples FOR SELECT USING (true);
CREATE POLICY "Allow public insert on failure_samples" ON failure_samples FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read on edge_hints" ON edge_hints FOR SELECT USING (true);
CREATE POLICY "Allow public insert on edge_hints" ON edge_hints FOR INSERT WITH CHECK (true);

-- =============================================================================
-- SUPABASE STORAGE
-- =============================================================================

-- Private bucket for uploaded model files. The app uploads through /api/upload.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'models',
  'models',
  false,
  262144000,
  ARRAY[
    'application/octet-stream',
    'application/x-onnx',
    'application/vnd.tensorflow.lite',
    'application/x-tflite'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Allow public read on model storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert on model storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on model storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on model storage" ON storage.objects;

CREATE POLICY "Allow public read on model storage"
ON storage.objects
FOR SELECT
USING (bucket_id = 'models');

CREATE POLICY "Allow public insert on model storage"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'models');

CREATE POLICY "Allow public update on model storage"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'models')
WITH CHECK (bucket_id = 'models');

CREATE POLICY "Allow public delete on model storage"
ON storage.objects
FOR DELETE
USING (bucket_id = 'models');
