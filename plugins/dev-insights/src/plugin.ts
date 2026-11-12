import {
  createApiFactory,
  createComponentExtension,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { DevInsightsClient, devInsightsApiRef } from './api';
import { rootRouteRef } from './routes';

/** @public */
export const devInsightsPlugin = createPlugin({
  id: 'dev-insights',
  apis: [
    createApiFactory({
      api: devInsightsApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: deps => new DevInsightsClient(deps),
    }),
  ],
  routes: {
    root: rootRouteRef,
  },
});

/**
 * Full-page, platform-wide dashboard.
 *
 * @public
 */
export const DevInsightsPage = devInsightsPlugin.provide(
  createRoutableExtension({
    name: 'DevInsightsPage',
    component: () =>
      import('./components/DevInsightsPage').then(m => m.DevInsightsPage),
    mountPoint: rootRouteRef,
  }),
);

/**
 * Entity overview card scoped to the entity's `github.com/project-slug` repo.
 *
 * @public
 */
export const EntityDevInsightsCard = devInsightsPlugin.provide(
  createComponentExtension({
    name: 'EntityDevInsightsCard',
    component: {
      lazy: () =>
        import('./components/EntityDevInsightsCard').then(
          m => m.EntityDevInsightsCard,
        ),
    },
  }),
);
