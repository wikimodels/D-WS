import { KlineInterval } from "npm:binance";
import { SpaceNames } from "../../../../models/shared/space-names.ts";
import { AlertsRepo } from "../../../../models/alerts/alerts-repo.ts";

export async function deleteTriggeredAlertsButch(ids: string[]) {
  try {
    const kv = await Deno.openKv();

    let counter = 0;

    for (const id of ids) {
      await kv.delete([SpaceNames.TriggeredAlerts, id]);

      counter++;
    }
    await kv.close();

    return { deleted: counter };
  } catch (e) {
    console.log(e);
  }
}
