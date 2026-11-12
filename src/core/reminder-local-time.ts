/** Resolve a device-local form value without silently shifting nonexistent or repeated clock times. */
export function resolveLocalReminderTime(value: string): { value?: string; error?: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { error: "Choose a valid local date and time." };
  const expected = match.slice(1).map(Number);
  const matches = (date: Date) => [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()]
    .every((part, index) => part === expected[index]);
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || !matches(date))
    return { error: "That local time does not exist or is invalid. Choose another time." };
  // Offsets on either side of a nearby clock transition expose a second
  // possible instant. Ask for another time rather than choosing one silently.
  const offsets = new Set([-2, -1, 1, 2].map(days => new Date(date.getTime() + days * 86400000).getTimezoneOffset()));
  for (const offset of offsets) {
    const alternate = date.getTime() + (offset - date.getTimezoneOffset()) * 60000;
    if (alternate !== date.getTime() && matches(new Date(alternate)))
      return { error: "That local time happens twice when the clock changes. Choose a different time." };
  }
  return { value: date.toISOString() };
}
