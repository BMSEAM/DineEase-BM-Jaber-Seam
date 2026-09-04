/**
 * Strict calendar date/time helpers.
 *
 * JavaScript's Date constructor silently rolls impossible dates over
 * (`new Date('2026-02-31')` becomes March 3). These helpers reject such input
 * by round-tripping the parsed components back to the source string.
 */

/**
 * Parse a `YYYY-MM-DD` day + `HH:mm` time into a local Date, rejecting
 * malformed or impossible values (e.g. 2026-02-31, month 13, 25:00).
 * Returns a valid Date; throws Error('Invalid ...') otherwise.
 */
export function parseStrictDateTime(date, time) {
  if (typeof date !== 'string' || typeof time !== 'string') {
    throw new Error('Invalid reservation date or time');
  }
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time);
  if (!dateMatch || !timeMatch) {
    throw new Error('Invalid reservation date or time');
  }

  const [, y, mo, d] = dateMatch.map(Number);
  const [, h, mi] = timeMatch.map(Number);

  if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) {
    throw new Error('Invalid reservation date or time');
  }

  const parsed = new Date(y, mo - 1, d, h, mi, 0, 0);
  // Round-trip: if the constructed date's components differ, the input rolled
  // over (e.g. Feb 31 -> Mar 3) and is therefore not a real calendar date.
  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== mo - 1 ||
    parsed.getDate() !== d ||
    parsed.getHours() !== h ||
    parsed.getMinutes() !== mi
  ) {
    throw new Error('Invalid reservation date or time');
  }
  return parsed;
}
