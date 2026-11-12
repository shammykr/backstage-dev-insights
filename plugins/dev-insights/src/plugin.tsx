import {
  createFrontendPlugin,
  PageBlueprint,
} from '@backstage/frontend-plugin-api';

import { rootRouteRef } from './routes';

export const page = PageBlueprint.make({
  params: {
    path: '/dev-insights',
    routeRef: rootRouteRef,
    loader: () =>
      import('./components/TodoPage').then(m => (
        <m.TodoPage />
      )),
  },
});

export const devInsightsPlugin = createFrontendPlugin({
  pluginId: 'dev-insights',
  extensions: [page],
  routes: {
    root: rootRouteRef,
  }
});
