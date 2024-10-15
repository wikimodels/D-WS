import { AlertObj } from "../../../models/alerts/alert-obj.ts";

export async function saveAlertObj(alertObj: AlertObj) {
  try {
    const kv = await Deno.openKv();
    await kv.set(["Alerts", alertObj.id], alertObj);
    await kv.close();
  } catch (e) {
    console.log(e);
  }
}
