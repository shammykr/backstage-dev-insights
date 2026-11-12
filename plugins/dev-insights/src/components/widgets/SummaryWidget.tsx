import { InfoCard } from '@backstage/core-components';
import { Grid } from '@material-ui/core';
import { MetricsReport } from '../../api';
import { fmt, hours } from './format';
import { StatTile } from './StatTile';

export const SummaryWidget = ({ report }: { report: MetricsReport }) => {
  const t = report.totals;
  return (
    <InfoCard
      title="Platform summary"
      subheader={`${t.repos} repositories · last ${report.windowDays} days`}
    >
      <Grid container spacing={3}>
        <Grid item xs={6} md={3}>
          <StatTile
            label="Median build time"
            value={fmt(t.builds.durationMinutes.median, ' min')}
            caption={`p90 ${fmt(t.builds.durationMinutes.p90, ' min')}`}
            trend={t.daily.map(d => d.builds)}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatTile
            label="Build success rate"
            value={fmt(t.builds.successRate, '%')}
            caption={`${t.builds.failed} failed of ${t.builds.total}`}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatTile
            label="Deployments / week"
            value={fmt(t.deployments.perWeek)}
            caption={`${t.deployments.count} in window`}
            trend={t.daily.map(d => d.deployments)}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatTile
            label="Median PR cycle time"
            value={hours(t.pullRequests.cycleTimeHours.median)}
            caption={`p90 ${hours(t.pullRequests.cycleTimeHours.p90)} · ${t.pullRequests.merged} merged`}
            trend={t.daily.map(d => d.prsMerged)}
          />
        </Grid>
      </Grid>
    </InfoCard>
  );
};
