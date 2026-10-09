import { db } from "@/db";
import { users, accounts, categories, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { onboardUser } from "@/lib/onboarding";
import {
  generateUserKeyPair,
  encryptPrivateKeyWithSecret,
} from "@/lib/crypto";

async function main() {
  const dummyEmail = "demo@fiku.app";
  const dummyPassword = "PasswordDemo123!";
  const dummyName = "Demo Fiku";

  console.log("Checking if demo user exists...");
  const existing = await db.query.users.findFirst({
    where: eq(users.email, dummyEmail),
  });

  let userId: string;

  if (existing) {
    console.log("Demo user exists, removing old dummy user to reset clean data...");
    await db.delete(users).where(eq(users.id, existing.id));
  }

  console.log("Creating demo user...");
  const onboard = await onboardUser({
    fullName: dummyName,
    email: dummyEmail,
  });
  userId = onboard.user.id;

  const passwordHash = await bcrypt.hash(dummyPassword, 10);
  const keyPair = generateUserKeyPair();
  const encryptedPrivateKey = encryptPrivateKeyWithSecret(
    keyPair.privateKeyPem,
    dummyPassword,
    keyPair.salt
  );

  await db
    .update(users)
    .set({
      passwordHash,
      publicKey: keyPair.publicKeyPem,
      encryptedPrivateKey,
      pinSalt: keyPair.salt,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  // Get user's default accounts
  const userAccounts = await db.query.accounts.findMany({
    where: eq(accounts.userId, userId),
  });

  const cashAccount = userAccounts.find((a) => a.type === "cash") || userAccounts[0];
  const bankAccount = userAccounts.find((a) => a.type === "bank") || userAccounts[1];
  const ewalletAccount = userAccounts.find((a) => a.type === "ewallet") || userAccounts[2];

  // Set initial realistic balances
  await db.update(accounts).set({ balance: "1550000.00" }).where(eq(accounts.id, cashAccount.id));
  await db.update(accounts).set({ balance: "18750000.00" }).where(eq(accounts.id, bankAccount.id));
  await db.update(accounts).set({ balance: "845000.00" }).where(eq(accounts.id, ewalletAccount.id));

  // Get system & user categories
  let allCategories = await db.query.categories.findMany();

  // If no default categories, create some
  if (allCategories.length === 0) {
    const defaultCats = [
      { name: "Gaji & Pendapatan", type: "income", icon: "💼", isDefault: true },
      { name: "Bonus & Freelance", type: "income", icon: "✨", isDefault: true },
      { name: "Investasi / Bunga", type: "income", icon: "📈", isDefault: true },
      { name: "Makanan & Minuman", type: "expense", icon: "🍜", isDefault: true },
      { name: "Transportasi", type: "expense", icon: "🛵", isDefault: true },
      { name: "Kebutuhan Rumah", type: "expense", icon: "🛒", isDefault: true },
      { name: "Langganan & Utilitas", type: "expense", icon: "⚡", isDefault: true },
      { name: "Hiburan & Rekreasi", type: "expense", icon: "🍿", isDefault: true },
      { name: "Kesehatan", type: "expense", icon: "💊", isDefault: true },
    ];
    allCategories = await db.insert(categories).values(defaultCats).returning();
  }

  const catSalary = allCategories.find((c) => c.name.includes("Gaji")) || allCategories[0];
  const catFreelance = allCategories.find((c) => c.name.includes("Freelance") || c.name.includes("Bonus")) || allCategories[0];
  const catFood = allCategories.find((c) => c.name.includes("Makan") || c.name.includes("Minum")) || allCategories[1];
  const catTransport = allCategories.find((c) => c.name.includes("Transport")) || allCategories[1];
  const catGroceries = allCategories.find((c) => c.name.includes("Rumah") || c.name.includes("Belanja")) || allCategories[1];
  const catBills = allCategories.find((c) => c.name.includes("Langganan") || c.name.includes("Utilitas")) || allCategories[1];
  const catEntertainment = allCategories.find((c) => c.name.includes("Hiburan")) || allCategories[1];

  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");

  const fmtDate = (day: number) => {
    return `${y}-${m}-${String(day).padStart(2, "0")}`;
  };

  const dummyTxs = [
    {
      userId,
      accountId: bankAccount.id,
      categoryId: catSalary.id,
      amount: "15000000.00",
      type: "income",
      note: "Gaji Bulanan PT Teknologi Maju",
      source: "web",
      transactionDate: fmtDate(1),
    },
    {
      userId,
      accountId: bankAccount.id,
      categoryId: catFreelance.id,
      amount: "3500000.00",
      type: "income",
      note: "Project UI/UX Redesign Web",
      source: "web",
      transactionDate: fmtDate(3),
    },
    {
      userId,
      accountId: bankAccount.id,
      toAccountId: ewalletAccount.id,
      categoryId: null,
      amount: "1000000.00",
      type: "transfer",
      note: "Top up e-Wallet Gopay operasional",
      source: "web",
      transactionDate: fmtDate(3),
    },
    {
      userId,
      accountId: bankAccount.id,
      categoryId: catBills.id,
      amount: "450000.00",
      type: "expense",
      note: "Tagihan Listrik PLN & Air PAM",
      source: "web",
      transactionDate: fmtDate(4),
    },
    {
      userId,
      accountId: bankAccount.id,
      categoryId: catBills.id,
      amount: "350000.00",
      type: "expense",
      note: "Internet WiFi Indihome 50 Mbps",
      source: "web",
      transactionDate: fmtDate(4),
    },
    {
      userId,
      accountId: ewalletAccount.id,
      categoryId: catTransport.id,
      amount: "34000.00",
      type: "expense",
      note: "Gojek ke kantor",
      source: "web",
      transactionDate: fmtDate(5),
    },
    {
      userId,
      accountId: cashAccount.id,
      categoryId: catFood.id,
      amount: "28000.00",
      type: "expense",
      note: "Makan siang Nasi Padang + Es Teh",
      source: "web",
      transactionDate: fmtDate(5),
    },
    {
      userId,
      accountId: ewalletAccount.id,
      categoryId: catFood.id,
      amount: "42000.00",
      type: "expense",
      note: "Kopi Kenangan Mantan Large",
      source: "web",
      transactionDate: fmtDate(6),
    },
    {
      userId,
      accountId: cashAccount.id,
      categoryId: catGroceries.id,
      amount: "320000.00",
      type: "expense",
      note: "Belanja mingguan supermarket & buah",
      source: "web",
      transactionDate: fmtDate(7),
    },
    {
      userId,
      accountId: bankAccount.id,
      toAccountId: cashAccount.id,
      categoryId: null,
      amount: "500000.00",
      type: "transfer",
      note: "Tarik tunai ATM untuk uang pegangan",
      source: "web",
      transactionDate: fmtDate(7),
    },
    {
      userId,
      accountId: ewalletAccount.id,
      categoryId: catEntertainment.id,
      amount: "186000.00",
      type: "expense",
      note: "Langganan Netflix Premium & Spotify Family",
      source: "web",
      transactionDate: fmtDate(8),
    },
    {
      userId,
      accountId: cashAccount.id,
      categoryId: catFood.id,
      amount: "35000.00",
      type: "expense",
      note: "Makan malam sate ayam madura",
      source: "web",
      transactionDate: fmtDate(8),
    },
    {
      userId,
      accountId: ewalletAccount.id,
      categoryId: catFood.id,
      amount: "55000.00",
      type: "expense",
      note: "Pesan Gofood Hokben paket hemar",
      source: "web",
      transactionDate: fmtDate(9),
    },
  ];

  console.log("Inserting dummy transactions...");
  await db.insert(transactions).values(dummyTxs);

  console.log("\n==========================================");
  console.log("✔ DUMMY ACCOUNT SUCCESSFULLY CREATED!");
  console.log("Email    : " + dummyEmail);
  console.log("Password : " + dummyPassword);
  console.log("Name     : " + dummyName);
  console.log("Transactions count: " + dummyTxs.length);
  console.log("==========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("Error creating dummy data:", e);
    process.exit(1);
  });
