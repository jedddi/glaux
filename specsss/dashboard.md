
```md
## Final recommended tech stack

Glaux should use the following stack:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase
- TanStack Query
- Zod
- Zustand

This is a strong and realistic stack for Glaux because the product is a dashboard-style web app with project persistence, file uploads, model-analysis workflows, and future multi-page navigation such as Dashboard, Inspector, Evaluator, Failures, and Edge Hints. Next.js already gives the app a solid application foundation, TypeScript improves maintainability, and Tailwind is already in place from the existing website setup. [cite:2][cite:3]

Supabase is the recommended database and backend platform for this project. It provides a Postgres database and integrates well with Next.js, which makes it a good fit for storing projects, model metadata, evaluation summaries, and uploaded file references. It also leaves room for future authentication and storage needs without forcing a separate backend rewrite early on. [web:8][web:12][cite:4]

TanStack Query should be used for server-state management, not for local UI state. It is a strong fit for Glaux because the dashboard will need to fetch and refresh recent projects, active project summaries, upload status, and later evaluation/failure results; TanStack Query is designed for this style of cached async data flow. Its defaults treat cached data as stale by default, so query settings should be configured intentionally rather than left completely untouched. [web:26]

Zod should be used for runtime validation across forms, route handlers, and shared schemas. TypeScript only checks types during development, but Zod validates real runtime input, which is especially useful for project creation forms, rename dialogs, upload metadata, and API request parsing. It also lets types be inferred directly from schemas, reducing duplicated definitions. [web:16]

Zustand should be used only for lightweight client-side app state. It is appropriate for things like the active project id, sidebar open/closed state, modal visibility, dashboard filters, and temporary cross-page UI state; it should not replace TanStack Query for fetched data and should not become a second source of truth for server-backed records. [web:26]

### Stack responsibility split

Use each tool for a clearly different responsibility:

- **Next.js**: application framework, routing, server actions or route handlers, page structure
- **TypeScript**: type safety across components, utilities, and data contracts
- **Tailwind CSS**: styling and fast UI composition
- **Supabase**: database, storage, optional auth, backend persistence
- **TanStack Query**: fetching, caching, invalidation, async server-state synchronization
- **Zod**: runtime schema validation and inferred types
- **Zustand**: minimal global client state [web:8][web:26][web:16]

### Why this stack is right for Glaux

This stack is appropriate because Glaux is not just a static site anymore. The dashboard needs persistent projects, model upload flows, conditional navigation, summary cards, and later richer analysis views. Supabase covers the data layer well, while TanStack Query helps the frontend stay responsive and predictable as more server-derived state is introduced. [cite:2][web:8][web:26]

At the same time, the stack is still manageable for a solo build. Since the website already exists in Next.js + TypeScript + Tailwind, the remaining additions are incremental rather than disruptive. The only important rule is to keep responsibilities separated: do not use Zustand for fetched data, do not skip Zod for input validation, and do not overcomplicate the first version with unnecessary abstractions. [cite:3][web:16][web:26]

### Recommended usage in Glaux

For the dashboard specifically:

- Use **Supabase** tables for projects, model assets, model summaries, evaluations, and later failure samples.
- Use **Supabase Storage** for uploaded model files and possibly dataset assets.
- Use **TanStack Query** for recent projects, active project dashboard summary, upload/parse status polling, and post-mutation cache invalidation.
- Use **Zod** for project forms, upload validation, route-handler input parsing, and shared domain schemas.
- Use **Zustand** for active project selection, UI shell state, and transient dashboard controls. [web:8][web:16][web:26]

### Practical recommendation

If implementation should stay simple, introduce the stack in this order:

1. Keep Next.js + TypeScript + Tailwind as the app foundation.
2. Add Supabase first for database and storage.
3. Add Zod next for validation.
4. Add TanStack Query once dashboard data fetching starts.
5. Add Zustand only when shared UI state becomes annoying to manage with props alone. [web:8][web:16][web:26]

This gives Glaux a professional, scalable stack without making the project harder than it needs to be in the early dashboard phase. [cite:2]
```

