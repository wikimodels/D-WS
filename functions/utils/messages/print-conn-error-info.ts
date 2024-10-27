// deno-lint-ignore-file no-explicit-any

export function printConnectionErrorInfo(
  exchange: string,
  symbol: string,
  connectionType: string,
  color: string,
  error: any
) {
  console.log(
    "%c" + exchange + ":" + symbol + " " + connectionType + " --> ERROR!!!",
    `color:${color}`
  );
  console.log(error);
}
