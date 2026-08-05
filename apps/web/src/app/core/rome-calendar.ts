const romeDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Rome',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function romeDateParts(date: Date): Record<string, number> {
  return Object.fromEntries(
    romeDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );
}

export function romeWeekKey(date: Date): string {
  const parts = romeDateParts(date);
  const localDate = new Date(
    Date.UTC(parts['year'], parts['month'] - 1, parts['day']),
  );
  const weekday = localDate.getUTCDay();
  localDate.setUTCDate(
    localDate.getUTCDate() + (weekday === 0 ? -6 : 1 - weekday),
  );
  return localDate.toISOString().slice(0, 10);
}

export function romeMonthKey(date: Date): string {
  const parts = romeDateParts(date);
  return `${parts['year']}-${String(parts['month']).padStart(2, '0')}-01`;
}

export function italianMonthLabel(monthStart: string): string {
  return new Intl.DateTimeFormat('it-IT', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${monthStart}T12:00:00Z`));
}
