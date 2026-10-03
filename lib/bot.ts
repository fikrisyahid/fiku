import { Bot } from "grammy";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not defined in environment variables");
}

export const bot = new Bot(token);

// Command /start
bot.command("start", async (ctx) => {
  const user = ctx.from?.first_name || "Sobat";
  await ctx.reply(
    `Halo ${user}! 👋\n\nSelamat datang di Bot Keuangan Fana.\nBot ini siap membantu kamu mencatat dan memantau keuangan.`
  );
});

// Command /help
bot.command("help", async (ctx) => {
  await ctx.reply(
    "Daftar Perintah:\n/start - Memulai bot\n/help - Melihat bantuan"
  );
});

// Echo atau respons default untuk pesan teks
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  await ctx.reply(`Pesan kamu diterima: "${text}"\n\n(Nanti fitur pencatatan keuangan bakal kita tambahkan di sini!)`);
});
