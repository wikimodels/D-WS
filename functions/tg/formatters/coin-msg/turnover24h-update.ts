import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";

export function formateTurnover24hUpdateNotificationMsg(projectName: string) {
  const msg = `
<b>🔄 ${projectName} Turnover24h Update is done 🔄</b>
━━━━━━━━━━━━━    
🕒 <b>Time:</b> <i>${UnixToNamedTimeRu(new Date().getTime())}</i>
`;

  return msg;
}
