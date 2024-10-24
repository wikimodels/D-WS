import type { KlineRepoStateLog } from "../../../models/shared/kline-repo-state-log.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";
import { UnixToTime } from "../../utils/time-converter.ts";

export async function logKlineRepoState(connectionsNumber: number) {
  try {
    const kv = await Deno.openKv();
    const timestamp = new Date().getTime();
    const obj: KlineRepoStateLog = {
      connectionsNumber: connectionsNumber,
      timestamp: timestamp,
      timestampStr: UnixToTime(timestamp),
    };
    await kv.set([SpaceNames.WsConnections, timestamp], obj);
    await kv.close();
  } catch (e) {
    console.log(e);
  }
}
