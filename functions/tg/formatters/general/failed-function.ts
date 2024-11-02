import { UnixToNamedTimeRu } from "../../../utils/time-converter.ts";

export function formateFailedFunctionNotificationMsg(
  projectName: string,
  className: string,
  fnName: string,
  error: any
) {
  const msg = `
  <b>🆘 ${projectName}:${className}:${fnName}() ERROR</b>
<i>${error}</i>      
<i>⏰ ${UnixToNamedTimeRu(new Date().getTime())}</i>   
<i>&#160&#160&#160</i>`;
  return msg;
}
