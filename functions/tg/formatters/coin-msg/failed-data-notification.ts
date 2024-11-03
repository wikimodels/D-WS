import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";

export function formatFailedDataNotificationMsg(
  projectName: string,
  className: string,
  fnName: string,
  symbols: string[]
) {
  const txt =
    "Failed to fetch kline data for the following symbols: " +
    symbols.map((d) => d).join(", ");
  const msg = `
  <b>🆘 ${projectName}:${className}:${fnName}() ERROR</b>
<i>${txt}</i>      
<i>⏰ ${UnixToNamedTimeRu(new Date().getTime())}</i>   
<i>&#160&#160&#160</i>`;
  return msg;
}
