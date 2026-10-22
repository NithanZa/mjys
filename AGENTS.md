<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:home-page-assets -->
## Home Page Assets

When working on the home page (`app/(shell)/page.tsx`) and its components under `components/home/`:

- Store promotional images in `public/` and reference them with root paths (e.g., `/mitr welcome.png`, `/2026_0628 workshop kruEX line.png`).
- Use `next/image` with `fill` and `object-cover` / `object-center` for banner images.
- Time-bound promotional cards should auto-hide when expired, mirroring `WorkshopPromo` (it compares the current date to the workshop date and returns `null` outside the promotion window).
- Export new home page components from `components/home/index.ts` so `app/(shell)/page.tsx` can import them from `@/components/home`.

Current home page rendering order:

1. `TigerHeader` — studio header with mascot image.
2. `ThaiCalendarCard` — calendar/greeting card; accepts `displayName`.
3. `MilestoneCelebrationCard` — shown only when the member has an unseen milestone.
4. `TigerPromoCard` list — dynamic home banners fetched from `/api/home-banners`.
5. `WorkshopPromo` — links to `/book/occ_2026-06-28_0`; auto-hides after the promotion window.
6. `QuoteCard` and `PoseCard` — weekly quote and pose.
<!-- END:home-page-assets -->

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, use the installed graphify skill or instructions before doing anything else.

Rules:
- When graphify-out/graph.json exists, run `graphify query "<question>"` before your first grep, search or source-file read for a codebase question, and put this rule in every subagent prompt that explores code. Read raw files only for lines the graph or an earlier read already located. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
- A committed graphify-out/graph.json is rewritten whole on every build, so a large diff to it in a pull request is expected. Do not flag it as churn or suggest skipping the graph rebuild or its hooks.
