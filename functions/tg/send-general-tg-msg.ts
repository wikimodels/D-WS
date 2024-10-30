import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { TelegramBot } from "https://deno.land/x/telegram_bot_api@0.4.0/mod.ts";

const env = await load();

const bot = new TelegramBot(env["TG_DENO_WS_TECH"]);
const emergencyBot = new TelegramBot(env["TG_EMERGENCY_BOT"]);

export async function sendTgGeneralMessage(msg: string) {
  try {
    await bot.sendMessage({
      chat_id: env["TG_USER"],
      parse_mode: "html",
      text: msg,
    });
  } catch (error) {
    await emergencyBot.sendMessage({
      chat_id: env["TG_USER"],
      text: msg,
      parse_mode: "html",
      disable_web_page_preview: true,
    });
    console.error(`Deno WS Technicals Bot:`, error);
  }
}
