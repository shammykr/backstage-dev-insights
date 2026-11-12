import { RepoMetrics } from '../../api';
import { hours } from './format';
import { RepoTableWidget } from './RepoTableWidget';

export const PrCycleTimeWidget = ({ repos }: { repos: RepoMetrics[] }) => (
  <RepoTableWidget
    title="Pull request cycle time"
    repos={repos}
    columns={[
      {
        title: 'Merged',
        field: 'pullRequests.merged',
        type: 'numeric',
        filtering: false,
      },
      {
        title: 'Open',
        field: 'pullRequests.open',
        type: 'numeric',
        filtering: false,
      },
      {
        title: 'Median',
        field: 'pullRequests.cycleTimeHours.median',
        type: 'numeric',
        filtering: false,
        render: r => hours(r.pullRequests.cycleTimeHours.median),
      },
      {
        title: 'p90',
        field: 'pullRequests.cycleTimeHours.p90',
        type: 'numeric',
        filtering: false,
        render: r => hours(r.pullRequests.cycleTimeHours.p90),
      },
    ]}
  />
);
