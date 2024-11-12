import type { ConnectionStatus } from "../../../models/shared/conn-status.ts";
import { formateUnhealthyWsConnStatusMsg } from "../formatters/ws/formate-unhealthy-ws-conn-status-msg.ts";
import { sendTgTechMessage } from "../tg-clients.ts";

export async function notifyAboutUnhealthyWsConnStatus(
  projectName: string,
  className: string,
  connStatus: ConnectionStatus
) {
  const msg = formateUnhealthyWsConnStatusMsg(
    projectName,
    className,
    connStatus
  );
  await sendTgTechMessage(msg);
}
