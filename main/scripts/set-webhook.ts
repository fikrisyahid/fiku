import { bot } from "@/lib/bot";

const url = process.argv[2];

if (!url) {
  console.log("Usage: bun scripts/set-webhook.ts <WEBHOOK_URL>");
  console.log("Example: bun scripts/set-webhook.ts https://xxxx.loca.lt/api/bot");
  console.log("Or check webhook status: bun scripts/set-webhook.ts --info");
  process.exit(1);
}

if (url === "--info") {
  const info = await bot.api.getWebhookInfo();
  console.log("ℹ️ Current Webhook Info:", info);
  process.exit(0);
}

if (url === "--delete") {
  await bot.api.deleteWebhook();
  console.log("🗑️ Webhook successfully deleted.");
  process.exit(0);
}

console.log(`🔗 Registering webhook to: ${url}...`);
await bot.api.setWebhook(url);
console.log("✅ Webhook successfully registered!");
