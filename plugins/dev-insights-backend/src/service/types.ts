export type Target = {
  /** owner/name */
  repo: string;
  team: string;
}

export type Distribution = {
  count: number;
  median: number | null;
  p90: number | null;
}

export type DailyPoint = {
  date: string;
  prsMerged: number;
  builds: number;
  deployments: number;
}

export type RepoMetrics = {
  repo: string;
  team: string;
  pullRequests: {
    merged: number;
    open: number;
    /** merged_at - created_at, hours */
    cycleTimeHours: Distribution;
  };
  builds: {
    total: number;
    succeeded: number;
    failed: number;
    successRate: number | null;
    /** run_started_at -> updated_at for completed runs, minutes */
    durationMinutes: Distribution;
  };
  deployments: {
    count: number;
    perWeek: number;
  };
  daily: DailyPoint[];
  error?: string;
}

export type MetricsReport = {
  windowDays: number;
  since: string;
  generatedAt: string;
  totals: Omit<RepoMetrics, 'repo' | 'team' | 'error'> & { repos: number };
  repos: RepoMetrics[];
}

/** Raw samples kept per repo so aggregates are computed from real data, not averages of medians. */
export type RepoSamples = {
  repo: string;
  team: string;
  mergedPrs: { createdAt: string; mergedAt: string }[];
  openPrs: number;
  runs: {
    name: string;
    conclusion: string | null;
    startedAt: string;
    durationMinutes: number | null;
  }[];
  error?: string;
}
