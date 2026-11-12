/** Shapes returned by @internal/plugin-dev-insights-backend. */

export type Distribution = {
  count: number;
  median: number | null;
  p90: number | null;
};

export type DailyPoint = {
  date: string;
  prsMerged: number;
  builds: number;
  deployments: number;
};

export type MetricsBlock = {
  pullRequests: { merged: number; open: number; cycleTimeHours: Distribution };
  builds: {
    total: number;
    succeeded: number;
    failed: number;
    successRate: number | null;
    durationMinutes: Distribution;
  };
  deployments: { count: number; perWeek: number };
  daily: DailyPoint[];
};

export type RepoMetrics = MetricsBlock & {
  repo: string;
  team: string;
  error?: string;
};

export type MetricsReport = {
  windowDays: number;
  since: string;
  generatedAt: string;
  totals: MetricsBlock & { repos: number };
  repos: RepoMetrics[];
};

export type Target = { repo: string; team: string };

export type MetricsQuery = {
  days?: number;
  repos?: string[];
  teams?: string[];
};

export type HealthReport = {
  report: string;
  model: string;
  stub: boolean;
  generatedAt: string;
  windowDays: number;
};
