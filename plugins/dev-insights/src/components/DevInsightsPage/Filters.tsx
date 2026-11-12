import { Select } from '@backstage/core-components';
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
} from '@material-ui/core';
import { Target } from '../../api';
import { ALL_WIDGETS, WidgetId } from '../Dashboard';

export const WINDOW_OPTIONS = [7, 14, 30, 90];

export type FilterState = {
  days: number;
  teams: string[];
  repos: string[];
  widgets: WidgetId[];
};

export const Filters = (props: {
  targets: Target[];
  value: FilterState;
  onChange: (next: FilterState) => void;
}) => {
  const { value, onChange, targets } = props;
  const teams = [...new Set(targets.map(t => t.team))].sort();
  const repos = targets
    .filter(t => !value.teams.length || value.teams.includes(t.team))
    .map(t => t.repo)
    .sort();

  return (
    <Grid container spacing={2} alignItems="flex-end">
      <Grid item xs={12} sm={3}>
        <Select
          label="Time window"
          selected={value.days}
          items={WINDOW_OPTIONS.map(d => ({ label: `Last ${d} days`, value: d }))}
          onChange={v => onChange({ ...value, days: Number(v) })}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <Select
          label="Teams"
          placeholder="All teams"
          multiple
          selected={value.teams}
          items={teams.map(t => ({ label: t, value: t }))}
          onChange={v =>
            onChange({ ...value, teams: v as string[], repos: [] })
          }
        />
      </Grid>
      <Grid item xs={12} sm={5}>
        <Select
          label="Repositories"
          placeholder="All repositories"
          multiple
          selected={value.repos}
          items={repos.map(r => ({ label: r, value: r }))}
          onChange={v => onChange({ ...value, repos: v as string[] })}
        />
      </Grid>
      <Grid item xs={12}>
        <FormGroup row>
          {ALL_WIDGETS.map(w => (
            <FormControlLabel
              key={w.id}
              label={w.label}
              control={
                <Checkbox
                  color="primary"
                  checked={value.widgets.includes(w.id)}
                  onChange={(_e, checked) =>
                    onChange({
                      ...value,
                      widgets: checked
                        ? [...value.widgets, w.id]
                        : value.widgets.filter(id => id !== w.id),
                    })
                  }
                />
              }
            />
          ))}
        </FormGroup>
      </Grid>
    </Grid>
  );
};
