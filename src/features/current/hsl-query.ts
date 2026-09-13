export const CURRENT_HSL_QUERY = {
  stopCode: 'E3239',
  stopName: 'Ylisrinne',
  routes: ['121', '125'],
} as const;

export const currentHslStopLabel = () =>
  `${CURRENT_HSL_QUERY.stopName.toUpperCase()} / ${CURRENT_HSL_QUERY.stopCode}`;
