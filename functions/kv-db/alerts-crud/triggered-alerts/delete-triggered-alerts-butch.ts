import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function deleteTriggeredAlertsButch(ids: string[]) {
  try {
    const kv = await Deno.openKv();
    let counter = 0;
    for (const id in ids) {
      await kv.delete([SpaceNames.TriggeredAlerts, id]);
      counter++;
    }

    await kv.close();
    return `Deleted ${counter} Alerts`;
  } catch (e) {
    console.log(e);
  }
}
