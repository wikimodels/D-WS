// deno-lint-ignore-file no-explicit-any
import { UnixToTime } from "../../functions/utils/time-converter.ts";
import { AlertTvOperator } from "../../global/alert/alert-tv-operator.ts";
import type { Alert } from "../../models/alerts/alert.ts";

export const addAlertTv = (req: any, res: any) => {
  const alert: Alert = req.body;
  if (alert.symbol.includes(".P")) {
    alert.symbol = alert.symbol.replace(".P", "");
  }
  const activationTime = new Date().getTime();
  alert.activationTime = activationTime;
  alert.activationTimeStr = UnixToTime(activationTime);
  alert.tvImgUrls = [];
  alert.tvImgUrls.push(alert.imgUrl);
  alert.isTv = true;
  if (!alert) {
    return res.status(400).send("Bad Request: Invalid POST 'alert' parameters");
  }

  try {
    //TODO
    console.log("ALERtTV Controller", alert);
    AlertTvOperator.addTvAlert(alert.symbol, alert);
    res.status(200).send("OK");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving the alert to the database");
  }
};
