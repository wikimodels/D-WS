export function printConnectionRetriesOverInfo(
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
      " --> Connection Retries Over!!!",
    `color:${color}`
  );
}
