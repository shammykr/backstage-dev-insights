import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';
import { HealthReportGenerator } from './service/HealthReportGenerator';
import { MetricsCollector } from './service/MetricsCollector';

/**
 * Dev Insights backend plugin. Mounted at /api/dev-insights.
 *
 * @public
 */
export const devInsightsPlugin = createBackendPlugin({
  pluginId: 'dev-insights',
  register(env) {
    env.registerInit({
      deps: {
        config: coreServices.rootConfig,
        logger: coreServices.logger,
        cache: coreServices.cache,
        httpRouter: coreServices.httpRouter,
      },
      async init({ config, logger, cache, httpRouter }) {
        const collector = MetricsCollector.fromConfig(config, {
          logger,
          cache,
        });
        const reports = new HealthReportGenerator(config, logger);
        httpRouter.use(await createRouter({ logger, collector, reports }));
        httpRouter.addAuthPolicy({ path: '/health', allow: 'unauthenticated' });
      },
    });
  },
});
