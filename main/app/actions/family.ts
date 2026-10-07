"use server";

import { db } from "@/db";
import {
  families,
  familyMembers,
  users,
  accounts,
  categories,
  transactions,
  budgets,
  debts,
} from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

export async function createFamily(data: {
  adminUserId: string;
  name: string;
  starterMode: "copy" | "empty";
}) {
  const { adminUserId, name, starterMode } = data;

  const user = await db.query.users.findFirst({
    where: eq(users.id, adminUserId),
  });

  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  // 1. Buat record keluarga baru
  const [newFamily] = await db
    .insert(families)
    .values({
      name: name.trim(),
      adminUserId,
    })
    .returning();

  // 2. Masukkan pembuat keluarga sebagai anggota dengan role 'admin' & status 'accepted'
  const [adminMember] = await db
    .insert(familyMembers)
    .values({
      familyId: newFamily.id,
      userId: adminUserId,
      role: "admin",
      status: "accepted",
    })
    .returning();

  // 3. Update activeMode dan activeFamilyId di user
  await db
    .update(users)
    .set({
      activeMode: "family",
      activeFamilyId: newFamily.id,
      updatedAt: new Date(),
    })
    .where(eq(users.id, adminUserId));

  // 4. Starter Data: Salin data personal ATAU mulai kosong
  if (starterMode === "copy") {
    // Ambil akun dompet personal user
    const personalAccounts = await db.query.accounts.findMany({
      where: and(eq(accounts.userId, adminUserId), isNull(accounts.familyId)),
    });

    const accountMap = new Map<string, string>(); // oldId -> newId

    for (const acc of personalAccounts) {
      const [copiedAcc] = await db
        .insert(accounts)
        .values({
          userId: adminUserId,
          familyId: newFamily.id,
          name: acc.name,
          type: acc.type,
          balance: acc.balance,
          currency: acc.currency,
          isDefault: acc.isDefault,
        })
        .returning();
      accountMap.set(acc.id, copiedAcc.id);
    }

    // Ambil kategori personal user (kategori kustom yang dibuat user)
    const personalCategories = await db.query.categories.findMany({
      where: and(eq(categories.userId, adminUserId), isNull(categories.familyId)),
    });

    const categoryMap = new Map<string, string>(); // oldId -> newId

    for (const cat of personalCategories) {
      const [copiedCat] = await db
        .insert(categories)
        .values({
          userId: adminUserId,
          familyId: newFamily.id,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          isDefault: false,
        })
        .returning();
      categoryMap.set(cat.id, copiedCat.id);
    }

    // Salin transaksi personal user
    const personalTransactions = await db.query.transactions.findMany({
      where: and(eq(transactions.userId, adminUserId), isNull(transactions.familyId)),
    });

    for (const tx of personalTransactions) {
      const targetAccountId = accountMap.get(tx.accountId);
      // Jika dompet tidak ditemukan di map, lewati atau gunakan dompet pertama yang dibuat
      if (!targetAccountId) continue;

      const targetCategoryId = categoryMap.get(tx.categoryId) || tx.categoryId;

      await db.insert(transactions).values({
        userId: adminUserId,
        familyId: newFamily.id,
        accountId: targetAccountId,
        categoryId: targetCategoryId,
        amount: tx.amount,
        type: tx.type,
        note: tx.note,
        source: tx.source,
        transactionDate: tx.transactionDate,
      });
    }

    // Salin alokasi anggaran personal
    const personalBudgets = await db.query.budgets.findMany({
      where: and(eq(budgets.userId, adminUserId), isNull(budgets.familyId)),
    });

    for (const b of personalBudgets) {
      const targetCategoryId = categoryMap.get(b.categoryId) || b.categoryId;
      await db.insert(budgets).values({
        userId: adminUserId,
        familyId: newFamily.id,
        categoryId: targetCategoryId,
        name: b.name,
        amountLimit: b.amountLimit,
        periodStart: b.periodStart,
        periodEnd: b.periodEnd,
        notes: b.notes,
      });
    }

    // Salin catatan utang personal
    const personalDebts = await db.query.debts.findMany({
      where: and(eq(debts.userId, adminUserId), isNull(debts.familyId)),
    });

    for (const debt of personalDebts) {
      await db.insert(debts).values({
        userId: adminUserId,
        familyId: newFamily.id,
        contactName: debt.contactName,
        amount: debt.amount,
        type: debt.type,
        dueDate: debt.dueDate,
        isSettled: debt.isSettled,
        note: debt.note,
      });
    }
  } else {
    // Mode 'empty': Buat dompet default keluarga dari 0
    await db.insert(accounts).values([
      {
        userId: adminUserId,
        familyId: newFamily.id,
        name: "Kas / Tunai Keluarga",
        type: "cash",
        balance: "0",
        currency: "IDR",
        isDefault: true,
      },
      {
        userId: adminUserId,
        familyId: newFamily.id,
        name: "Rekening Bank Keluarga",
        type: "bank",
        balance: "0",
        currency: "IDR",
        isDefault: false,
      },
    ]);
  }

  return {
    family: newFamily,
    member: adminMember,
  };
}

export async function inviteFamilyMember(data: {
  familyId: string;
  inviterUserId: string;
  targetUsername: string;
}) {
  const { familyId, inviterUserId, targetUsername } = data;

  const cleanUsername = targetUsername.replace(/^@/, "").trim().toLowerCase();

  if (!cleanUsername) {
    throw new Error("Username telegram tidak valid.");
  }

  // 1. Verifikasi inviter adalah anggota keluarga ini dengan status accepted
  const inviterMember = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.familyId, familyId),
      eq(familyMembers.userId, inviterUserId),
      eq(familyMembers.status, "accepted")
    ),
  });

  if (!inviterMember) {
    throw new Error("Kamu bukan anggota aktif dari keluarga ini.");
  }

  // 2. Ambil info keluarga
  const family = await db.query.families.findFirst({
    where: eq(families.id, familyId),
  });

  if (!family) {
    throw new Error("Keluarga tidak ditemukan.");
  }

  // 3. Cari target user di database berdasarkan telegram_username (case-insensitive)
  const targetUser = await db.query.users.findFirst({
    where: sql`lower(${users.telegramUsername}) = ${cleanUsername}`,
  });

  if (!targetUser) {
    throw new Error(
      `Pengguna @${cleanUsername} belum terdaftar di Fana.\nPastikan dia sudah pernah membuka dan menjalankan /start di bot ini.`
    );
  }

  if (targetUser.id === inviterUserId) {
    throw new Error("Kamu tidak dapat mengundang diri sendiri.");
  }

  // 4. Cek apakah target sudah terdaftar di keluarga ini
  const existingMember = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.familyId, familyId),
      eq(familyMembers.userId, targetUser.id)
    ),
  });

  let inviteRecord;

  if (existingMember) {
    if (existingMember.status === "accepted") {
      throw new Error(`@${cleanUsername} sudah menjadi anggota keluarga ini.`);
    }
    if (existingMember.status === "pending") {
      throw new Error(`Undangan untuk @${cleanUsername} sudah pernah dikirim dan sedang menunggu tanggapan.`);
    }
    // Jika sebelumnya declined, update kembali menjadi pending
    const [updated] = await db
      .update(familyMembers)
      .set({
        status: "pending",
        invitedBy: inviterUserId,
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, existingMember.id))
      .returning();
    inviteRecord = updated;
  } else {
    const [created] = await db
      .insert(familyMembers)
      .values({
        familyId,
        userId: targetUser.id,
        role: "member",
        status: "pending",
        invitedBy: inviterUserId,
      })
      .returning();
    inviteRecord = created;
  }

  const inviterUser = await db.query.users.findFirst({
    where: eq(users.id, inviterUserId),
  });

  return {
    invite: inviteRecord,
    targetUser,
    inviterUser,
    family,
  };
}

export async function respondFamilyInvite(data: {
  inviteId: string;
  userId: string;
  accept: boolean;
}) {
  const { inviteId, userId, accept } = data;

  const invite = await db.query.familyMembers.findFirst({
    where: and(
      eq(familyMembers.id, inviteId),
      eq(familyMembers.userId, userId)
    ),
    with: {
      family: true,
    },
  });

  if (!invite) {
    throw new Error("Undangan keluarga tidak ditemukan.");
  }

  if (invite.status !== "pending") {
    throw new Error(`Undangan ini sudah pernah direspon (${invite.status}).`);
  }

  if (accept) {
    const [updatedMember] = await db
      .update(familyMembers)
      .set({
        status: "accepted",
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, inviteId))
      .returning();

    // Otomatis beralih ke mode keluarga untuk user yang menerima
    await db
      .update(users)
      .set({
        activeMode: "family",
        activeFamilyId: invite.familyId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return {
      success: true,
      accepted: true,
      member: updatedMember,
      family: invite.family,
    };
  } else {
    const [updatedMember] = await db
      .update(familyMembers)
      .set({
        status: "declined",
        updatedAt: new Date(),
      })
      .where(eq(familyMembers.id, inviteId))
      .returning();

    return {
      success: true,
      accepted: false,
      member: updatedMember,
      family: invite.family,
    };
  }
}

export async function switchUserMode(
  userId: string,
  mode: "personal" | "family",
  targetFamilyId?: string
) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    throw new Error("Pengguna tidak ditemukan.");
  }

  if (mode === "personal") {
    const [updated] = await db
      .update(users)
      .set({
        activeMode: "personal",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    return {
      activeMode: "personal" as const,
      user: updated,
      family: null,
    };
  }

  // Mode family: cek apakah user punya keanggotaan aktif di keluarga
  const memberships = await db.query.familyMembers.findMany({
    where: and(
      eq(familyMembers.userId, userId),
      eq(familyMembers.status, "accepted")
    ),
    with: {
      family: true,
    },
  });

  if (memberships.length === 0) {
    throw new Error(
      "Kamu belum bergabung dalam keluarga manapun.\n\n" +
      "Gunakan /buat_keluarga <nama> untuk membuat akun keluarga baru, atau minta admin keluarga mengundangmu."
    );
  }

  let selectedMembership = memberships[0];

  if (targetFamilyId) {
    const found = memberships.find((m) => m.familyId === targetFamilyId);
    if (!found) {
      throw new Error("Keluarga yang dipilih tidak ditemukan atau belum aktif.");
    }
    selectedMembership = found;
  } else if (user.activeFamilyId) {
    const found = memberships.find((m) => m.familyId === user.activeFamilyId);
    if (found) {
      selectedMembership = found;
    }
  }

  const [updated] = await db
    .update(users)
    .set({
      activeMode: "family",
      activeFamilyId: selectedMembership.familyId,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  return {
    activeMode: "family" as const,
    user: updated,
    family: selectedMembership.family,
  };
}

export async function getUserFamilyStatus(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) return null;

  const memberships = await db.query.familyMembers.findMany({
    where: and(
      eq(familyMembers.userId, userId),
      eq(familyMembers.status, "accepted")
    ),
    with: {
      family: {
        with: {
          admin: true,
          members: {
            with: {
              user: true,
            },
          },
        },
      },
    },
  });

  const pendingInvites = await db.query.familyMembers.findMany({
    where: and(
      eq(familyMembers.userId, userId),
      eq(familyMembers.status, "pending")
    ),
    with: {
      family: {
        with: {
          admin: true,
        },
      },
      inviter: true,
    },
  });

  let activeFamily = null;
  if (user.activeFamilyId) {
    const active = memberships.find((m) => m.familyId === user.activeFamilyId);
    if (active) {
      activeFamily = active.family;
    }
  }

  return {
    user,
    activeMode: user.activeMode as "personal" | "family",
    activeFamily,
    memberships,
    pendingInvites,
  };
}
