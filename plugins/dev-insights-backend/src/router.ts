import { LoggerService } from '@backstage/backend-plugin-api';
import { InputError } from '@backstage/errors';
import express from 'express';
import Router from 'express-promise-router';
import { z } from 'zod';
import { HealthReportGenerator } from './service/HealthReportGenerator';
import { MetricsCollector } from './service/MetricsCollector';

const csv = z
  .string()
  .optional()
  .transform(v => (v ? v.split(',').map(s => s.trim()).filter(Boolean) : []));

const metricsQuery = z.object({
  days: z.coerce.number().int().min(1).max(90).optional(),
  repos: csv,
  teams: csv,
});

const summaryBody = z.object({
  days: z.number().int().min(1).max(90).optional(),
  repos: z.array(z.string()).optional(),
  teams: z.array(z.string()).optional(),
});

export async function createRouter(options: {
  logger: LoggerService;
  collector: MetricsCollector;
  reports: HealthReportGenerator;
}): Promise<express.Router> {
  const { collector, reports } = options;
  const router = Router();
  router.use(express.json());

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  /** All repos being tracked, with their owning team. */
  router.get('/targets', async (_req, res) => {
    res.json({ targets: await collector.resolveTargets() });
  });

  /** Aggregated + per-repo metrics, filterable by window, repos and teams. */
  router.get('/metrics', async (req, res) => {
    const parsed = metricsQuery.safeParse(req.query);
    if (!parsed.success) throw new InputError(parsed.error.message);
    res.json(await collector.getMetrics(parsed.data));
  });

  /** LLM-generated team health report for the given window / scope. */
  router.post('/summary', async (req, res) => {
    const parsed = summaryBody.safeParse(req.body ?? {});
    if (!parsed.success) throw new InputError(parsed.error.message);
    const metrics = await collector.getMetrics(parsed.data);
    res.json(await reports.generate(metrics));
  });

  return router;
}
