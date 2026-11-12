import { Entity } from '@backstage/catalog-model';

/**
 * Same annotation the upstream GitHub plugins use, so existing catalog
 * entities work without extra metadata.
 *
 * @public
 */
export const GITHUB_PROJECT_SLUG_ANNOTATION = 'github.com/project-slug';

/** @public */
export function getGithubProjectSlug(entity: Entity): string | undefined {
  return entity.metadata.annotations?.[GITHUB_PROJECT_SLUG_ANNOTATION];
}

/**
 * For use with EntitySwitch: true when the entity has a GitHub project slug.
 *
 * @public
 */
export function isDevInsightsAvailable(entity: Entity): boolean {
  return Boolean(getGithubProjectSlug(entity));
}
