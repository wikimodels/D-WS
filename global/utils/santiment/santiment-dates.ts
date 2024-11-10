export function monthsAgo(month: number) {
  const time = new Date();
  time.setMonth(time.getMonth() - month);
  return time.toISOString();
}

export function currentMonth() {
  const time = new Date();
  return time.toISOString();
}
