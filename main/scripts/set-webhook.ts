import { bot } from "@/lib/bot";

const url = process.argv[2];

if (!url) {
  console.log("Penggunaan: bun scripts/set-webhook.ts <URL_WEBHOOK>");
  console.log("Contoh: bun scripts/set-webhook.ts https://xxxx.loca.lt/api/bot");
  console.log("Atau kosongkan URL untuk cek info webhook: bun scripts/set-webhook.ts --info");
  process.exit(1);
}

if (url === "--info") {
  const info = await bot.api.getWebhookInfo();
  console.log("ℹ️ Info Webhook Saat Ini:", info);
  process.exit(0);
}

if (url === "--delete") {
  await bot.api.deleteWebhook();
  console.log("🗑️ Webhook berhasil dihapus.");
  process.exit(0);
}

console.log(`🔗 Mendaftarkan webhook ke: ${url}...`);
await bot.api.setWebhook(url);
console.log("✅ Webhook berhasil didaftarkan!");
