import { LoggerService, RootConfigService } from '@backstage/backend-plugin-api';
import { MetricsReport, RepoMetrics } from './types';

export type HealthReport = {
  report: string;
  model: string;
  /** true when no LLM key is configured and the deterministic fallback was used */
  stub: boolean;
  generatedAt: string;
  windowDays: number;
};

const SYSTEM_PROMPT = `You are an engineering effectiveness analyst writing a weekly team health report for a platform team.
Use only the metrics provided. Be concrete and cite numbers. Output Markdown with these sections:
## Overall health (one paragraph, include a one-word rating: Healthy / Watch / At risk)
## Highlights (bullets)
## Risks (bullets, name the specific repos or teams)
## Recommendations (2-4 actionable bullets)
Keep it under 300 words.`;

/** Compact view of the metrics so the prompt stays small even with many repos. */
function compact(report: MetricsReport) {
  const repo = (r: RepoMetrics) => ({
    repo: r.repo,
    team: r.team,
    prsMerged: r.pullRequests.merged,
    prsOpen: r.pullRequests.open,
    prCycleMedianH: r.pullRequests.cycleTimeHours.median,
    prCycleP90H: r.pullRequests.cycleTimeHours.p90,
    builds: r.builds.total,
    buildSuccessPct: r.builds.successRate,
    buildMedianMin: r.builds.durationMinutes.median,
    buildP90Min: r.builds.durationMinutes.p90,
    deploys: r.deployments.count,
    ...(r.error ? { collectionError: true } : {}),
  });
  const { daily, ...totals } = report.totals;
  return {
    windowDays: report.windowDays,
    since: report.since,
    totals,
    daily,
    repos: report.repos.map(repo),
  };
}

/** Generates a natural-language team health report via an OpenAI-compatible chat completions API. */
export class HealthReportGenerator {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(
    config: RootConfigService,
    private readonly logger: LoggerService,
  ) {
    this.baseUrl = (
      config.getOptionalString('devInsights.llm.baseUrl') ??
      'https://api.openai.com/v1'
    ).replace(/\/$/, '');
    this.apiKey = config.getOptionalString('devInsights.llm.apiKey');
    this.model =
      config.getOptionalString('devInsights.llm.model') ?? 'gpt-4o-mini';
  }

  async generate(metrics: MetricsReport): Promise<HealthReport> {
    const base = {
      generatedAt: new Date().toISOString(),
      windowDays: metrics.windowDays,
    };
    if (!this.apiKey) {
      return { ...base, report: stubReport(metrics), model: 'stub', stub: true };
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        temperature: 0.2,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Metrics (JSON):\n${JSON.stringify(compact(metrics))}`,
          },
        ],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`dev-insights: LLM call failed ${res.status}: ${body}`);
      throw new Error(`LLM request failed with status ${res.status}`);
    }
    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const report = json.choices?.[0]?.message?.content?.trim();
    if (!report) throw new Error('LLM returned an empty response');
    return { ...base, report, model: this.model, stub: false };
  }
}

/** Deterministic report used when no LLM key is configured. */
export function stubReport(m: MetricsReport): string {
  const t = m.totals;
  const issues: string[] = [];
  const highlights: string[] = [];

  for (const r of m.repos) {
    if (r.error) issues.push(`**${r.repo}**: metrics could not be collected.`);
    if (r.builds.successRate !== null && r.builds.successRate < 80)
      issues.push(
        `**${r.repo}** (${r.team}): build success rate ${r.builds.successRate}%.`,
      );
    if ((r.pullRequests.cycleTimeHours.median ?? 0) > 72)
      issues.push(
        `**${r.repo}** (${r.team}): median PR cycle time ${r.pullRequests.cycleTimeHours.median}h.`,
      );
  }
  const topDeployer = [...m.repos].sort(
    (a, b) => b.deployments.count - a.deployments.count,
  )[0];
  if (topDeployer?.deployments.count)
    highlights.push(
      `**${topDeployer.repo}** shipped most often (${topDeployer.deployments.count} deployments).`,
    );
  highlights.push(
    `${t.pullRequests.merged} PRs merged and ${t.builds.total} workflow runs across ${t.repos} repos.`,
  );

  let rating = 'At risk';
  if (issues.length === 0) rating = 'Healthy';
  else if (issues.length <= 2) rating = 'Watch';
  const bullets = (xs: string[], empty: string) =>
    xs.length ? xs.map(x => `- ${x}`).join('\n') : `- ${empty}`;

  return `> _Stub report: no LLM API key configured (devInsights.llm.apiKey)._

## Overall health
**${rating}.** Over the last ${m.windowDays} days the median build took ${t.builds.durationMinutes.median ?? '–'} min (p90 ${t.builds.durationMinutes.p90 ?? '–'} min) with a ${t.builds.successRate ?? '–'}% success rate, teams deployed ${t.deployments.perWeek} times per week, and the median PR went from open to merged in ${t.pullRequests.cycleTimeHours.median ?? '–'}h.

## Highlights
${bullets(highlights, 'No notable highlights.')}

## Risks
${bullets(issues, 'No repos crossed the risk thresholds (success rate < 80%, PR cycle > 72h).')}

## Recommendations
- Review the slowest p90 build pipelines for caching opportunities.
- Keep PRs small to bring the p90 cycle time (${t.pullRequests.cycleTimeHours.p90 ?? '–'}h) down.
`;
}
