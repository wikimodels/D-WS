export function printRetryingConnectionInfo(
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
      ` --> retry to connect ${numberOfTries}...`,
    `color:${color}`
  );
}
