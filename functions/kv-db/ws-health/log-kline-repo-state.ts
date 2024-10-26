import { getCoinsRepo } from "../../../global/coins/coins-repo.ts";
import type { KlineRepoStateLog } from "../../../models/shared/kline-repo-state-log.ts";
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
