import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";

export function formatFailedDataNotificationMsg(
  data: { success: boolean; symbol: string; error: string }[],
  fnName: string,
  projectName: string
) {
  const txt =
    "Failed to fetch kline data for the following symbols: " +
    data.map((d) => d.symbol).join(", ");
  const msg = `
  <b>🆘 ${projectName}:CoinRepository:${fnName}() ERROR</b>
<i>${txt}</i>      
<i>⏰ ${UnixToNamedTimeRu(new Date().getTime())}</i>   
<i>&#160&#160&#160</i>`;
  return msg;
}
