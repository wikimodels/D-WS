import { AlertObj } from "../../../models/alerts/alert-obj.ts";

export async function updateAlertObj(obj: AlertObj) {
  try {
    const kv = await Deno.openKv();
    await kv.delete(["Alerts", obj.id]);
    const res = await kv.set(["Alerts", obj.id], obj);
    await kv.close();
    return res;
  } catch (e) {
    console.log(e);
  }
}
