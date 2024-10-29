import type { AlertObj } from "../../../../models/alerts/alert-obj.ts";
import { createArchivedAlertObj } from "./move-alert-to-archive.ts";

export async function createArchivedAlertButch(alerts: AlertObj[]) {
  try {
    let counter = 0;
    for (const alert of alerts) {
      const res = await createArchivedAlertObj(alert);
      counter = res?.ok == true ? counter + 1 : counter;
    }
    return {
      uploaded: alerts.length,
      saved: counter,
    };
  } catch (e) {
    console.log(e);
  }
}
