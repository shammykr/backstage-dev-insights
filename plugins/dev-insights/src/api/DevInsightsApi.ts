import {
  createApiRef,
  DiscoveryApi,
  FetchApi,
} from '@backstage/core-plugin-api';
import { ResponseError } from '@backstage/errors';
import { HealthReport, MetricsQuery, MetricsReport, Target } from './types';

/** @public */
export interface DevInsightsApi {
  getTargets(): Promise<Target[]>;
  getMetrics(query: MetricsQuery): Promise<MetricsReport>;
  generateHealthReport(query: MetricsQuery): Promise<HealthReport>;
}

/** @public */
export const devInsightsApiRef = createApiRef<DevInsightsApi>({
  id: 'plugin.dev-insights.service',
});

function toParams(query: MetricsQuery): string {
  const params = new URLSearchParams();
  if (query.days) params.set('days', String(query.days));
  if (query.repos?.length) params.set('repos', query.repos.join(','));
  if (query.teams?.length) params.set('teams', query.teams.join(','));
  const s = params.toString();
  return s ? `?${s}` : '';
}

/** Default client: talks to the backend plugin through Backstage discovery + fetch APIs. */
export class DevInsightsClient implements DevInsightsApi {
  constructor(
    private readonly deps: { discoveryApi: DiscoveryApi; fetchApi: FetchApi },
  ) {}

  private async call<T>(path: string, init?: RequestInit): Promise<T> {
    const base = await this.deps.discoveryApi.getBaseUrl('dev-insights');
    const res = await this.deps.fetchApi.fetch(`${base}${path}`, init);
    if (!res.ok) throw await ResponseError.fromResponse(res);
    return (await res.json()) as T;
  }

  async getTargets() {
    return (await this.call<{ targets: Target[] }>('/targets')).targets;
  }

  getMetrics(query: MetricsQuery) {
    return this.call<MetricsReport>(`/metrics${toParams(query)}`);
  }

  generateHealthReport(query: MetricsQuery) {
    return this.call<HealthReport>('/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    });
  }
}
