import {
  InfoCard,
  MarkdownContent,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Box, Button, Chip, Typography } from '@material-ui/core';
import useAsyncFn from 'react-use/esm/useAsyncFn';
import { devInsightsApiRef, MetricsQuery } from '../../api';

/** On-demand LLM-written team health report for the current filters. */
export const HealthReportWidget = ({ query }: { query: MetricsQuery }) => {
  const api = useApi(devInsightsApiRef);
  const [{ value, loading, error }, generate] = useAsyncFn(
    () => api.generateHealthReport(query),
    [api, query.days, query.repos?.join(','), query.teams?.join(',')],
  );

  return (
    <InfoCard
      title="Team health report"
      subheader={`AI summary of the last ${query.days ?? 7} days`}
      action={
        <Button
          color="primary"
          variant="outlined"
          disabled={loading}
          onClick={() => generate()}
        >
          {value ? 'Regenerate' : 'Generate report'}
        </Button>
      }
    >
      {loading && <Progress />}
      {error && <ResponseErrorPanel error={error} />}
      {!loading && value && (
        <>
          <Box mb={1}>
            <Chip
              size="small"
              label={value.stub ? 'stub (no LLM key)' : value.model}
            />
            <Typography variant="caption" color="textSecondary">
              {' '}
              generated {new Date(value.generatedAt).toLocaleString()}
            </Typography>
          </Box>
          <MarkdownContent content={value.report} />
        </>
      )}
      {!loading && !value && !error && (
        <Typography color="textSecondary">
          Generate a natural-language summary of build, deployment and PR
          health for the selected teams and repositories.
        </Typography>
      )}
    </InfoCard>
  );
};
