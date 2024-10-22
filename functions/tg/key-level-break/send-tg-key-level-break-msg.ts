import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { getGeneralErrorMessage } from "../message-formatter.ts";
import { TelegramBot } from "https://deno.land/x/telegram_bot_api@0.4.0/mod.ts";
import { AlertObj } from "../../../models/alerts/alert-obj.ts";
import { formatKeyLevelBreakMsg } from "./format-key-level-break-msg.ts";

const env = await load();

const bot = new TelegramBot(env["TG_DENO_WS_TECH"]);
const emergencyBot = new TelegramBot(env["TG_EMERGENCY_BOT"]);
export async function sendTgKeyLevelBreakMessage(alertObj: AlertObj) {
  try {
    const defaultPicUrl = "https://www.tradingview.com/x/fXTOLlJL/";
    const imgUrl =
      alertObj.imgUrls?.length && alertObj.imgUrls.length > 0
        ? alertObj.imgUrls[0]
        : defaultPicUrl;

    await bot.sendPhoto({
      chat_id: env["TG_USER"],
      photo: imgUrl,
      parse_mode: "html",
      caption: formatKeyLevelBreakMsg(alertObj),
    });
  } catch (error) {
    await emergencyBot.sendMessage({
      chat_id: env["TG_USER"],
      text: getGeneralErrorMessage("Deno WS Technicals Bot: " + error),
      parse_mode: "html",
    });
    console.error(`Deno WS Technicals Bot:`, error);
  }
}
