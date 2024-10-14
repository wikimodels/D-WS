export function printConnectionErrorInfo(
  exchange: string,
  symbol: string,
  connectionType: string,
  color: string
) {
  console.log(
    "%c" + exchange + ":" + symbol + " " + connectionType + " --> ERROR!!!",
    `color:${color}`
  );
}
