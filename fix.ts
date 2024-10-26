// deno-lint-ignore-file no-explicit-any
import { Coin } from "./models/shared/coin.ts";
import { coins } from "./my.coins.ts";

let check: Coin[] = [];

(coins as any[]).forEach((c: any) => {
  delete c._id;

  const _c = c as Coin;
  if (_c.tvLink) {
    _c.tvLink = _c.tvLink + ".P";
  }

  check.push(_c);
});

const j = JSON.stringify(check, null, 2);
await Deno.writeTextFile("./clean-coins.json", j);
