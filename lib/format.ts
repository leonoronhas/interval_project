// Money lives in the DB as a numeric (a string via postgres-js) and is summed
// as a number in places — this is the one spot that turns either into "$X.XX".
export const formatMoney = (value: string | number): string =>
  `$${Number(value).toFixed(2)}`;
