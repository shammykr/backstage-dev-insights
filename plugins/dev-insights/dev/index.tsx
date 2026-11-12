import { createDevApp } from '@backstage/dev-utils';
import { devInsightsPlugin, DevInsightsPage } from '../src';

// Standalone frontend dev app. Expects the backend plugin's dev server on
// :7007 (see app-config.yaml at the repo root).
createDevApp()
  .registerPlugin(devInsightsPlugin)
  .addPage({
    element: <DevInsightsPage />,
    title: 'Dev Insights',
    path: '/dev-insights',
  })
  .render();
