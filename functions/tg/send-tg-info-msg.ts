import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import {
  getGeneralErrorMessage,
  getGeneralInfoMessage,
} from "./message-formatter.ts";
import { TelegramBot } from "https://deno.land/x/telegram_bot_api@0.4.0/mod.ts";

const env = await load();

const bot = new TelegramBot(env["TG_DENO_WS_TECH"]);
const emergencyBot = new TelegramBot(env["TG_EMERGENCY_BOT"]);
export async function sendTgGeneralInfoMessage(infoMsg: string) {
  try {
    await bot.sendMessage({
      chat_id: env["TG_USER"],
      text: getGeneralInfoMessage(infoMsg),
      parse_mode: "html",
    });
  } catch (error) {
    await emergencyBot.sendMessage({
      chat_id: env["TG_USER"],
      text: getGeneralErrorMessage("Deno WS Technicals Bot: " + error.message),
      parse_mode: "html",
    });
    console.error(`Deno WS Technicals Bot:`, error);
  }
}
