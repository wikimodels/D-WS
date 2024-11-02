// deno-lint-ignore-file
import { formateFailedFunctionNotificationMsg } from "../formatters/general/failed-function.ts";
import { sendTgGeneralMessage } from "../send-general-tg-msg.ts";

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
  await sendTgGeneralMessage(msg);
}
