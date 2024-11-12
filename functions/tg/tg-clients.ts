// deno-lint-ignore-file no-explicit-any
import { load } from "https://deno.land/std@0.223.0/dotenv/mod.ts";
import { TelegramBot } from "https://deno.land/x/telegram_bot_api@0.4.0/mod.ts";

// Load environment variables
const env = await load();

// Initialize Telegram bots
const techBot = new TelegramBot(env["TG_DENO_WS_TECH"]);
const businessBot = new TelegramBot(env["TG_DENO_WS_BUSINESS"]);

// Helper function to send a message
async function sendMessage(
  bot: TelegramBot,
  chatId: string,
  msg: string,
  fallbackBot: TelegramBot,
  parseMode: string = "html"
) {
  try {
    await bot.sendMessage({
      chat_id: chatId,
      parse_mode: parseMode,
      text: msg,
      disable_web_page_preview: true,
    });
  } catch (error: any) {
    console.error(`Error sending message with primary bot:`, error);

    // If the primary bot fails, use the fallback bot to send the error message
    try {
      await fallbackBot.sendMessage({
        chat_id: chatId,
        parse_mode: parseMode,
        text: `Error: ${error.message}\nOriginal message: ${msg}`,
        disable_web_page_preview: true,
      });
    } catch (fallbackError) {
      console.error(`Error sending message with fallback bot:`, fallbackError);
    }
  }
}

// Function to send a general message using the technical bot
export async function sendTgTechMessage(msg: string) {
  await sendMessage(techBot, env["TG_USER"], msg, businessBot);
}

// Function to send a business-related message using the business bot
export async function sendTgBusinessMessage(msg: string) {
  await sendMessage(businessBot, env["TG_USER"], msg, techBot);
}
