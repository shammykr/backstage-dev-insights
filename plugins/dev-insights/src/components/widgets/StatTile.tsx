import { TrendLine } from '@backstage/core-components';
import { Box, Typography } from '@material-ui/core';

export const StatTile = (props: {
  label: string;
  value: string;
  caption?: string;
  trend?: number[];
}) => (
  <Box>
    <Typography variant="overline" color="textSecondary">
      {props.label}
    </Typography>
    <Typography variant="h4">{props.value}</Typography>
    {props.caption && (
      <Typography variant="caption" color="textSecondary">
        {props.caption}
      </Typography>
    )}
    {props.trend && props.trend.some(v => v > 0) && (
      <TrendLine data={props.trend} title={`${props.label} per day`} />
    )}
  </Box>
);
