export function getFromAndToTime(monthsBack: number): {
  fromTime: string;
  toTime: string;
} {
  const now = new Date(); // Current time
  const toTime = now.toISOString(); // Current time as ISO string

  // Calculate 'monthsBack' months ago
  const pastDate = new Date();
  pastDate.setMonth(pastDate.getMonth() - monthsBack); // Subtract monthsBack months
  const fromTime = pastDate.toISOString();

  return { fromTime, toTime };
}
