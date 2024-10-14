import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import {
  getGeneralErrorMessage,
  getGeneralInfoMessage,
} from "./message-formatter.ts";
import { TelegramBot } from "https://deno.land/x/telegram_bot_api@0.4.0/mod.ts";
import { Coin } from "../../models/shared/coin.ts";

const env = await load();

const bot = new TelegramBot(env["TG_REPORTS_BOT"]);
const emergencyBot = new TelegramBot(env["TG_EMERGENCY_BOT"]);
export async function sendTgLiqReport(coins: Coin[]) {
  try {
    await bot.sendMessage({
      chat_id: env["TG_USER"],
      text: getLigReportMsg(coins),
      parse_mode: "html",
    });
  } catch (error) {
    await emergencyBot.sendMessage({
      chat_id: env["TG_USER"],
      text: getGeneralErrorMessage("Deno WS Technicals Bot: " + error.message),
      parse_mode: "html",
    });
    console.error(
      `Deno WS Technicals Bot about problems with TG Reports Bot:`,
      error
    );
  }
}
