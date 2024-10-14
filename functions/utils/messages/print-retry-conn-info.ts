export function printRetryConnectionInfo(
  exchange: string,
  symbol: string,
  connectionType: string,
  color: string
) {
  console.log(
    "%c" +
      exchange +
      ":" +
      symbol +
      ":" +
      connectionType +
      " --> retry to connect...",
    `color:${color}`
  );
}
