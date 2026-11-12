import { Table, TableColumn } from '@backstage/core-components';
import { Tooltip, Typography } from '@material-ui/core';
import { RepoMetrics } from '../../api';

const repoColumn: TableColumn<RepoMetrics> = {
  title: 'Repository',
  field: 'repo',
  highlight: true,
  render: row =>
    row.error ? (
      <Tooltip title={row.error}>
        <Typography color="error" variant="body2">
          {row.repo} ⚠
        </Typography>
      </Tooltip>
    ) : (
      row.repo
    ),
};
const teamColumn: TableColumn<RepoMetrics> = { title: 'Team', field: 'team' };

/** Per-repo table with built-in search and column filtering. */
export const RepoTableWidget = (props: {
  title: string;
  repos: RepoMetrics[];
  columns: TableColumn<RepoMetrics>[];
}) => (
  <Table<RepoMetrics>
    title={props.title}
    data={props.repos}
    columns={[repoColumn, teamColumn, ...props.columns]}
    options={{
      search: true,
      filtering: true,
      paging: props.repos.length > 10,
      pageSize: 10,
      padding: 'dense',
    }}
  />
);
