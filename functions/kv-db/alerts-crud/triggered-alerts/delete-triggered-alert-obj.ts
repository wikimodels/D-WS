import { SpaceNames } from "../../../../models/shared/space-names.ts";

// deno-lint-ignore-file no-explicit-any
export async function deleteTriggeredAlertObj(id: string): Promise<any> {
  try {
    const kv = await Deno.openKv();
    const res = await kv.delete([SpaceNames.TriggeredAlerts, id]);
    await kv.close();
    return res;
  } catch (e) {
    console.log(e);
  }
}
