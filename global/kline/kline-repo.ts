import { _ } from "https://cdn.skypack.dev/lodash";
import { logKlineRepoState } from "../../functions/kv-db/ws-health/log-kline-repo-state.ts";
import type { KlineObj } from "../../models/shared/kline.ts";
import { UnixToTime } from "../../functions/utils/time-converter.ts";

let klineRepo: KlineObj[] = [];

export function addToKlineRepo(klineObj: KlineObj) {
  klineRepo.push(klineObj);
}

export function KlineRepo() {
  return klineRepo;
}

export async function emptyKlineRepo() {
  const coins: any[] = [];

  const obj = {
    klineRepoBefore: klineRepo.length,
    klineRepoUnique: 0,
    timestamp: UnixToTime(new Date().getTime()),
  };

  klineRepo = _.uniqBy(klineRepo, "symbol");
  obj.klineRepoUnique = klineRepo.length;

  await logKlineRepoState(obj);

  console.log("KlineRepo before cleaning: ", obj);
  klineRepo.length = 0;
  console.log("KlineRepo after cleaning: ", klineRepo.length);
}
