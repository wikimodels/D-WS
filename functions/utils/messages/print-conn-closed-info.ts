export function printConnectionClosedInfo(
  exchange: string,
  symbol: string,
  connectionType: string,
  color: string
) {
  console.log(
    "%c" + exchange + ":" + symbol + " " + connectionType + " --> closed",
    `color:${color}`
  );
}
