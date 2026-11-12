import { RepoMetrics } from '../../api';
import { RepoTableWidget } from './RepoTableWidget';

export const DeploymentFrequencyWidget = ({
  repos,
}: {
  repos: RepoMetrics[];
}) => (
  <RepoTableWidget
    title="Deployment frequency"
    repos={repos}
    columns={[
      {
        title: 'Deployments',
        field: 'deployments.count',
        type: 'numeric',
        filtering: false,
      },
      {
        title: 'Per week',
        field: 'deployments.perWeek',
        type: 'numeric',
        filtering: false,
      },
    ]}
  />
);
