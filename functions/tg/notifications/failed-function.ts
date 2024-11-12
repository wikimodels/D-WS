// deno-lint-ignore-file
import { formateFailedFunctionNotificationMsg } from "../formatters/general/failed-function.ts";
import { sendTgTechMessage } from "../tg-clients.ts";

export async function notifyAboutFailedFunction(
  projectName: string,
  className: string,
  fnName: string,
  error: any
) {
  const msg = formateFailedFunctionNotificationMsg(
    projectName,
    className,
    fnName,
    error
  );
  await sendTgTechMessage(msg);
}
