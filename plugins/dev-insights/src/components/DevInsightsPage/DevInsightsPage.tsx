import {
  Content,
  ContentHeader,
  Header,
  Page,
  Progress,
  ResponseErrorPanel,
  SupportButton,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import { Box } from '@material-ui/core';
import { useState } from 'react';
import useAsync from 'react-use/esm/useAsync';
import { devInsightsApiRef } from '../../api';
import { ALL_WIDGETS, Dashboard, WidgetId } from '../Dashboard';
import { Filters, FilterState } from './Filters';

/** @public */
export type DevInsightsPageProps = {
  title?: string;
  /** Initial time window in days. */
  defaultDays?: number;
  /** Widgets visible on first load; users can toggle them on the page. */
  defaultWidgets?: WidgetId[];
};

export const DevInsightsPage = (props: DevInsightsPageProps) => {
  const api = useApi(devInsightsApiRef);
  const targets = useAsync(() => api.getTargets(), [api]);
  const [filters, setFilters] = useState<FilterState>({
    days: props.defaultDays ?? 7,
    teams: [],
    repos: [],
    widgets: props.defaultWidgets ?? ALL_WIDGETS.map(w => w.id),
  });

  return (
    <Page themeId="tool">
      <Header
        title={props.title ?? 'Dev Insights'}
        subtitle="Build times, deployment frequency and PR cycle time across teams"
      />
      <Content>
        <ContentHeader title="Platform delivery metrics">
          <SupportButton>
            Metrics are collected from the GitHub REST API for every
            repository configured under devInsights.targets.
          </SupportButton>
        </ContentHeader>
        {targets.loading && <Progress />}
        {targets.error && <ResponseErrorPanel error={targets.error} />}
        {targets.value && (
          <>
            <Box mb={3}>
              <Filters
                targets={targets.value}
                value={filters}
                onChange={setFilters}
              />
            </Box>
            <Dashboard
              query={{
                days: filters.days,
                teams: filters.teams,
                repos: filters.repos,
              }}
              widgets={filters.widgets}
            />
          </>
        )}
      </Content>
    </Page>
  );
};
