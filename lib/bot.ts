import { Bot } from "grammy";
import {
  handleStart,
  handleSaldo,
  handleTambahDompet,
  handleCatat,
  handleAlokasi,
  handleTambahAlokasi,
  handleRiwayat,
  handleKategori,
  handleUtang,
  handleTambahUtang,
  handleLunasUtang,
  handleHelp,
  handleSmartText,
} from "./bot-commands/handlers";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not defined in environment variables");
}

export const bot = new Bot(token);

// 1. Command Umum
bot.command("start", handleStart);
bot.command("help", handleHelp);

// 2. Command Dompet & Saldo
bot.command(["saldo", "dompet"], handleSaldo);
bot.command("tambah_dompet", (ctx) => handleTambahDompet(ctx, ctx.match));

// 3. Command Transaksi
bot.command("catat", (ctx) => handleCatat(ctx, ctx.match));
bot.command("riwayat", (ctx) => handleRiwayat(ctx, ctx.match));
bot.command("kategori", handleKategori);

// 4. Command Alokasi Dana / Anggaran
bot.command("alokasi", handleAlokasi);
bot.command("tambah_alokasi", (ctx) => handleTambahAlokasi(ctx, ctx.match));

// 5. Command Utang & Piutang
bot.command("utang", handleUtang);
bot.command("tambah_utang", (ctx) => handleTambahUtang(ctx, ctx.match));
bot.command("lunas", (ctx) => handleLunasUtang(ctx, ctx.match));

// 6. Natural Text Parser untuk input cepat
bot.on("message:text", handleSmartText);
