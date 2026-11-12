import { Progress, ResponseErrorPanel } from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Grid } from '@material-ui/core';
import useAsync from 'react-use/esm/useAsync';
import { devInsightsApiRef, MetricsQuery } from '../../api';
import {
  BuildTimesWidget,
  DeploymentFrequencyWidget,
  PrCycleTimeWidget,
  SummaryWidget,
} from '../widgets';

/** @public */
export type WidgetId =
  | 'summary'
  | 'buildTimes'
  | 'deploymentFrequency'
  | 'prCycleTime';

export const ALL_WIDGETS: { id: WidgetId; label: string }[] = [
  { id: 'summary', label: 'Summary' },
  { id: 'buildTimes', label: 'Build times' },
  { id: 'deploymentFrequency', label: 'Deployment frequency' },
  { id: 'prCycleTime', label: 'PR cycle time' },
];

export const Dashboard = (props: {
  query: MetricsQuery;
  widgets: WidgetId[];
}) => {
  const api = useApi(devInsightsApiRef);
  const { days, repos, teams } = props.query;
  const { value, loading, error } = useAsync(
    () => api.getMetrics({ days, repos, teams }),
    [api, days, repos?.join(','), teams?.join(',')],
  );

  if (loading) return <Progress />;
  if (error) return <ResponseErrorPanel error={error} />;
  if (!value) return null;

  const show = (id: WidgetId) => props.widgets.includes(id);
  return (
    <Grid container spacing={3}>
      {show('summary') && (
        <Grid item xs={12}>
          <SummaryWidget report={value} />
        </Grid>
      )}
      {show('buildTimes') && (
        <Grid item xs={12} lg={6}>
          <BuildTimesWidget repos={value.repos} />
        </Grid>
      )}
      {show('deploymentFrequency') && (
        <Grid item xs={12} lg={6}>
          <DeploymentFrequencyWidget repos={value.repos} />
        </Grid>
      )}
      {show('prCycleTime') && (
        <Grid item xs={12}>
          <PrCycleTimeWidget repos={value.repos} />
        </Grid>
      )}
    </Grid>
  );
};
