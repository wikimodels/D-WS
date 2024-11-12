import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";
import { ConnectionStatus } from "./../../../../models/shared/conn-status.ts";
export function formateUnhealthyWsConnStatusMsg(
  projectName: string,
  className: string,
  connectionStatus: ConnectionStatus
) {
  const message = `
    ⚠️ ${projectName}:${className} WS Health Check Alert
    
    Expected connections: ${connectionStatus.coinsLen}
    Active connections: ${connectionStatus.activeConnLen}
    Inactive symbols: ${connectionStatus.inactiveConn.join(", ")}

    <i>⏰ ${UnixToNamedTimeRu(new Date().getTime())}</i>
  `;
  return message;
}
