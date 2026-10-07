import { bot } from "@/lib/bot";

console.log("🤖 Running Telegram bot with Long Polling (Local Dev Mode)...");

// Remove active webhook (if any) before initiating polling
await bot.api.deleteWebhook();

bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Bot @${botInfo.username} successfully started!`);
    console.log("Open Telegram and send a message or /start to interact with the bot.");
  },
});
