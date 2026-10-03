import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  numeric,
  timestamp,
  date,
  boolean,
} from "drizzle-orm/pg-core";

/**
 * 1. USERS
 * Data pengguna aplikasi, mendukung autentikasi web dan integrasi Telegram.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  telegramId: text("telegram_id").unique(),
  telegramUsername: text("telegram_username"),
  activeMode: text("active_mode").default("personal").notNull(), // 'personal' | 'family'
  activeFamilyId: uuid("active_family_id"),
  pinHash: text("pin_hash"),
  pinSalt: text("pin_salt"),
  publicKey: text("public_key"),
  encryptedPrivateKey: text("encrypted_private_key"),
  expiredAt: timestamp("expired_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 2. FAMILIES (Grup / Akun Keluarga)
 */
export const families = pgTable("families", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  adminUserId: uuid("admin_user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 2b. FAMILY MEMBERS (Anggota Keluarga & Status Undangan)
 */
export const familyMembers = pgTable("family_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  familyId: uuid("family_id")
    .references(() => families.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  role: text("role").default("member").notNull(), // 'admin' | 'member'
  status: text("status").default("pending").notNull(), // 'pending' | 'accepted' | 'declined'
  invitedBy: uuid("invited_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 3. ACCOUNTS (Rekening / Dompet Keuangan)
 * Tempat penyimpanan saldo: Bank (BCA, Mandiri), e-Wallet (GoPay, OVO), atau Cash.
 */
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'bank', 'ewallet', 'cash'
  balance: numeric("balance", { precision: 15, scale: 2 }).default("0").notNull(),
  currency: text("currency").default("IDR").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 4. CATEGORIES (Kategori Transaksi)
 * Kategori pemasukan dan pengeluaran (misal: Makan & Minum, Transport, Gaji).
 */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  icon: text("icon"), // emoji atau identifier icon (contoh: 🍽️, 🚗, 💼)
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 5. BUDGETS (Alokasi Dana dengan Range Waktu)
 * Membatasi anggaran pengeluaran dalam rentang tanggal tertentu (mingguan, bulanan, custom).
 * Contoh: Alokasi Makan & Minum periode 1 Okt - 31 Okt senilai Rp 2.000.000.
 */
export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }),
  categoryId: uuid("category_id")
    .references(() => categories.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name"), // Nama opsional alokasi (misal: "Alokasi Belanja Bulanan")
  amountLimit: numeric("amount_limit", { precision: 15, scale: 2 }).notNull(),
  periodStart: date("period_start").notNull(), // Mulai rentang waktu
  periodEnd: date("period_end").notNull(),     // Akhir rentang waktu
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 6. TRANSACTIONS (Pemasukan & Pengeluaran)
 * Rekaman setiap transaksi keuangan.
 * Terhubung ke akun dompet, kategori, dan opsional langsung ke alokasi dana (budget).
 */
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }),
  accountId: uuid("account_id")
    .references(() => accounts.id, { onDelete: "restrict" })
    .notNull(),
  categoryId: uuid("category_id")
    .references(() => categories.id, { onDelete: "set null" })
    .notNull(),
  budgetId: uuid("budget_id").references(() => budgets.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  note: text("note"),
  source: text("source").default("telegram").notNull(), // 'web', 'whatsapp', 'telegram'
  transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 7. DEBTS (Catatan Utang & Piutang)
 * Mencatat uang yang kita pinjamkan ke orang lain atau kita pinjam dari orang lain.
 */
export const debts = pgTable("debts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  familyId: uuid("family_id").references(() => families.id, { onDelete: "cascade" }),
  contactName: text("contact_name").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  type: text("type").notNull(), // 'owed_by_me' (utang) | 'owed_to_me' (piutang)
  dueDate: date("due_date"),
  isSettled: boolean("is_settled").default(false).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 8. AUTH OTP CODES (Verifikasi Login Telegram)
 * Menyimpan kode OTP 6-digit sementara yang dikirimkan bot Telegram ke chat pengguna.
 */
export const authOtpCodes = pgTable("auth_otp_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 9. SESSIONS (Sesi Login Web)
 * Menyimpan token sesi aktif untuk autentikasi browser web.
 */
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // random crypto token
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * RELASI DRIZZLE ORM
 */
export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  budgets: many(budgets),
  transactions: many(transactions),
  debts: many(debts),
  authOtpCodes: many(authOtpCodes),
  sessions: many(sessions),
  familyMemberships: many(familyMembers),
  activeFamily: one(families, {
    fields: [users.activeFamilyId],
    references: [families.id],
  }),
}));

export const familiesRelations = relations(families, ({ one, many }) => ({
  admin: one(users, {
    fields: [families.adminUserId],
    references: [users.id],
  }),
  members: many(familyMembers),
  accounts: many(accounts),
  categories: many(categories),
  budgets: many(budgets),
  transactions: many(transactions),
  debts: many(debts),
}));

export const familyMembersRelations = relations(familyMembers, ({ one }) => ({
  family: one(families, {
    fields: [familyMembers.familyId],
    references: [families.id],
  }),
  user: one(users, {
    fields: [familyMembers.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [familyMembers.invitedBy],
    references: [users.id],
  }),
}));

export const authOtpCodesRelations = relations(authOtpCodes, ({ one }) => ({
  user: one(users, {
    fields: [authOtpCodes.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  family: one(families, {
    fields: [accounts.familyId],
    references: [families.id],
  }),
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  family: one(families, {
    fields: [categories.familyId],
    references: [families.id],
  }),
  budgets: many(budgets),
  transactions: many(transactions),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
  family: one(families, {
    fields: [budgets.familyId],
    references: [families.id],
  }),
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  family: one(families, {
    fields: [transactions.familyId],
    references: [families.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  budget: one(budgets, {
    fields: [transactions.budgetId],
    references: [budgets.id],
  }),
}));

export const debtsRelations = relations(debts, ({ one }) => ({
  user: one(users, {
    fields: [debts.userId],
    references: [users.id],
  }),
  family: one(families, {
    fields: [debts.familyId],
    references: [families.id],
  }),
}));
