import { AlertObj } from "../../../models/alerts/alert-obj.ts";
import { UnixToNamedTimeRu } from "../../utils/time-converter.ts";

export function formatKeyLevelsBreakMsg(alertObjs: AlertObj[]) {
  const msg = getMessage(alertObjs);
  //   const footer = getFooter(alertObjs);
  //   const timeline = getTimeline(alertObjs);
  //   const res = `${msg}
  // ${footer}
  // ${timeline}`;
  return msg;
}

function getMessage(alertObjs: AlertObj[]) {
  let msg = "";
  alertObjs.forEach((a) => {
    msg =
      msg +
      `<b><a href = "${a.tvLink}">${a.symbol}</a>: ${a.keyLevelName}</b> high: ${a.high} low: ${a.low} price: ${a.price}\n`;
  });
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
