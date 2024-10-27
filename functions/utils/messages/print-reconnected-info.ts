export function printReconnectedInfo(
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
      " --> reconnected...",
    `color:${color}`
  );
}
