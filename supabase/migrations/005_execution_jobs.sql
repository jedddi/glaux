-- Execution jobs table for FastAPI-backed execution service
-- Supports both inspection and evaluation job kinds
-- Uses normalized lifecycle: queued -> running -> succeeded/failed

create table if not exists execution_jobs (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('inspection', 'evaluation')),
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed')),
  project_id uuid not null references projects(id) on delete cascade,
  initiated_by text,
  fastapi_job_id text,
  progress_message text,
  error_code text,
  error_message text,
  request_payload jsonb,
  result_summary jsonb,
  artifacts jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_execution_jobs_project_id on execution_jobs(project_id);
create index if not exists idx_execution_jobs_status on execution_jobs(status);
create index if not exists idx_execution_jobs_kind on execution_jobs(kind);
create index if not exists idx_execution_jobs_created_at on execution_jobs(created_at desc);

-- RLS policies
alter table execution_jobs enable row level security;

drop policy if exists "Allow public read on execution_jobs" on execution_jobs;
drop policy if exists "Allow public insert on execution_jobs" on execution_jobs;
drop policy if exists "Allow public update on execution_jobs" on execution_jobs;
drop policy if exists "Allow public delete on execution_jobs" on execution_jobs;

create policy "Allow public read on execution_jobs" on execution_jobs for select using (true);
create policy "Allow public insert on execution_jobs" on execution_jobs for insert with check (true);
create policy "Allow public update on execution_jobs" on execution_jobs for update using (true);
create policy "Allow public delete on execution_jobs" on execution_jobs for delete using (true);

-- Update updated_at trigger
drop trigger if exists update_execution_jobs_updated_at on execution_jobs;
create trigger update_execution_jobs_updated_at
  before update on execution_jobs
  for each row
  execute function update_updated_at_column();
