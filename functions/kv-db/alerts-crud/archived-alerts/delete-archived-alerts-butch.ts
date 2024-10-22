import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function deleteArchivedAlertsButch(ids: string[]) {
  try {
    const kv = await Deno.openKv();
    let counter = 0;
    for (const id of ids) {
      await kv.delete([SpaceNames.ArchivedAlerts, id]);
      counter++;
    }
    await kv.close();
    return { deleted: counter };
  } catch (e) {
    console.log(e);
  }
}
