# Backstage Dev Insights Plugin

Backstage.io plugins that show developer productivity metrics (**build times, deployment frequency, PR cycle time**) for every repo a platform team tracks. The data comes from the GitHub REST API. An LLM writes a **weekly team health report** from the same metrics.

| Package | Role |
| --- | --- |
| `@internal/plugin-dev-insights` | Frontend plugin: dashboard page, filterable widgets, entity card |
| `@internal/plugin-dev-insights-backend` | Backend plugin: GitHub collection, cross-team aggregation, LLM reports |

## Architecture

```
 Backstage frontend                         Backstage backend
┌──────────────────────────────┐          ┌───────────────────────────────────────┐
│ DevInsightsPage              │  fetch   │ /api/dev-insights                     │
│  Filters (window/team/repo,  │ ───────▶ │  GET  /targets   GET /metrics         │
│  widget toggles)             │          │  POST /summary                        │
│  Summary · Build times ·     │          │        │                 │            │
│  Deploy freq · PR cycle ·    │          │  MetricsCollector   HealthReportGen   │
│  Health report               │          │  (orgs → repos,     (OpenAI-compatible│
│ EntityDevInsightsCard        │          │   cache, p50/p90)    chat API / stub) │
│ (github.com/project-slug)    │          │        │                 │            │
└──────────────────────────────┘          └────────┼─────────────────┼────────────┘
                                                   ▼                 ▼
                                    GitHub REST: repos, pulls,   LLM endpoint
                                    actions/runs
```

- **Cross-team collection:** `devInsights.targets` takes whole orgs and/or single repos, each tagged with a `team`. Orgs expand into their most recently pushed repos. The repos are collected 4 at a time, and the results are cached with `coreServices.cache`.
- **Metrics:**
  - **PR cycle time:** `merged_at − created_at` for PRs merged in the window.
  - **Build time:** `updated_at − run_started_at` for workflow runs that succeeded or failed.
  - **Deployment frequency:** successful runs whose workflow name matches `deployWorkflowPattern`.
  - Platform totals come from the raw samples, not from averaging per-repo medians.
- **LLM reports:** `POST /summary` collects metrics for the requested window and scope, sends a compact JSON version to `{baseUrl}/chat/completions`, and returns Markdown. If no API key is set, it returns a deterministic stub report instead.
- **Backstage APIs used:**
  - `@backstage/core-plugin-api`: `createPlugin`, `createApiRef`, `createApiFactory`, `createRoutableExtension`, `createComponentExtension`, `discoveryApiRef`, `fetchApiRef`.
  - `@backstage/catalog-model`: `Entity` and `stringifyEntityRef`, through the `isDevInsightsAvailable` / `getGithubProjectSlug` helpers.
  - Backend: the new backend system (`createBackendPlugin`, `coreServices`), plus a `config.d.ts` config schema.

## Installation into a Backstage app

```bash
yarn --cwd packages/app add @internal/plugin-dev-insights
yarn --cwd packages/backend add @internal/plugin-dev-insights-backend
```

```ts
// packages/backend/src/index.ts
backend.add(import('@internal/plugin-dev-insights-backend'));
```

```tsx
// packages/app/src/App.tsx
import { DevInsightsPage } from '@internal/plugin-dev-insights';
<Route path="/dev-insights" element={<DevInsightsPage defaultDays={7} />} />

// packages/app/src/components/catalog/EntityPage.tsx
import { EntityDevInsightsCard, isDevInsightsAvailable } from '@internal/plugin-dev-insights';
<EntitySwitch>
  <EntitySwitch.Case if={isDevInsightsAvailable}>
    <Grid item md={6}><EntityDevInsightsCard /></Grid>
  </EntitySwitch.Case>
</EntitySwitch>
```

## Configuration

```yaml
devInsights:
  github:
    token: ${GITHUB_TOKEN}          # needs read access to repos + actions
    # apiBaseUrl: https://ghe.example.com/api/v3
  targets:                           # which repos to track
    - org: my-org                    # all (non-archived) repos, newest first
      team: platform
      maxRepos: 30
    - repo: my-org/payments-api
      team: payments
  deployWorkflowPattern: 'deploy|release|publish'
  defaultWindowDays: 7
  cacheTtlMinutes: 15
  llm:
    baseUrl: https://api.openai.com/v1   # any OpenAI-compatible endpoint
    apiKey: ${LLM_API_KEY}               # omit → stub report
    model: gpt-4o-mini
```

## Running locally

```bash
npm install
export GITHUB_TOKEN=$(gh auth token)      # optional: LLM_API_KEY=...
npm run start:backend                     # http://localhost:7007 (auth mocked)
npm run start:frontend                    # http://localhost:3000/dev-insights
curl 'localhost:7007/api/dev-insights/metrics?days=7&teams=web'
curl -XPOST localhost:7007/api/dev-insights/summary -H 'Content-Type: application/json' -d '{"days":7}'
```

## Results

I checked the backend against the live GitHub API with the sample `app-config.yaml` (3 `backstage` org repos, `octokit/octokit.js`, `vercel/next.js`, 5 repos across 3 teams):
- `/metrics` returned per-repo and platform totals for PRs, workflow runs and deployments.
- Repo and team filters worked.
- Invalid input returned a 400 error.
- `/summary` returned the stub report when no key was set.
- With a key, `/summary` sent a correct chat-completions request to a mock OpenAI-compatible server.

No benchmark numbers are claimed.

**Limitation:** GitHub caps workflow-run listings at 1000 results per query, so build counts for very busy repos are capped too.

## Contributing

1. Use Node 20 or newer, then run `npm install`. The repo uses `legacy-peer-deps` because there is deliberately no Jest setup.
2. The packages follow Backstage CLI conventions:
   - `backstage.role` in each `package.json`.
   - Public exports only through `src/index.ts`.
   - Backend config is declared in `plugins/dev-insights-backend/config.d.ts`.
3. Before opening a PR, run `npm run lint && npm run tsc && npm run build`. CI runs the same checks.
4. Keep the frontend's response types (`plugins/dev-insights/src/api/types.ts`) in sync with the backend's (`service/types.ts`).

## License

Apache-2.0
