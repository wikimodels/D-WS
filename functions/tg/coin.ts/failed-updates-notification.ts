import { UnixToNamedTimeRu } from "../../utils/time-converter.ts";

export function formatFailedUpdatesNotificationMsg(
  data: string[],
  fnName: string,
  projectName: string
) {
  const txt =
    "Failed to update Category & Turnover24h properties the following symbols: " +
    data.map((d) => d).join(", ");
  const msg = `
  <b>🆘 ${projectName}:CoinRepository:${fnName}() ERROR</b>
<i>${txt}</i>      
<i>⏰ ${UnixToNamedTimeRu(new Date().getTime())}</i>   
<i>&#160&#160&#160</i>`;
  return msg;
}
