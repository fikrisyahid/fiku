import { Bot } from "grammy";
import {
  handleStart,
  handleSetPin,
  handleBuka,
  handleKunci,
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
import {
  handleBuatKeluarga,
  handleFamilyCreateCallback,
  handleUndangKeluarga,
  handleFamilyInviteCallback,
  handleKeluarga,
  handleMode,
  handleFamilySwitchCallback,
  handlePromptInviteCallback,
} from "./bot-commands/family-handlers";

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  throw new Error("TELEGRAM_BOT_TOKEN is not defined in environment variables");
}

export const bot = new Bot(token);

// 1. General Commands & Interactive Help
bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.callbackQuery(/^help_/, handleHelpCallback);

// 1.5. Security & PIN Commands
bot.command("set_pin", (ctx) => handleSetPin(ctx, ctx.match));
bot.command("buka", (ctx) => handleBuka(ctx, ctx.match));
bot.command("kunci", handleKunci);

// 2. Wallets & Balance Commands
bot.command(["saldo", "dompet"], handleSaldo);
bot.command(["dompet_utama", "set_dompet"], (ctx) => handleSetDefaultDompet(ctx, ctx.match));
bot.command("tambah_dompet", (ctx) => handleTambahDompet(ctx, ctx.match));
bot.command("edit_dompet", (ctx) => handleEditDompet(ctx, ctx.match));
bot.command("hapus_dompet", (ctx) => handleHapusDompet(ctx, ctx.match));
bot.command(["transfer", "tf"], (ctx) => handleTransfer(ctx, ctx.match));
bot.command("tarik", (ctx) => handleTarikTunai(ctx, ctx.match));

// 3. Transaction & Category Commands
bot.command("catat", (ctx) => handleCatat(ctx, ctx.match));
bot.command("riwayat", (ctx) => handleRiwayat(ctx, ctx.match));
bot.command("kategori", handleKategori);
bot.command("tambah_kategori", (ctx) => handleTambahKategori(ctx, ctx.match));
bot.command("edit_kategori", (ctx) => handleEditKategori(ctx, ctx.match));
bot.command("hapus_kategori", (ctx) => handleHapusKategori(ctx, ctx.match));

// 4. Budget Allocations Commands
bot.command("alokasi", handleAlokasi);
bot.command("tambah_alokasi", (ctx) => handleTambahAlokasi(ctx, ctx.match));

// 5. Debt & Receivable Commands
bot.command("utang", handleUtang);
bot.command("tambah_utang", (ctx) => handleTambahUtang(ctx, ctx.match));
bot.command("lunas", (ctx) => handleLunasUtang(ctx, ctx.match));

// 6. Family Account & Mode Commands
bot.command(["keluarga", "family"], handleKeluarga);
bot.command("buat_keluarga", (ctx) => handleBuatKeluarga(ctx, ctx.match));
bot.command(["undang_keluarga", "tambah_keluarga"], (ctx) => handleUndangKeluarga(ctx, ctx.match));
bot.command(["mode", "ganti_mode"], handleMode);

// Family Callback Queries
bot.callbackQuery(/^fam_crt:/, handleFamilyCreateCallback);
bot.callbackQuery(/^fam_inv:/, handleFamilyInviteCallback);
bot.callbackQuery(/^fam_sw:/, handleFamilySwitchCallback);
bot.callbackQuery("fam_prompt_invite", handlePromptInviteCallback);

// 7. Reset / Data Wipeout Commands
bot.command("reset", handleReset);
bot.command("reset_konfirmasi", (ctx) => handleResetKonfirmasi(ctx, ctx.match));
bot.command("reset_final", (ctx) => handleResetFinal(ctx, ctx.match));

// 8. Natural Text Parser for quick transaction logging
bot.on("message:text", handleSmartText);

// Global Error Handler to ensure bot resilience
bot.catch((err) => {
  console.error(`⚠️ Error occurred on update ${err.ctx.update.update_id}:`, err.error);
});
