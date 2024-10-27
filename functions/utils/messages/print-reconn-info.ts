export function printReconnectingInfo(
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
      " " +
      connectionType +
      " --> reconnecting...",
    `color:${color}`
  );
}
