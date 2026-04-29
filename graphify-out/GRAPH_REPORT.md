# Graph Report - glaux  (2026-04-29)

## Corpus Check
- 39 files · ~34,985 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 96 nodes · 76 edges · 3 communities detected
- Extraction: 79% EXTRACTED · 21% INFERRED · 0% AMBIGUOUS · INFERRED: 16 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]

## God Nodes (most connected - your core abstractions)
1. `createServerSupabase()` - 9 edges
2. `POST()` - 4 edges
3. `GET()` - 3 edges
4. `validateModelFile()` - 3 edges
5. `getProjects()` - 3 edges
6. `getProject()` - 3 edges
7. `createProject()` - 3 edges
8. `updateProject()` - 3 edges
9. `deleteProject()` - 3 edges
10. `getProjectModels()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `createServerSupabase()`  [INFERRED]
  app\api\upload\route.ts → lib\supabase\server.ts
- `getDashboardStats()` --calls--> `createServerSupabase()`  [INFERRED]
  lib\services\projects.ts → lib\supabase\server.ts
- `GET()` --calls--> `getProjects()`  [INFERRED]
  app\api\projects\route.ts → lib\services\projects.ts
- `POST()` --calls--> `createProject()`  [INFERRED]
  app\api\projects\route.ts → lib\services\projects.ts
- `GET()` --calls--> `getProject()`  [INFERRED]
  app\api\projects\[id]\route.ts → lib\services\projects.ts

## Communities

### Community 0 - "Community 0"
Cohesion: 0.16
Nodes (13): DELETE(), GET(), PATCH(), GET(), GET(), POST(), createProject(), deleteProject() (+5 more)

### Community 2 - "Community 2"
Cohesion: 0.4
Nodes (4): getDashboardStats(), GET(), buildStoragePath(), POST()

### Community 3 - "Community 3"
Cohesion: 0.6
Nodes (3): formatBytes(), handleSubmit(), validateModelFile()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createServerSupabase()` connect `Community 0` to `Community 2`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `POST()` connect `Community 2` to `Community 0`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Are the 8 inferred relationships involving `createServerSupabase()` (e.g. with `POST()` and `getProjects()`) actually correct?**
  _`createServerSupabase()` has 8 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `POST()` (e.g. with `GET()` and `createServerSupabase()`) actually correct?**
  _`POST()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `GET()` (e.g. with `getDashboardStats()` and `POST()`) actually correct?**
  _`GET()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Are the 2 inferred relationships involving `getProjects()` (e.g. with `GET()` and `createServerSupabase()`) actually correct?**
  _`getProjects()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13 - nodes in this community are weakly interconnected._