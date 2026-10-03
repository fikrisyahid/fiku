import { Bot } from "grammy";
import {
  handleStart,
  handleSaldo,
  handleSetDefaultDompet,
  handleTambahDompet,
  handleEditDompet,
  handleHapusDompet,
  handleTransfer,
  handleTarikTunai,
  handleCatat,
  handleAlokasi,
  handleTambahAlokasi,
  handleRiwayat,
  handleKategori,
  handleTambahKategori,
  handleEditKategori,
  handleHapusKategori,
  handleUtang,
  handleTambahUtang,
  handleLunasUtang,
  handleReset,
  handleResetKonfirmasi,
  handleResetFinal,
  handleHelp,
  handleHelpCallback,
  handleSmartText,
} from "./bot-commands/handlers";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not defined in environment variables");
}

export const bot = new Bot(token);

// 1. Command Umum & Help Interaktif
bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.callbackQuery(/^help_/, handleHelpCallback);

// 2. Command Dompet & Saldo
bot.command(["saldo", "dompet"], handleSaldo);
bot.command(["dompet_utama", "set_dompet"], (ctx) => handleSetDefaultDompet(ctx, ctx.match));
bot.command("tambah_dompet", (ctx) => handleTambahDompet(ctx, ctx.match));
bot.command("edit_dompet", (ctx) => handleEditDompet(ctx, ctx.match));
bot.command("hapus_dompet", (ctx) => handleHapusDompet(ctx, ctx.match));
bot.command(["transfer", "tf"], (ctx) => handleTransfer(ctx, ctx.match));
bot.command("tarik", (ctx) => handleTarikTunai(ctx, ctx.match));

// 3. Command Transaksi & Kategori
bot.command("catat", (ctx) => handleCatat(ctx, ctx.match));
bot.command("riwayat", (ctx) => handleRiwayat(ctx, ctx.match));
bot.command("kategori", handleKategori);
bot.command("tambah_kategori", (ctx) => handleTambahKategori(ctx, ctx.match));
bot.command("edit_kategori", (ctx) => handleEditKategori(ctx, ctx.match));
bot.command("hapus_kategori", (ctx) => handleHapusKategori(ctx, ctx.match));

// 4. Command Alokasi Dana / Anggaran
bot.command("alokasi", handleAlokasi);
bot.command("tambah_alokasi", (ctx) => handleTambahAlokasi(ctx, ctx.match));

// 5. Command Utang & Piutang
bot.command("utang", handleUtang);
bot.command("tambah_utang", (ctx) => handleTambahUtang(ctx, ctx.match));
bot.command("lunas", (ctx) => handleLunasUtang(ctx, ctx.match));

// 6. Command Reset / Wipeout Data
bot.command("reset", handleReset);
bot.command("reset_konfirmasi", (ctx) => handleResetKonfirmasi(ctx, ctx.match));
bot.command("reset_final", (ctx) => handleResetFinal(ctx, ctx.match));

// 7. Natural Text Parser untuk input cepat
bot.on("message:text", handleSmartText);

// Global Error Handler agar bot tidak pernah crash
bot.catch((err) => {
  console.error(`⚠️ Terjadi error pada update ${err.ctx.update.update_id}:`, err.error);
});
