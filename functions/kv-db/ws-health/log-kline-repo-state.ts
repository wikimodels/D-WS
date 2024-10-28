import { SpaceNames } from "../../../models/shared/space-names.ts";
import { UnixToTime } from "../../utils/time-converter.ts";

export async function logKlineRepoState(obj: any) {
  try {
    const kv = await Deno.openKv();

    await kv.set([SpaceNames.WsConnections, new Date().getTime()], obj);
    await kv.close();
  } catch (e) {
    console.log(e);
  }
}
