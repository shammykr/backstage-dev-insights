export interface Config {
  devInsights?: {
    github?: {
      /**
       * GitHub token used to call the REST API.
       * @visibility secret
       */
      token?: string;
      /** REST API base URL. Defaults to https://api.github.com (set for GHES). */
      apiBaseUrl?: string;
    };
    /**
     * Repositories to collect metrics from. Each entry is either a whole
     * organization (`org`) or a single repository (`repo: owner/name`),
     * optionally tagged with the owning team.
     */
    targets: Array<{
      org?: string;
      repo?: string;
      team?: string;
      /** Max repos to pull from an org (most recently pushed first). Default 30. */
      maxRepos?: number;
    }>;
    /** Workflow names matching this regex count as deployments. Default: "deploy|release|publish". */
    deployWorkflowPattern?: string;
    /** Default time window in days. Default 7. */
    defaultWindowDays?: number;
    /** Cache TTL for collected metrics in minutes. Default 15. */
    cacheTtlMinutes?: number;
    llm?: {
      /** OpenAI-compatible base URL, e.g. https://api.openai.com/v1 */
      baseUrl?: string;
      /**
       * API key for the LLM endpoint. If omitted, a deterministic stub report is returned.
       * @visibility secret
       */
      apiKey?: string;
      /** Model name. Default gpt-4o-mini. */
      model?: string;
    };
  };
}
