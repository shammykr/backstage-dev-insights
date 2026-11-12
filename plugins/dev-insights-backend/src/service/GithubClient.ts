import { LoggerService } from '@backstage/backend-plugin-api';

const MAX_PAGES = 10;

interface GithubPull {
  number: number;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
}

interface GithubRun {
  name: string | null;
  status: string;
  conclusion: string | null;
  run_started_at?: string;
  created_at: string;
  updated_at: string;
}

interface GithubRepo {
  full_name: string;
  archived: boolean;
}

/** Minimal GitHub REST client covering the endpoints the plugin needs. */
export class GithubClient {
  constructor(
    private readonly options: {
      token?: string;
      apiBaseUrl: string;
      logger: LoggerService;
    },
  ) {}

  private async request<T>(path: string): Promise<{ data: T; next?: string }> {
    const url = path.startsWith('http')
      ? path
      : `${this.options.apiBaseUrl}${path}`;
    const res = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'backstage-plugin-dev-insights',
        ...(this.options.token
          ? { Authorization: `Bearer ${this.options.token}` }
          : {}),
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(
        `GitHub ${res.status} for ${url}: ${body.slice(0, 200)}`,
      );
    }
    const link = res.headers.get('link') ?? '';
    const next = /<([^>]+)>;\s*rel="next"/.exec(link)?.[1];
    return { data: (await res.json()) as T, next };
  }

  /** Follows Link headers; `stop` lets callers end early once results are older than the window. */
  private async paginate<T, R = T[]>(
    path: string,
    pick: (page: R) => T[],
    stop?: (items: T[]) => boolean,
  ): Promise<T[]> {
    const out: T[] = [];
    let next: string | undefined = path;
    for (let page = 0; next && page < MAX_PAGES; page++) {
      const res: { data: R; next?: string } = await this.request<R>(next);
      const items = pick(res.data);
      out.push(...items);
      if (stop?.(items)) break;
      next = res.next;
    }
    return out;
  }

  async listOrgRepos(org: string, max: number): Promise<string[]> {
    const repos = await this.paginate<GithubRepo>(
      `/orgs/${encodeURIComponent(org)}/repos?sort=pushed&direction=desc&per_page=100`,
      page => page as unknown as GithubRepo[],
      items => items.length < 100,
    );
    return repos
      .filter(r => !r.archived)
      .slice(0, max)
      .map(r => r.full_name);
  }

  /** Closed PRs updated since `since` (sorted by updated desc, so we stop once older). */
  async listClosedPulls(repo: string, since: Date): Promise<GithubPull[]> {
    return this.paginate<GithubPull>(
      `/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100`,
      page => page as unknown as GithubPull[],
      items =>
        items.length < 100 ||
        new Date(items[items.length - 1].updated_at) < since,
    );
  }

  async countOpenPulls(repo: string): Promise<number> {
    const open = await this.paginate<GithubPull>(
      `/repos/${repo}/pulls?state=open&per_page=100`,
      page => page as unknown as GithubPull[],
      items => items.length < 100,
    );
    return open.length;
  }

  async listWorkflowRuns(repo: string, since: Date): Promise<GithubRun[]> {
    const day = since.toISOString().slice(0, 10);
    return this.paginate<GithubRun, { workflow_runs: GithubRun[] }>(
      `/repos/${repo}/actions/runs?created=${encodeURIComponent(`>=${day}`)}&per_page=100`,
      page => page.workflow_runs,
      items => items.length < 100,
    );
  }
}
