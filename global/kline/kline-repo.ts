import { logKlineRepoState } from "../../functions/kv-db/ws-health/log-kline-repo-state.ts";
import type { KlineObj } from "../../models/shared/kline.ts";

let klineRepo: KlineObj[] = [];

export function addToKlineRepo(klineObj: KlineObj) {
  klineRepo.push(klineObj);
}

export function KlineRepo() {
  return klineRepo;
}

export async function emptyKlineRepo() {
  await logKlineRepoState(klineRepo.length);
  console.log("KlineRepo before cleaning: ", klineRepo.length);
  klineRepo = [];
  console.log("KlineRepo after cleaning: ", klineRepo.length);
}
