import {
  CacheService,
  LoggerService,
  RootConfigService,
} from '@backstage/backend-plugin-api';
import { GithubClient } from './GithubClient';
import { computeMetrics } from './stats';
import { MetricsReport, RepoSamples, Target } from './types';

const DAY = 86_400_000;
const CONCURRENCY = 4;

interface TargetConfig {
  org?: string;
  repo?: string;
  team: string;
  maxRepos: number;
}

export interface MetricsQuery {
  days?: number;
  repos?: string[];
  teams?: string[];
}

async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const idx = i++;
        out[idx] = await fn(items[idx]);
      }
    }),
  );
  return out;
}

/**
 * Collects delivery metrics across every configured org/repo so the
 * dashboard can show platform-wide (cross-team) insights.
 */
export class MetricsCollector {
  private readonly targets: TargetConfig[];
  private readonly deployPattern: RegExp;
  readonly defaultWindowDays: number;
  private readonly ttlMs: number;

  static fromConfig(
    config: RootConfigService,
    deps: { logger: LoggerService; cache: CacheService },
  ) {
    const github = new GithubClient({
      token: config.getOptionalString('devInsights.github.token'),
      apiBaseUrl:
        config.getOptionalString('devInsights.github.apiBaseUrl') ??
        'https://api.github.com',
      logger: deps.logger,
    });
    return new MetricsCollector(config, github, deps.logger, deps.cache);
  }

  constructor(
    config: RootConfigService,
    private readonly github: GithubClient,
    private readonly logger: LoggerService,
    private readonly cache: CacheService,
  ) {
    this.targets = (
      config.getOptionalConfigArray('devInsights.targets') ?? []
    ).map(t => {
      const org = t.getOptionalString('org');
      const repo = t.getOptionalString('repo');
      if (!org === !repo) {
        throw new Error(
          'Each devInsights.targets entry needs exactly one of "org" or "repo"',
        );
      }
      return {
        org,
        repo,
        team: t.getOptionalString('team') ?? org ?? repo!.split('/')[0],
        maxRepos: t.getOptionalNumber('maxRepos') ?? 30,
      };
    });
    this.deployPattern = new RegExp(
      config.getOptionalString('devInsights.deployWorkflowPattern') ??
        'deploy|release|publish',
      'i',
    );
    this.defaultWindowDays =
      config.getOptionalNumber('devInsights.defaultWindowDays') ?? 7;
    this.ttlMs =
      (config.getOptionalNumber('devInsights.cacheTtlMinutes') ?? 15) * 60_000;
  }

  /** Expands org targets into concrete repos (deduplicated, first team wins). */
  async resolveTargets(): Promise<Target[]> {
    const cached = await this.cache.get<Target[]>('targets');
    if (cached) return cached;
    const seen = new Map<string, Target>();
    for (const t of this.targets) {
      const repos = t.repo
        ? [t.repo]
        : await this.github.listOrgRepos(t.org!, t.maxRepos);
      for (const repo of repos) {
        if (!seen.has(repo)) seen.set(repo, { repo, team: t.team });
      }
    }
    const result = [...seen.values()];
    await this.cache.set('targets', result, { ttl: this.ttlMs });
    return result;
  }

  private async collectRepo(
    target: Target,
    since: Date,
    days: number,
  ): Promise<RepoSamples> {
    const key = `samples:${target.repo}:${days}`;
    const cached = await this.cache.get<RepoSamples>(key);
    if (cached) return cached;
    try {
      const [closed, openPrs, runs] = await Promise.all([
        this.github.listClosedPulls(target.repo, since),
        this.github.countOpenPulls(target.repo),
        this.github.listWorkflowRuns(target.repo, since),
      ]);
      const samples: RepoSamples = {
        ...target,
        mergedPrs: closed
          .filter(pr => pr.merged_at && new Date(pr.merged_at) >= since)
          .map(pr => ({ createdAt: pr.created_at, mergedAt: pr.merged_at! })),
        openPrs,
        runs: runs
          .filter(r => new Date(r.created_at) >= since)
          .map(r => {
            const startedAt = r.run_started_at ?? r.created_at;
            return {
              name: r.name ?? '',
              conclusion: r.status === 'completed' ? r.conclusion : null,
              startedAt,
              durationMinutes:
                r.status === 'completed'
                  ? (Date.parse(r.updated_at) - Date.parse(startedAt)) / 60_000
                  : null,
            };
          }),
      };
      await this.cache.set(key, samples as any, { ttl: this.ttlMs });
      return samples;
    } catch (e) {
      this.logger.warn(`dev-insights: failed to collect ${target.repo}: ${e}`);
      return { ...target, mergedPrs: [], openPrs: 0, runs: [], error: String(e) };
    }
  }

  async getMetrics(query: MetricsQuery = {}): Promise<MetricsReport> {
    const days = query.days ?? this.defaultWindowDays;
    const until = new Date();
    const since = new Date(until.getTime() - days * DAY);

    let targets = await this.resolveTargets();
    if (query.repos?.length) {
      targets = targets.filter(t => query.repos!.includes(t.repo));
    }
    if (query.teams?.length) {
      targets = targets.filter(t => query.teams!.includes(t.team));
    }

    const samples = await mapLimit(targets, CONCURRENCY, t =>
      this.collectRepo(t, since, days),
    );
    const opts = {
      since,
      until,
      windowDays: days,
      deployPattern: this.deployPattern,
    };

    return {
      windowDays: days,
      since: since.toISOString(),
      generatedAt: until.toISOString(),
      totals: { repos: samples.length, ...computeMetrics(samples, opts) },
      repos: samples.map(s => ({
        repo: s.repo,
        team: s.team,
        ...computeMetrics([s], opts),
        ...(s.error ? { error: s.error } : {}),
      })),
    };
  }
}
