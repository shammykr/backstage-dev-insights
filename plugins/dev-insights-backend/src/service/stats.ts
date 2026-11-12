import { DailyPoint, Distribution, RepoMetrics, RepoSamples } from './types';

const HOUR = 3_600_000;

export function distribution(values: number[]): Distribution {
  if (values.length === 0) return { count: 0, median: null, p90: null };
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) =>
    sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];
  const round = (n: number) => Math.round(n * 10) / 10;
  return { count: values.length, median: round(at(0.5)), p90: round(at(0.9)) };
}

function dayKeys(since: Date, until: Date): string[] {
  const keys: string[] = [];
  const d = new Date(since.toISOString().slice(0, 10));
  while (d <= until) {
    keys.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return keys;
}

/** Turns raw samples from one or more repos into a metrics block. */
export function computeMetrics(
  samples: RepoSamples[],
  opts: { since: Date; until: Date; windowDays: number; deployPattern: RegExp },
): Omit<RepoMetrics, 'repo' | 'team' | 'error'> {
  const merged = samples.flatMap(s => s.mergedPrs);
  const runs = samples.flatMap(s => s.runs);
  const completed = runs.filter(r => r.conclusion !== null);
  const succeeded = completed.filter(r => r.conclusion === 'success');
  const failed = completed.filter(r =>
    ['failure', 'timed_out', 'startup_failure'].includes(r.conclusion!),
  );
  const deploys = succeeded.filter(r => opts.deployPattern.test(r.name));

  const daily = new Map<string, DailyPoint>(
    dayKeys(opts.since, opts.until).map(date => [
      date,
      { date, prsMerged: 0, builds: 0, deployments: 0 },
    ]),
  );
  for (const pr of merged) {
    const p = daily.get(pr.mergedAt.slice(0, 10));
    if (p) p.prsMerged++;
  }
  for (const r of runs) {
    const p = daily.get(r.startedAt.slice(0, 10));
    if (p) p.builds++;
  }
  for (const r of deploys) {
    const p = daily.get(r.startedAt.slice(0, 10));
    if (p) p.deployments++;
  }

  return {
    pullRequests: {
      merged: merged.length,
      open: samples.reduce((n, s) => n + s.openPrs, 0),
      cycleTimeHours: distribution(
        merged.map(
          pr => (Date.parse(pr.mergedAt) - Date.parse(pr.createdAt)) / HOUR,
        ),
      ),
    },
    builds: {
      total: runs.length,
      succeeded: succeeded.length,
      failed: failed.length,
      successRate: completed.length
        ? Math.round((succeeded.length / completed.length) * 1000) / 10
        : null,
      durationMinutes: distribution(
        completed
          .map(r => r.durationMinutes)
          .filter((m): m is number => m !== null),
      ),
    },
    deployments: {
      count: deploys.length,
      perWeek:
        Math.round((deploys.length / Math.max(1, opts.windowDays / 7)) * 10) /
        10,
    },
    daily: [...daily.values()],
  };
}
