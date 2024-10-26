import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { Coin } from "../../models/shared/coin.ts";
import { sendTgGeneralErrorMessage } from "../../functions/tg/send-tg-general-error-msg.ts";
import { DBRef } from "https://deno.land/x/web_bson@v0.2.5/mod.ts";
import { getMongoDb, mongoDb } from "../mongodb/initialize-mongodb.ts";
const env = await load();
const funcName = "getAllCoins()";

export async function getAllCoins() {
  try {
    const db = await getMongoDb();
    const coins = await db.collection("coins").find({}).toArray();
    return coins;
  } catch (e) {
    await sendTgGeneralErrorMessage(
      env["PROJECT_NAME"] + ": " + funcName + "Problem: " + e
    );
    console.log(e);
  }
  return [];
}
