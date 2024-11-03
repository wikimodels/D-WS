import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";

export function formatFailedUpdatesNotificationMsg(
  projectName: string,
  className: string,
  fnName: string,
  data: string[]
) {
  const txt =
    "Failed to update Category & Turnover24h properties of following symbols: " +
    data.map((d) => d).join(", ");
  const msg = `
  <b>🆘 ${projectName}:${className}:${fnName}() ERROR</b>
<i>${txt}</i>      
<i>⏰ ${UnixToNamedTimeRu(new Date().getTime())}</i>   
<i>&#160&#160&#160</i>`;
  return msg;
}
