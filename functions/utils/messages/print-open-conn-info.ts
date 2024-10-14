export function printOpenConnectionInfo(
  exchange: string,
  symbol: string,
  connectionType: string,
  color: string
) {
  console.log(
    "%c" + exchange + ":" + symbol + " " + connectionType + " --> o.k.",
    `color:${color}`
  );
}
