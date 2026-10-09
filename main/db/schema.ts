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
 * Application user profile, supports web authentication.
 */
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  passwordHash: text("password_hash"),
  pinHash: text("pin_hash"),
  pinSalt: text("pin_salt"),
  publicKey: text("public_key"),
  encryptedPrivateKey: text("encrypted_private_key"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 2. ACCOUNTS (Financial Wallets & Bank Accounts)
 * Balances storage: Bank (BCA, Mandiri), e-Wallet (GoPay, OVO), or Cash.
 */
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'bank', 'ewallet', 'cash'
  balance: text("balance").default("0").notNull(),
  currency: text("currency").default("IDR").notNull(),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 3. CATEGORIES (Transaction Categories)
 * Categories for income and expense transactions (e.g. Food & Beverage, Transport, Salary).
 */
export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'income' | 'expense'
  icon: text("icon"), // emoji or icon identifier (e.g. 🍽️, 🚗, 💼)
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 4. TRANSACTIONS (Income & Expense Records)
 * Recorded financial transactions.
 * Linked to account/wallet and category.
 */
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  accountId: uuid("account_id")
    .references(() => accounts.id, { onDelete: "restrict" })
    .notNull(),
  toAccountId: uuid("to_account_id").references(() => accounts.id, { onDelete: "restrict" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  amount: text("amount").notNull(),
  type: text("type").notNull(), // 'income' | 'expense' | 'transfer'
  note: text("note"),
  transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * 5. SESSIONS (Web Login Sessions)
 * Stores active session tokens for browser authentication.
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
 * DRIZZLE ORM RELATIONS
 */
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
  sessions: many(sessions),
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
  transactions: many(transactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  toAccount: one(accounts, {
    fields: [transactions.toAccountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));
