import { createBackend } from '@backstage/backend-defaults';
import { mockServices } from '@backstage/backend-test-utils';

// Standalone dev backend for the plugin. Run `npm start` in this package,
// using the repo-root app-config.yaml (GITHUB_TOKEN and optional LLM_API_KEY).
//
//   curl http://localhost:7007/api/dev-insights/targets
//   curl 'http://localhost:7007/api/dev-insights/metrics?days=14'
//
// Auth is mocked so the endpoints can be called without a token.
const backend = createBackend();

backend.add(mockServices.auth.factory());
backend.add(mockServices.httpAuth.factory());
backend.add(import('../src'));

backend.start();
