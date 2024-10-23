import type { KlineObj } from "../../models/shared/kline.ts";

let klineRepo: KlineObj[] = [];

export function addToKlineRepo(klineObj: KlineObj) {
  klineRepo.push(klineObj);
}

export function KlineRepo() {
  return klineRepo;
}
export function emptyKlineRepo() {
  klineRepo = [];
}
