import { _ } from "https://cdn.skypack.dev/-/lodash@v4.17.21-K6GEbP02mWFnLA45zAmi/dist=es2019,mode=imports/optimized/lodash.js";
import type { KlineRepoStateLog } from "../../../models/shared/kline-repo-state-log.ts";
import { SpaceNames } from "../../../models/shared/space-names.ts";

export async function getKlineRepoStateLog() {
  try {
    let objs: KlineRepoStateLog[] = [];
    const kv = await Deno.openKv();
    const prefixKey = [SpaceNames.WsConnections];
    const iter = kv.list({ prefix: prefixKey });

    for await (const entry of iter) {
      objs.push(entry.value as KlineRepoStateLog);
    }
    objs = _.orderBy(objs, ["timestamp"], ["desc"]);
    await kv.close();
    return objs;
  } catch (e) {
    console.log(e);
  }
}
