import { Context, InlineKeyboard } from "grammy";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  createFamily,
  inviteFamilyMember,
  respondFamilyInvite,
  switchUserMode,
  getUserFamilyStatus,
} from "@/app/actions/family";

function getErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

// In-memory cache for pending family creation flows (holds family name during starter data confirmation)
const pendingFamilyCreations = new Map<string, { userId: string; name: string }>();

/**
 * Helper to retrieve Telegram user and synchronize username upon changes
 */
async function getTelegramUser(ctx: Context) {
  const telegramId = ctx.from?.id ? String(ctx.from.id) : null;
  if (!telegramId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.telegramId, telegramId),
  });

  if (!user) {
    await ctx.reply(
      `⚠️ *Akun belum terdaftar.*\n\nSilakan ketik /start untuk mendaftarkan akun terlebih dahulu!`,
      { parse_mode: "Markdown" }
    );
    return null;
  }

  // Synchronize telegramUsername automatically if absent or updated
  if (ctx.from?.username && user.telegramUsername !== ctx.from.username) {
    await db
      .update(users)
      .set({ telegramUsername: ctx.from.username })
      .where(eq(users.id, user.id));
    user.telegramUsername = ctx.from.username;
  }

  return user;
}

/**
 * 1. /buat_keluarga <nama>
 * Memulai alur pembuatan akun keluarga baru dan meminta user memilih starter data.
 */
export async function handleBuatKeluarga(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const familyName = match ? match.trim() : "";
  if (!familyName) {
    await ctx.reply(
      `⚠️ *Format Salah!*\n\n` +
        `*Gunakan:* \`/buat_keluarga <nama_keluarga>\`\n` +
        `*Contoh:* \`/buat_keluarga Cemara\` atau \`/buat_keluarga Bahagia\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Generate temporary key for inline keyboard callback
  const tempKey = Math.random().toString(36).substring(2, 8);
  pendingFamilyCreations.set(tempKey, { userId: user.id, name: familyName });

  // Expire old key after 10 minutes to avoid memory leaks
  setTimeout(() => {
    pendingFamilyCreations.delete(tempKey);
  }, 10 * 60 * 1000);

  const keyboard = new InlineKeyboard()
    .text("📥 Salin Data Personal Saya", `fam_crt:copy:${tempKey}`)
    .row()
    .text("✨ Mulai dari Kosong (Fresh)", `fam_crt:empty:${tempKey}`)
    .row()
    .text("❌ Batalkan", `fam_crt:cancel:${tempKey}`);

  await ctx.reply(
    `👨‍👩‍👧‍👦 *BUAT AKUN KELUARGA*\n` +
      `───────────────────\n` +
      `Nama Keluarga: *${familyName}*\n\n` +
      `Pilih bagaimana data awal keluarga ini dibuat:\n\n` +
      `1️⃣ *Salin Data Personal Saya:*\n` +
      `└ Dompet, kategori, & riwayat transaksi pribadimu saat ini disalin sebagai starter data keluarga. Data pribadimu tetap aman terpisah.\n\n` +
      `2️⃣ *Mulai dari Kosong (Fresh):*\n` +
      `└ Akun keluarga dimulai dari 0 dengan dompet kas & rekening bank baru (saldo Rp 0).\n`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

/**
 * Callback query untuk memilih starter data keluarga
 */
export async function handleFamilyCreateCallback(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith("fam_crt:")) return;

  const parts = data.split(":");
  const action = parts[1]; // 'copy' | 'empty' | 'cancel'
  const tempKey = parts[2];

  if (action === "cancel") {
    pendingFamilyCreations.delete(tempKey);
    try {
      await ctx.editMessageText("❌ Pembuatan akun keluarga dibatalkan.");
    } catch {
      // Ignore edit errors
    }
    await ctx.answerCallbackQuery();
    return;
  }

  const pending = pendingFamilyCreations.get(tempKey);
  if (!pending) {
    await ctx.answerCallbackQuery({
      text: "Sesi pembuatan keluarga ini telah kadaluarsa. Silakan ulangi dengan /buat_keluarga.",
      show_alert: true,
    });
    return;
  }

  const user = await getTelegramUser(ctx);
  if (!user || user.id !== pending.userId) {
    await ctx.answerCallbackQuery({
      text: "Kamu tidak berhak mengeksekusi aksi ini.",
      show_alert: true,
    });
    return;
  }

  try {
    const starterMode = action === "copy" ? "copy" : "empty";
    const result = await createFamily({
      adminUserId: user.id,
      name: pending.name,
      starterMode,
    });

    pendingFamilyCreations.delete(tempKey);

    const starterDesc =
      starterMode === "copy"
        ? "Salinan dompet, kategori, & transaksi personal berhasil dijadikan data awal keluarga."
        : "Dompet kas & bank keluarga baru berhasil disiapkan dengan saldo awal Rp 0.";

    await ctx.editMessageText(
      `🎉 *AKUN KELUARGA BERHASIL DIBUAT!*\n` +
        `───────────────────\n` +
        `👨‍👩‍👧‍👦 *Keluarga:* ${result.family.name}\n` +
        `👑 *Admin:* @${user.telegramUsername || user.fullName}\n` +
        `🔄 *Mode Aktif:* Otomatis diubah ke *Mode Keluarga* 👨‍👩‍👧‍👦\n\n` +
        `📦 *Data Awal:* ${starterDesc}\n\n` +
        `───────────────────\n` +
        `💡 *Langkah Selanjutnya:*\n` +
        `• Undang anggota: \`/undang_keluarga @username\`\n` +
        `• Cek saldo bersama: \`/saldo\`\n` +
        `• Ganti ke data personal: \`/mode\`\n` +
        `• Cek info anggota: \`/keluarga\``,
      { parse_mode: "Markdown" }
    );
  } catch (err) {
    console.error("Gagal membuat keluarga:", err);
    await ctx.answerCallbackQuery({
      text: `Gagal membuat keluarga: ${getErrorMessage(err)}`,
      show_alert: true,
    });
  }
}

/**
 * 2. /undang_keluarga <@username>
 * Mengundang anggota keluarga baru berdasarkan username Telegram.
 */
export async function handleUndangKeluarga(ctx: Context, match: string) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const targetUsername = match ? match.trim() : "";
  if (!targetUsername) {
    await ctx.reply(
      `⚠️ *Format Salah!*\n\n` +
        `*Gunakan:* \`/undang_keluarga <@username>\`\n` +
        `*Contoh:* \`/undang_keluarga @pasangan\` atau \`/undang_keluarga @istriku\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  // Look up user's active family status
  const status = await getUserFamilyStatus(user.id);
  const activeFamily =
    status?.activeFamily || (status?.memberships && status.memberships[0]?.family);

  if (!activeFamily) {
    await ctx.reply(
      `⚠️ *Kamu belum memiliki akun keluarga.*\n\n` +
        `Buat akun keluarga terlebih dahulu dengan:\n\`/buat_keluarga <nama_keluarga>\``,
      { parse_mode: "Markdown" }
    );
    return;
  }

  try {
    const { invite, targetUser, family } = await inviteFamilyMember({
      familyId: activeFamily.id,
      inviterUserId: user.id,
      targetUsername,
    });

    const cleanUser = targetUsername.replace(/^@/, "");

    await ctx.reply(
      `✅ *Undangan Berhasil Dikirim!*\n` +
        `───────────────────\n` +
        `👨‍👩‍👧‍👦 *Keluarga:* ${family.name}\n` +
        `👤 *Penerima:* @${cleanUser}\n\n` +
        `Bot telah mengirimkan pesan interaktif ke chat @${cleanUser}.\n` +
        `Setelah dia menekan tombol *Terima*, dia akan langsung bergabung dan dapat melihat serta mencatat keuangan keluarga!`,
      { parse_mode: "Markdown" }
    );

    // Send interactive notification to recipient's direct Telegram chat
    if (targetUser.telegramId) {
      try {
        const inviteKeyboard = new InlineKeyboard()
          .text("✅ Terima Undangan", `fam_inv:acc:${invite.id}`)
          .text("❌ Tolak", `fam_inv:dec:${invite.id}`);

        await ctx.api.sendMessage(
          targetUser.telegramId,
          `📩 *UNDANGAN BERGABUNG KELUARGA*\n` +
            `───────────────────\n` +
            `Halo @${targetUser.telegramUsername || targetUser.fullName}!\n\n` +
            `Kamu diundang oleh @${user.telegramUsername || user.fullName} untuk bergabung ke dalam akun keuangan keluarga:\n\n` +
            `👨‍👩‍👧‍👦 *"${family.name}"*\n\n` +
            `*Keuntungan Bergabung:*\n` +
            `• Kelola saldo & pengeluaran bersama keluarga\n` +
            `• Data keuangan pribadimu tetap terpisah & tersimpan aman\n` +
            `• Kamu dapat beralih antara Mode Personal & Mode Keluarga kapan saja dengan \`/mode\`\n\n` +
            `Apakah kamu ingin menerima undangan ini?`,
          {
            parse_mode: "Markdown",
            reply_markup: inviteKeyboard,
          }
        );
      } catch (sendErr) {
        console.warn("Gagal mengirim pesan langsung ke target user:", sendErr);
      }
    }
  } catch (err) {
    await ctx.reply(`❌ ${getErrorMessage(err)}`, { parse_mode: "Markdown" });
  }
}

/**
 * Callback query respon undangan keluarga (Terima / Tolak)
 */
export async function handleFamilyInviteCallback(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith("fam_inv:")) return;

  const parts = data.split(":");
  const action = parts[1]; // 'acc' | 'dec'
  const inviteId = parts[2];

  const user = await getTelegramUser(ctx);
  if (!user) return;

  try {
    const isAccept = action === "acc";
    const res = await respondFamilyInvite({
      inviteId,
      userId: user.id,
      accept: isAccept,
    });

    if (isAccept) {
      await ctx.editMessageText(
        `🎉 *SELAMAT DATANG DI KELUARGA "${res.family.name}"!*\n` +
          `───────────────────\n` +
          `Kamu sekarang telah resmi bergabung sebagai anggota keluarga.\n\n` +
          `🔄 Mode akunmu otomatis diubah ke *Mode Keluarga* 👨‍👩‍👧‍👦.\n\n` +
          `*Perintah yang bisa kamu coba:*\n` +
          `• Cek saldo dompet keluarga: \`/saldo\`\n` +
          `• Catat pengeluaran keluarga: \`/catat -25k makan malam\`\n` +
          `• Ganti kembali ke mode personal kapan saja: \`/mode\``,
        { parse_mode: "Markdown" }
      );

      // Notifikasi ke admin pembuat keluarga
      const admin = await db.query.users.findFirst({
        where: eq(users.id, res.family.adminUserId),
      });

      if (admin?.telegramId && admin.telegramId !== user.telegramId) {
        try {
          await ctx.api.sendMessage(
            admin.telegramId,
            `🎉 @${user.telegramUsername || user.fullName} telah menerima undangan dan resmi bergabung ke keluarga *"${res.family.name}"*!`,
            { parse_mode: "Markdown" }
          );
        } catch {
          // Ignore notification send error
        }
      }
    } else {
      await ctx.editMessageText(
        `❌ Kamu telah menolak undangan bergabung ke keluarga "${res.family.name}". Data akunmu tidak mengalami perubahan.`
      );
    }
    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error("Gagal merespon undangan:", err);
    await ctx.answerCallbackQuery({
      text: getErrorMessage(err),
      show_alert: true,
    });
  }
}

/**
 * 3. /keluarga
 * Menampilkan status keluarga aktif, daftar anggota, dan aksi cepat.
 */
export async function handleKeluarga(ctx: Context) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const status = await getUserFamilyStatus(user.id);
  if (!status || status.memberships.length === 0) {
    await ctx.reply(
      `👨‍👩‍👧‍👦 *AKUN KELUARGA (SHARING)*\n` +
        `───────────────────\n` +
        `Kamu saat ini belum tergabung dalam keluarga manapun.\n\n` +
        `💡 *Cara Memulai:*\n` +
        `• Buat keluarga baru: \`/buat_keluarga <nama>\`\n` +
        `• Atau minta admin keluargamu untuk mengundang username @${user.telegramUsername || user.fullName} dengan \`/undang_keluarga\`.`,
      { parse_mode: "Markdown" }
    );
    return;
  }

  const activeFamily =
    status.activeFamily || status.memberships[0].family;
  const isFamilyMode = user.activeMode === "family";

  const adminUser = activeFamily.admin;
  const members = activeFamily.members || [];

  const acceptedMembers = members.filter((m) => m.status === "accepted");
  const pendingMembers = members.filter((m) => m.status === "pending");

  let memberListText = acceptedMembers
    .map((m) => {
      const isAdm = m.role === "admin" ? " 👑 _(Admin)_" : "";
      const isYou = m.userId === user.id ? " (Kamu)" : "";
      return `• @${m.user.telegramUsername || m.user.fullName}${isAdm}${isYou}`;
    })
    .join("\n");

  if (pendingMembers.length > 0) {
    memberListText += "\n\n⏳ *Menunggu Persetujuan:*\n";
    memberListText += pendingMembers
      .map((m) => `• @${m.user.telegramUsername || m.user.fullName} _(Pending)_`)
      .join("\n");
  }

  const keyboard = new InlineKeyboard()
    .text(
      isFamilyMode ? "👤 Ganti ke Mode Personal" : "👨‍👩‍👧‍👦 Ganti ke Mode Keluarga",
      isFamilyMode ? "fam_sw:personal" : "fam_sw:family"
    )
    .row()
    .text("➕ Undang Anggota Baru", "fam_prompt_invite");

  await ctx.reply(
    `👨‍👩‍👧‍👦 *STATUS KELUARGA: "${activeFamily.name}"*\n` +
      `───────────────────\n` +
      `👑 *Kepala Keluarga:* @${adminUser.telegramUsername || adminUser.fullName}\n` +
      `🔄 *Mode Aktifmu:* ${isFamilyMode ? "👨‍👩‍👧‍👦 *Mode Keluarga*" : "👤 *Mode Personal*"}\n\n` +
      `👥 *Anggota Terdaftar (${acceptedMembers.length}):*\n` +
      `${memberListText}\n\n` +
      `───────────────────\n` +
      `💡 *Panduan Perintah:*\n` +
      `• Ganti mode: \`/mode\`\n` +
      `• Undang anggota: \`/undang_keluarga @username\`\n` +
      `• Cek saldo: \`/saldo\``,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

/**
 * 4. /mode atau /ganti_mode
 * Menampilkan pilihan pergantian mode akun antara Personal dan Keluarga.
 */
export async function handleMode(ctx: Context) {
  const user = await getTelegramUser(ctx);
  if (!user) return;

  const status = await getUserFamilyStatus(user.id);
  const hasFamily = status && status.memberships.length > 0;
  const isFamilyMode = user.activeMode === "family";

  const keyboard = new InlineKeyboard()
    .text(
      isFamilyMode ? "👤 Mode Personal (Aktifkan)" : "👤 Mode Personal (Sedang Aktif)",
      "fam_sw:personal"
    )
    .row();

  if (hasFamily) {
    keyboard.text(
      isFamilyMode ? "👨‍👩‍👧‍👦 Mode Keluarga (Sedang Aktif)" : "👨‍👩‍👧‍👦 Mode Keluarga (Aktifkan)",
      "fam_sw:family"
    );
  }

  const familyName = status?.activeFamily?.name || (status?.memberships[0]?.family?.name ?? "");

  await ctx.reply(
    `🔄 *PILIH MODE AKUN FANA*\n` +
      `───────────────────\n` +
      `Mode saat ini: ${isFamilyMode ? `👨‍👩‍👧‍👦 *Mode Keluarga* (${familyName})` : "👤 *Mode Personal*"}\n\n` +
      `*Penjelasan Mode:*\n` +
      `• 👤 *Mode Personal:* Seluruh dompet, kategori, & transaksi adalah milik pribadimu sendiri dan tidak dapat dilihat orang lain.\n` +
      `• 👨‍👩‍👧‍👦 *Mode Keluarga:* Akses ke dompet bersama & riwayat pengeluaran yang dibagi dengan anggota keluarga.\n\n` +
      `Pilih mode yang ingin kamu aktifkan melalui tombol di bawah:`,
    {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    }
  );
}

/**
 * Callback query pergantian mode (fam_sw:personal atau fam_sw:family)
 */
export async function handleFamilySwitchCallback(ctx: Context) {
  const data = ctx.callbackQuery?.data;
  if (!data || !data.startsWith("fam_sw:")) return;

  const targetMode = data.replace(/^fam_sw:/, "") as "personal" | "family";

  const user = await getTelegramUser(ctx);
  if (!user) return;

  try {
    const res = await switchUserMode(user.id, targetMode);

    if (res.activeMode === "personal") {
      await ctx.editMessageText(
        `✅ *Beralih ke Mode Personal* 👤\n` +
          `───────────────────\n` +
          `Kamu sekarang menggunakan data keuangan pribadimu.\n\n` +
          `Ketik /saldo untuk cek dompet pribadimu atau /catat untuk transaksi pribadi.`
      );
    } else {
      await ctx.editMessageText(
        `✅ *Beralih ke Mode Keluarga* 👨‍👩‍👧‍👦\n` +
          `───────────────────\n` +
          `Keluarga Aktif: *${res.family.name}*\n\n` +
          `Kamu sekarang menggunakan dompet dan riwayat transaksi bersama keluarga.\n\n` +
          `Ketik /saldo untuk cek dompet keluarga atau /catat untuk mencatat pengeluaran keluarga.`
      );
    }
    await ctx.answerCallbackQuery();
  } catch (err) {
    await ctx.answerCallbackQuery({
      text: getErrorMessage(err),
      show_alert: true,
    });
  }
}

/**
 * Callback query prompt undang anggota
 */
export async function handlePromptInviteCallback(ctx: Context) {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    `💡 Untuk mengundang anggota baru, ketik:\n` +
      `\`/undang_keluarga @username\`\n\n` +
      `_Contoh:_ \`/undang_keluarga @pasangan\``,
    { parse_mode: "Markdown" }
  );
}
