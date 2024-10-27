export function printMaxRetriesReachedInfo(
  exchange: string,
  symbol: string,
  connectionType: string,
  numberOfTries: number,
  color: string
) {
  console.log(
    "%c" +
      exchange +
      ":" +
      symbol +
      ":" +
      connectionType +
      ` --> reached max retries number of ${numberOfTries}. No further attempts will be made...`,
    `color:${color}`
  );
}
