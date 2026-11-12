/**
 * Backend plugin that aggregates GitHub delivery metrics across teams.
 *
 * @packageDocumentation
 */
export { devInsightsPlugin as default } from './plugin';
export type {
  MetricsReport,
  RepoMetrics,
  Distribution,
  DailyPoint,
  Target,
} from './service/types';
export type { HealthReport } from './service/HealthReportGenerator';
