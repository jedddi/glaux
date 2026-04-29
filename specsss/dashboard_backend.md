```md
# Glaux Dashboard Backend Specification

Build the backend foundation for the Glaux dashboard using:

- Next.js App Router
- TypeScript
- Supabase
- Zod
- TanStack Query on the frontend side
- Zustand only for lightweight client UI state

This task is only for the backend/data side needed to make the dashboard actually work. The dashboard UI already exists or is being built separately. Your job is to implement the backend-connected functionality that powers it.

## Product context

Glaux is a model analysis workspace for image classification models, especially `.onnx` and `.tflite`. The product helps users answer three questions:

1. What is this model?
2. How well does it perform?
3. Where does it fail? [file:1]

The dashboard is the main workspace after the landing page. It must support:
- creating and storing projects,
- uploading model files,
- showing recent projects,
- showing dashboard summary metrics,
- tracking project/model processing state,
- preparing data contracts for future Inspector, Evaluator, Failures, and Edge Hints pages. [file:1]

Do not fully implement evaluation or failure analysis yet, but design the backend so those pages can be added without schema redesign.

---

## Core backend goals

Implement the backend infrastructure for the dashboard so that:

- a user can create a project,
- upload an `.onnx` or `.tflite` model into that project,
- store file metadata in Supabase,
- store the uploaded file in Supabase Storage,
- create and update project processing states,
- fetch recent projects for the dashboard,
- fetch one aggregated dashboard summary for the active project,
- support rename/delete project actions,
- support a demo project flow,
- leave clear extension points for Inspector, Evaluator, Failures, and Edge Hints. [file:1][web:35][web:36]

---

## Stack decisions

Use these backend choices:

- Supabase Postgres as the main database
- Supabase Storage for uploaded model files
- Supabase Row Level Security for protected per-user data
- Next.js route handlers or server actions for API entry points
- Zod for validating all request payloads and key response contracts [web:35][web:38][web:41]

If background work is needed for model parsing or async processing, structure the code so it can later move into:
- Supabase Edge Functions with background tasks, or
- a dedicated parsing worker service [web:39][web:45]

For now, it is acceptable to mock the actual deep ONNX/TFLite parsing step as long as the pipeline, statuses, and stored metadata structure are real.

---

## Architecture principles

Follow these principles:

1. Make the backend project-centric.
   Every dashboard action should be centered around a `project`.

2. Separate storage from metadata.
   File binaries go into Supabase Storage; database tables store metadata, summaries, statuses, and relational links. [web:35][web:37]

3. Use aggregated dashboard queries.
   The dashboard should not have to stitch together many raw tables client-side just to render. Provide a concise dashboard summary response.

4. Design for future pages now.
   Even if Inspector, Evaluator, Failures, and Edge Hints are not fully built, define data models and status fields they will later depend on. [file:1]

5. Validate all input.
   Use Zod on all API inputs and important outputs. [web:16]

---

## Required domain entities

Create the following main entities.

### 1. projects

Represents one Glaux workspace/project.

Fields:
- id (uuid, primary key)
- user_id (uuid, nullable if auth is not fully implemented yet, but support future auth)
- name (text, required)
- slug (text, optional unique helper if needed)
- status (enum-like text)
- model_format (text nullable: `onnx` or `tflite`)
- active_model_asset_id (uuid nullable)
- latest_evaluation_id (uuid nullable)
- is_demo (boolean default false)
- created_at
- updated_at
- last_opened_at [file:1]

Allowed statuses:
- `draft`
- `uploading`
- `processing`
- `ready`
- `evaluated`
- `failed`

### 2. model_assets

Represents an uploaded model file.

Fields:
- id (uuid primary key)
- project_id (fk -> projects.id)
- original_filename
- storage_bucket
- storage_path
- file_size_bytes
- mime_type
- checksum
- format (`onnx` or `tflite`)
- upload_status (`pending`, `uploaded`, `failed`)
- parse_status (`pending`, `processing`, `completed`, `failed`)
- parse_error (text nullable)
- created_at
- updated_at [file:1][web:35]

### 3. model_summaries

Represents parsed metadata that will feed Dashboard and Inspector.

Fields:
- id
- project_id
- model_asset_id
- layer_count
- operator_count
- input_shapes (jsonb)
- output_shapes (jsonb)
- architecture_json (jsonb)
- tflite_metadata_json (jsonb nullable)
- edge_hints_json (jsonb nullable)
- created_at
- updated_at [file:1]

### 4. evaluations

Create now even if the dashboard only uses light summary info for now.

Fields:
- id
- project_id
- dataset_name
- dataset_size
- status (`pending`, `processing`, `completed`, `failed`)
- accuracy
- per_class_metrics_json
- confusion_matrix_json
- failures_count
- created_at
- completed_at [file:1]

### 5. failure_samples

Create now as a future-ready table.

Fields:
- id
- evaluation_id
- project_id
- asset_path
- true_label
- predicted_label
- confidence
- topk_json
- created_at [file:1]

### 6. activity_events

Used to populate dashboard activity history.

Fields:
- id
- project_id
- type
- label
- metadata_json
- created_at

Example event types:
- `project_created`
- `model_upload_started`
- `model_upload_completed`
- `model_parse_started`
- `model_parse_completed`
- `model_parse_failed`
- `evaluation_completed` [file:1]

---

## Supabase requirements

### Database

Create SQL migrations for all tables and indexes.
Add useful indexes on:
- projects.user_id
- projects.updated_at
- projects.last_opened_at
- model_assets.project_id
- model_summaries.project_id
- evaluations.project_id
- activity_events.project_id [web:37]

### Storage

Create at least these storage buckets:
- `models`
- optionally `datasets`
- optionally `demo-assets` [web:35]

Store uploaded model files in a structured path like:
- `models/{userId-or-sessionId}/{projectId}/{fileName}`

Do not store raw binary model files in the database. Store them in Supabase Storage and keep metadata in Postgres. [web:35][web:37]

### Security

Enable Row Level Security on all public-facing tables. Supabase recommends enabling RLS on exposed tables in the public schema. [web:38][web:41]

Implement policies so:
- a user can only read/update/delete their own projects and related rows,
- demo projects can be read safely according to your chosen logic,
- storage access is scoped to the owner or a safe demo path. [web:38][web:46]

If auth is not fully implemented yet, structure the schema and helper functions so `auth.uid()`-based ownership can be added cleanly.

---

## Next.js backend structure

Use a clean modular structure like:

```txt
src/
  app/
    api/
      projects/
        route.ts
      projects/[projectId]/
        route.ts
      projects/[projectId]/upload/
        route.ts
      projects/[projectId]/summary/
        route.ts
      projects/[projectId]/status/
        route.ts
      demo-project/
        route.ts
  lib/
    supabase/
      client.ts
      server.ts
      admin.ts
    validators/
      project.ts
      upload.ts
    services/
      project-service.ts
      upload-service.ts
      dashboard-service.ts
      activity-service.ts
      summary-service.ts
    types/
      db.ts
      project.ts
      dashboard.ts
```

Keep route handlers thin.
Put most logic into services.

---

## Required API contracts

Implement these endpoints or equivalent server actions.

### `POST /api/projects`

Creates a new project.

Request:
```json
{
  "name": "Bird Classifier"
}
```

Validation:
- name required
- trimmed
- reasonable max length

Behavior:
- create project with `draft` status
- create `project_created` activity event
- return created project

### `GET /api/projects`

Returns recent projects for the current user/session.

Support:
- search by project name
- filter by status
- sort by `last_opened_at` or `updated_at`
- default limit for dashboard recents

Response should include enough fields for the Recent Projects UI:
- id
- name
- model format
- status
- updated_at
- last_opened_at
- latest accuracy if available
- dataset size if available [file:1]

### `PATCH /api/projects/:projectId`

Supports:
- rename project
- update last_opened_at
- optionally set active flags later

### `DELETE /api/projects/:projectId`

Deletes a project and related records safely.
If file deletion is not yet fully implemented, at minimum:
- remove metadata rows transactionally,
- queue or attempt storage cleanup,
- log activity.

### `POST /api/projects/:projectId/upload`

Uploads a model file for a project.

Rules:
- accept only `.onnx` and `.tflite`
- validate extension and file size
- upload file to Supabase Storage
- create a `model_assets` row
- set project status to `uploading` then `processing`
- create activity events
- trigger parse step or simulated parse step
- return project + upload status [file:1][web:35]

### `GET /api/projects/:projectId/status`

Returns lightweight processing status for polling.

Response example:
```json
{
  "projectId": "uuid",
  "projectStatus": "processing",
  "uploadStatus": "uploaded",
  "parseStatus": "processing",
  "step": "Extracting model metadata"
}
```

### `GET /api/projects/:projectId/summary`

This is the main dashboard aggregator endpoint.

Return:
- project metadata
- summary metrics
- next action availability
- latest evaluation snippet
- recent activity snippet [file:1]

Example response:
```json
{
  "project": {
    "id": "proj_1",
    "name": "Bird Classifier",
    "modelFormat": "onnx",
    "status": "ready",
    "isDemo": false
  },
  "summary": {
    "layerCount": 28,
    "operatorCount": 28,
    "latestAccuracy": null,
    "latestDatasetSize": null,
    "hasEvaluation": false,
    "hasFailures": false,
    "edgeHintsAvailable": false
  },
  "nextActions": {
    "inspectEnabled": true,
    "evaluateEnabled": true,
    "failuresEnabled": false,
    "edgeHintsEnabled": false
  },
  "activity": [
    {
      "type": "model_upload_completed",
      "label": "Model uploaded successfully",
      "createdAt": "..."
    }
  ]
}
```

### `GET /api/demo-project`

Returns a seeded demo project for empty-state exploration. [file:1]

---

## Validation requirements

Use Zod for:
- project creation payload
- project rename payload
- upload request metadata
- query params for search/filter/sort
- important API responses where practical [web:16]

Add server-side validation for:
- allowed file extensions
- maximum file size
- safe file names
- status values
- nullable metrics

Do not trust client-side validation alone.

---

## Upload pipeline behavior

Implement a robust upload and processing pipeline.

### Flow

1. User clicks Upload Model on dashboard. [file:1]
2. Frontend creates or selects a project.
3. Backend receives file upload.
4. Backend validates file type and size.
5. Backend uploads binary to Supabase Storage. [web:35]
6. Backend inserts `model_assets` row.
7. Backend updates `projects.status` to `uploading` then `processing`.
8. Backend creates activity events.
9. Backend starts model parsing or a placeholder async parse workflow.
10. Backend writes parsed summary into `model_summaries`.
11. Backend updates project status to `ready`.
12. Dashboard can now show real summary values and unlock Inspector/Evaluator. [file:1]

### For now

If true ONNX/TFLite parsing is not ready yet, implement a temporary parser adapter that:
- detects file extension,
- stores believable metadata structure,
- writes placeholder summary values in a clearly marked adapter layer,
- is easy to replace later with real parsing logic.

Do not hardcode fake values directly inside route handlers.

Create a service like:
- `parseModelAsset(modelAssetId)`
that can later be swapped to real ONNX/TFLite parsing.

---

## Dashboard summary logic

The dashboard summary should support the cards and controls already visible in the UI:

- total projects
- models analyzed
- failures flagged
- average accuracy
- recent projects
- status filtering
- search [attached image context]

Implement backend support for both:
1. global workspace stats for the dashboard home, and
2. active project summary for one selected project.

### Global workspace stats

Create a service that returns:
- total projects count
- total uploaded/analyzed models count
- total failures flagged across latest completed evaluations
- average accuracy across completed evaluations

Be careful with nulls:
- exclude null accuracy values from averages
- do not treat missing evaluations as 0 [file:1]

### Recent projects list

Return a list compatible with the dashboard cards/table:
- project id
- project name
- format
- status
- updated_at
- last_opened_at
- latest accuracy
- failures count if available

Support search and filters:
- all
- complete
- analyzing
- uploading
- failed
- draft

Map UI filters to backend statuses cleanly.

---

## Service layer requirements

Create these services:

### `projectService`
Handles:
- createProject
- listProjects
- updateProject
- deleteProject
- touchProjectLastOpened

### `uploadService`
Handles:
- validateModelFile
- uploadModelToStorage
- createModelAsset
- attachModelToProject

### `summaryService`
Handles:
- getProjectDashboardSummary
- getWorkspaceDashboardStats
- deriveNextActions

### `activityService`
Handles:
- logEvent
- getRecentActivityForProject

### `modelParsingService`
Handles:
- parseModelAsset
- updateSummaryFromParsedResult
- markParseFailed

Keep business logic out of route files.

---

## Future-ready requirements

Prepare the backend so future pages can use the same data layer.

### Inspector
Will later consume:
- model file info
- input/output shapes
- layer/operator counts
- architecture json
- TFLite metadata [file:1]

### Evaluator
Will later consume:
- dataset metadata
- evaluation runs
- accuracy
- per-class metrics
- confusion matrix [file:1]

### Failures
Will later consume:
- failure_samples
- confusion pairs
- confidence values
- preview asset references [file:1]

### Edge Hints
Will later consume:
- quantization info
- file size
- edge-readiness hints
- TFLite-only metadata [file:1]

Do not build these pages yet, but make sure the schema and service boundaries already support them.

---

## Error handling and states

Support these states clearly in backend responses:

- `draft`
- `uploading`
- `processing`
- `ready`
- `evaluated`
- `failed`

Handle failure cases:
- invalid file type
- oversized upload
- storage upload failure
- db insert failure
- parse failure
- missing project
- unauthorized access

Return clean structured errors like:
```json
{
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only .onnx and .tflite files are supported."
  }
}
```

Never return raw stack traces to the client.

---

## Demo data support

Implement a demo project strategy.

Possible approach:
- seed one demo project in the database, or
- generate a shared read-only demo project path

The dashboard needs a believable sample project so the product still feels alive in empty state and portfolio demos. [file:1]

The demo project should include:
- project metadata
- model summary
- optional sample activity
- optional stub evaluation metrics [file:1]

---

## Non-functional requirements

### Security
- use RLS on all exposed tables [web:38][web:41]
- restrict storage objects by owner/demo policy [web:46]
- do not expose service-role keys to the client

### Maintainability
- use service layer abstraction
- centralize schemas and types
- avoid duplicated status logic

### Observability
- log upload failures
- log parse failures
- log key activity events

### Performance
- use concise summary queries
- index relational joins
- do not overfetch full architecture JSON on the dashboard if only counts are needed

---

## Deliverables

Generate:

1. Supabase SQL schema/migration files
2. Supabase storage bucket setup notes
3. Next.js route handlers for the required dashboard endpoints
4. Zod schemas for request validation
5. Service-layer implementation
6. A parser adapter stub for future ONNX/TFLite parsing
7. Seed/demo project support
8. Clean TypeScript types for API responses

The implementation should be production-leaning, not just mocked frontend glue.

---

## Final implementation guidance

Build the backend so the dashboard becomes a real project workspace.

The key outcome is:
- the Upload Model button works,
- projects persist,
- recent projects populate from real data,
- status filters and search work,
- dashboard summary cards can be driven by real backend data,
- the app is structurally ready for Inspector, Evaluator, Failures, and Edge Hints. [file:1]

Avoid shortcuts like:
- storing everything in one JSON blob,
- hardcoding fake dashboard metrics inside components,
- mixing storage URLs and relational metadata carelessly,
- pushing all logic into route handlers.

Favor:
- clean schema,
- explicit statuses,
- service-layer architecture,
- clear upgrade path for real model parsing later.
```