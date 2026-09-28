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
