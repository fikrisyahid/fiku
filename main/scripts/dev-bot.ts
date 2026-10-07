import { bot } from "@/lib/bot";

console.log("🤖 Menjalankan bot dengan Long Polling (Local Dev Mode)...");

// Hapus webhook aktif (jika ada) sebelum polling
await bot.api.deleteWebhook();

bot.start({
  onStart: (botInfo) => {
    console.log(`✅ Bot @${botInfo.username} berhasil berjalan!`);
    console.log("Silakan buka Telegram dan kirim pesan atau /start ke bot.");
  },
});
