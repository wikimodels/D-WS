import { AlertObj } from "../../../models/alerts/alert-obj.ts";
import { UnixToNamedTimeRu } from "../../utils/time-converter.ts";

export function formatKeyLevelBreakMsg(alertObj: AlertObj) {
  const msg = getMessage(alertObj);
  const footer = getFooter(alertObj);
  const timeline = getTimeline(alertObj);
  const res = `${msg}
${footer}
${timeline}`;
  return res;
}

function getMessage(alertObj: AlertObj) {
  const msg = `<b><a href = "${alertObj.tvLink}">${alertObj.symbol}</a>: ${alertObj.keyLevelName}</b>
${alertObj.action}
<i>${alertObj.description}</i>`;

  return msg;
}

function getFooter(alertObj: AlertObj) {
  let footer = "";

  if (alertObj.cgLink) {
    footer += `<a href="${alertObj.cgLink}">COINGLASS</a>`;
    footer += " ";
  }

  if (alertObj.exchBiLink) {
    footer += `<a href="${alertObj.cgLink}">BINANCE</a>`;
    footer += " ";
  }

  if (alertObj.exchByLink) {
    footer += `<a href="${alertObj.cgLink}">BYBIT</a>`;
  }
  return footer;
}

function getTimeline(alertObj: AlertObj) {
  let timeline = "";
  if (alertObj.activationTime) {
    timeline += `<i>⏰ ${UnixToNamedTimeRu(alertObj?.activationTime)}</i>
    
    `;
  }
  return timeline;
}
