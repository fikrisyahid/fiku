import { Bot } from "grammy";
import { onboardUser } from "@/lib/onboarding";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";
import { eq } from "drizzle-orm";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not defined in environment variables");
}

export const bot = new Bot(token);

function formatRupiah(amount: number | string): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

// Command /start (Onboarding Telegram)
bot.command("start", async (ctx) => {
  const from = ctx.from;
  if (!from) {
    await ctx.reply("Tidak dapat mendeteksi informasi akun Telegram kamu.");
    return;
  }

  const telegramId = String(from.id);
  const telegramUsername = from.username || null;
  const fullName =
    [from.first_name, from.last_name].filter(Boolean).join(" ") ||
    telegramUsername ||
    "Sobat Fana";

  try {
    const result = await onboardUser({
      fullName,
      telegramId,
      telegramUsername,
    });

    const walletListText = result.accounts
      .map((acc) => `• ${acc.name}: *${formatRupiah(acc.balance)}*`)
      .join("\n");

    if (result.isNewUser) {
      await ctx.reply(
        `🎉 *Selamat datang di Fana, ${result.user.fullName}!* 👋\n\n` +
          `Akun keuanganmu berhasil dibuat dan terhubung ke database.\n\n` +
          `💼 *Dompet Default Siap Pakai:*\n` +
          `${walletListText}\n\n` +
          `Kamu bisa langsung mencatat pengeluaran atau mengecek saldo kapan saja.\n` +
          `Ketik /saldo untuk melihat saldo dompet.\n` +
          `Ketik /help untuk panduan perintah.`,
        { parse_mode: "Markdown" }
      );
    } else {
      await ctx.reply(
        `👋 *Halo kembali, ${result.user.fullName}!*\n\n` +
          `Akun kamu aktif dan tersinkronisasi.\n\n` +
          `💼 *Status Dompet Kamu:*\n` +
          `${walletListText}\n\n` +
          `Siap mencatat keuangan hari ini? Ketik /help jika butuh bantuan.`,
        { parse_mode: "Markdown" }
      );
    }
  } catch (err: any) {
    console.error("Error onboarding via Telegram bot:", err);
    await ctx.reply("⚠️ Terjadi kendala saat menghubungkan akun ke sistem. Silakan coba lagi.");
  }
});

// Command /saldo atau /dompet
bot.command(["saldo", "dompet"], async (ctx) => {
  const telegramId = ctx.from?.id ? String(ctx.from.id) : null;
  if (!telegramId) return;

  const user = await db.query.users.findFirst({
    where: eq(users.telegramId, telegramId),
  });

  if (!user) {
    await ctx.reply("Akunmu belum terdaftar. Ketik /start untuk mendaftar terlebih dahulu!");
    return;
  }

  const userAccounts = await db.query.accounts.findMany({
    where: eq(accounts.userId, user.id),
  });

  if (userAccounts.length === 0) {
    await ctx.reply("Belum ada dompet yang terdaftar. Ketik /start untuk menginisialisasi dompet.");
    return;
  }

  const totalBalance = userAccounts.reduce((sum, a) => sum + Number(a.balance), 0);

  const text =
    `💰 *Daftar Dompet (${user.fullName}):*\n\n` +
    userAccounts.map((a) => `• *${a.name}* (${a.type}): ${formatRupiah(a.balance)}`).join("\n") +
    `\n\n💵 *Total Saldo Keseluruhan:* *${formatRupiah(totalBalance)}*`;

  await ctx.reply(text, { parse_mode: "Markdown" });
});

// Command /help
bot.command("help", async (ctx) => {
  await ctx.reply(
    `📖 *Panduan Bot Keuangan Fana*\n\n` +
      `*Perintah Dasar:*\n` +
      `• /start - Memulai & mendaftarkan akun (onboarding)\n` +
      `• /saldo atau /dompet - Melihat daftar dompet & total saldo\n` +
      `• /help - Menampilkan pesan bantuan ini\n\n` +
      `_(Fitur pencatatan otomatis transaksi akan segera aktif!)_`,
    { parse_mode: "Markdown" }
  );
});

// Default text echo
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text;
  await ctx.reply(`Pesan diterima: "${text}"\n\n(Fitur pencatatan pengeluaran & alokasi dana akan segera kita tambahkan!)`);
});
