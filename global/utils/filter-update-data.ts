export function filterUpdateData(obj: object) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([key, value]) =>
        (value !== undefined && key !== "_id") ||
        (value !== null && key !== "_id")
    )
  );
}
