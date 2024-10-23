import { SpaceNames } from "../../../../models/shared/space-names.ts";

export async function deleteAlertsButch(ids: string[]) {
  try {
    const kv = await Deno.openKv();
    let counter = 0;
    for (const id of ids) {
      const res = await kv.delete([SpaceNames.Alerts, id]);
      console.log(res);

      counter++;
    }
    await kv.close();
    return { deleted: counter };
  } catch (e) {
    console.log(e);
  }
}
