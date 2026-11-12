import { RepoMetrics } from '../../api';
import { fmt } from './format';
import { RepoTableWidget } from './RepoTableWidget';

export const BuildTimesWidget = ({ repos }: { repos: RepoMetrics[] }) => (
  <RepoTableWidget
    title="Build times (GitHub Actions)"
    repos={repos}
    columns={[
      { title: 'Runs', field: 'builds.total', type: 'numeric', filtering: false },
      {
        title: 'Median (min)',
        field: 'builds.durationMinutes.median',
        type: 'numeric',
        filtering: false,
        render: r => fmt(r.builds.durationMinutes.median),
      },
      {
        title: 'p90 (min)',
        field: 'builds.durationMinutes.p90',
        type: 'numeric',
        filtering: false,
        render: r => fmt(r.builds.durationMinutes.p90),
      },
      {
        title: 'Success rate',
        field: 'builds.successRate',
        type: 'numeric',
        filtering: false,
        render: r => fmt(r.builds.successRate, '%'),
      },
    ]}
  />
);
