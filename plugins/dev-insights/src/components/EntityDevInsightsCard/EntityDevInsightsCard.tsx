import { stringifyEntityRef } from '@backstage/catalog-model';
import { InfoCard, MissingAnnotationEmptyState } from '@backstage/core-components';
import { useEntity } from '@backstage/plugin-catalog-react';
import { useMemo } from 'react';
import {
  GITHUB_PROJECT_SLUG_ANNOTATION,
  getGithubProjectSlug,
} from '../../catalog';
import { Dashboard } from '../Dashboard';

export const EntityDevInsightsCard = (props: { days?: number }) => {
  const { entity } = useEntity();
  const slug = getGithubProjectSlug(entity);
  const repos = useMemo(() => (slug ? [slug] : []), [slug]);

  if (!slug) {
    return (
      <MissingAnnotationEmptyState annotation={GITHUB_PROJECT_SLUG_ANNOTATION} />
    );
  }
  return (
    <InfoCard
      title="Dev Insights"
      subheader={`${stringifyEntityRef(entity)} · ${slug}`}
    >
      <Dashboard query={{ days: props.days ?? 14, repos }} widgets={['summary']} />
    </InfoCard>
  );
};
