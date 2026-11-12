export {
  devInsightsPlugin,
  DevInsightsPage,
  EntityDevInsightsCard,
} from './plugin';
export {
  GITHUB_PROJECT_SLUG_ANNOTATION,
  getGithubProjectSlug,
  isDevInsightsAvailable,
} from './catalog';
export { devInsightsApiRef, DevInsightsClient } from './api';
export type { DevInsightsApi } from './api';
export type * from './api/types';
export type { WidgetId } from './components/Dashboard';
