import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { Coin } from "../../models/shared/coin.ts";
import { sendTgGeneralErrorMessage } from "../../functions/tg/send-tg-general-error-msg.ts";
const env = await load();
const funcName = "getAllCoins()";

export async function getAllCoins() {
  try {
    const response = await fetch(env["COINS"]);
    const coins: Coin[] = await response.json();
    return coins;
  } catch (e) {
    await sendTgGeneralErrorMessage(
      env["PROJECT_NAME"] + ": " + funcName + "Problem: " + e.message
    );
    console.log(e);
  }
  return [];
}
