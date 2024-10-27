import { Coin } from "../../models/shared/coin.ts";
import type { ConnObj } from "../../models/shared/conn-obj.ts";
import { UnixToNamedTimeRu } from "../utils/time-converter.ts";

export function getWsErrorMessage(connObj: ConnObj, errorMsg: string) {
  const msg = `
  <b>🆘 ${connObj.projectName}:${connObj.exchange}:${
    connObj.symbol
  } - WS ERROR</b>
<i>${errorMsg}</i>      
<i>⏰ ${UnixToNamedTimeRu(new Date().getTime())}</i>   
<i>&#160&#160&#160</i>`;
  return msg;
}

export function getWsInfoMessage(
  symbol: string,
  exchange: string,
  infoMsg: string
) {
  const msg = `
  <b>ℹ️ ${exchange}:${symbol}-WS INFO</b>  
<i>${infoMsg}</i>      
<i>⏰ ${UnixToNamedTimeRu(new Date().getTime())}</i>   
<i>&#160&#160&#160</i>`;
  return msg;
}

export function getGeneralInfoMessage(infoMsg: string) {
  const msg = `
  <b>ℹ️ GENERAL INFO</b>  
<i>${infoMsg}</i>      
<i>⏰ ${UnixToNamedTimeRu(new Date().getTime())}</i>   
<i>&#160&#160&#160</i>`;
  return msg;
}

export function getGeneralErrorMessage(errorMsg: string) {
  const msg = `
  <b>🆘 General Error</b>  
<i>${errorMsg}</i>      
<i>⏰ ${UnixToNamedTimeRu(new Date().getTime())}</i>   
<i>&#160&#160&#160</i>`;
  return msg;
}
