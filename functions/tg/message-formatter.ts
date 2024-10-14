import { Coin } from "../../models/shared/coin.ts";
import { UnixToNamedTimeRu } from "../utils/time-converter.ts";

export function getWsErrorMessage(
  symbol: string,
  exchange: string,
  errorMsg: string
) {
  const msg = `
  <b>🆘 ${exchange}:${symbol}- WS ERROR</b>
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
