export type Locale = "id" | "en";

export const DEFAULT_LOCALE: Locale = "id";
export const LOCALE_COOKIE_NAME = "fiku_locale";

export interface Dictionary {
  // Common
  common: {
    appTitle: string;
    appName: string;
    tagline: string;
    save: string;
    cancel: string;
    delete: string;
    loading: string;
    back: string;
    actions: string;
    status: string;
    date: string;
    type: string;
    category: string;
    wallet: string;
    amount: string;
    note: string;
    all: string;
    success: string;
    error: string;
  };

  // Nav
  nav: {
    transactions: string;
    summary: string;
    signIn: string;
    signOut: string;
    home: string;
    navigation: string;
  };

  // Transaction Types
  txTypes: {
    expense: string;
    income: string;
    transfer: string;
    outBadge: string;
    inBadge: string;
    tfBadge: string;
  };

  // Default Wallets
  defaultWallets: {
    cash: string;
    bank: string;
    ewallet: string;
  };

  // Default Categories
  defaultCategories: {
    salary: string;
    freelance: string;
    investment: string;
    food: string;
    transport: string;
    groceries: string;
    bills: string;
    health: string;
    entertainment: string;
    education: string;
    installment: string;
    gift: string;
  };

  // Landing Page
  landing: {
    metaTitle: string;
    metaDesc: string;
    heroBadge: string;
    heroTitle: string;
    heroSubtitle: string;
    startFree: string;
    starGitHub: string;
    whyChooseTitle: string;
    whyChooseSub: string;
    featureSmartTitle: string;
    featureSmartDesc: string;
    featureSheetTitle: string;
    featureSheetDesc: string;
    featureSecurityTitle: string;
    featureSecurityDesc: string;
    faqTitle: string;
    faqSubtitle: string;
    ctaTitle: string;
    ctaSub: string;
    ctaBtn: string;
    footerDesc: string;
  };

  // Transaksi Page
  transaksi: {
    metaTitle: string;
    metaDesc: string;
    heading: string;
    subheading: string;
    quickBalance: string;
    quickWallets: string;
    quickCategories: string;
    smartInputPlaceholder: string;
    smartInputRecord: string;
    smartInputGuide: string;
    exportImport: string;
    newRow: string;
    deleteSelected: string;
    showingText: string;
    ofText: string;
    pageText: string;
    batchDeleteConfirmTitle: string;
    batchDeleteConfirmDesc: string;
  };

  // Ringkasan Page
  ringkasan: {
    metaTitle: string;
    metaDesc: string;
    heading: string;
    subheading: string;
    totalBalance: string;
    totalIncome: string;
    totalExpense: string;
    netSavings: string;
    daily: string;
    weekly: string;
    monthly: string;
    yearly: string;
    expenseByCategory: string;
    walletBreakdown: string;
    noExpenseData: string;
    cashflowChartTitle: string;
    incomeBar: string;
    expenseBar: string;
  };
}

export const idDict: Dictionary = {
  common: {
    appTitle: "Fiku • Catat Cepat, Kendalikan Keuangan Pribadi",
    appName: "Fiku",
    tagline: "Catat Cepat, Kendalikan Keuangan Pribadi",
    save: "Simpan",
    cancel: "Batal",
    delete: "Hapus",
    loading: "Memuat...",
    back: "Kembali",
    actions: "Aksi",
    status: "Status",
    date: "Tanggal",
    type: "Tipe",
    category: "Kategori",
    wallet: "Kantong / Dompet",
    amount: "Nominal (Rp)",
    note: "Keterangan",
    all: "Semua",
    success: "Berhasil",
    error: "Gagal",
  },
  nav: {
    transactions: "Transaksi",
    summary: "Ringkasan",
    signIn: "Masuk",
    signOut: "Keluar",
    home: "Beranda",
    navigation: "Navigasi",
  },
  txTypes: {
    expense: "Pengeluaran",
    income: "Pemasukan",
    transfer: "Transfer",
    outBadge: "out",
    inBadge: "in",
    tfBadge: "tf",
  },
  defaultWallets: {
    cash: "Cash (Dompet Tunai)",
    bank: "Rekening Bank",
    ewallet: "e-Wallet (GoPay/OVO)",
  },
  defaultCategories: {
    salary: "Gaji & Pendapatan",
    freelance: "Bonus & Freelance",
    investment: "Investasi / Bunga",
    food: "Makanan & Minuman",
    transport: "Transportasi",
    groceries: "Kebutuhan Rumah",
    bills: "Langganan & Utilitas",
    health: "Kesehatan",
    entertainment: "Hiburan & Rekreasi",
    education: "Pendidikan",
    installment: "Cicilan",
    gift: "Hadiah",
  },
  landing: {
    metaTitle: "Fiku • Catat Cepat, Kendalikan Keuangan Pribadi",
    metaDesc: "Aplikasi pencatat keuangan instan dengan Smart Input dan spreadsheet live-sync. Data terenkripsi dengan Zero-Knowledge Security.",
    heroBadge: "Pencatatan Keuangan Modern & Terenkripsi",
    heroTitle: "Catat Cepat, Kendalikan Keuangan Pribadi.",
    heroSubtitle: "Kombinasi kecepatan Smart Input ala chat dan fleksibilitas spreadsheet Excel. Dilindungi enkripsi Zero-Knowledge tingkat lanjut.",
    startFree: "Mulai Sekarang — Gratis",
    starGitHub: "Bintang di GitHub",
    whyChooseTitle: "Kenapa Memilih Fiku?",
    whyChooseSub: "Dibangun untuk kecepatan, kepraktisan, dan keamanan tanpa kompromi.",
    featureSmartTitle: "Smart Input Kilat",
    featureSmartDesc: "Catat pengeluaran di mana saja dalam hitungan detik. Cukup ketik format teks sederhana, sistem otomatis memproses ke kantong yang tepat.",
    featureSheetTitle: "Live Spreadsheet Ala Excel",
    featureSheetDesc: "Mau merapikan transaksi di rumah? Edit tanggal, nominal, dan catatan langsung di sel tabel dengan format ribuan otomatis & debounce auto-save.",
    featureSecurityTitle: "Zero-Knowledge & Double Protection",
    featureSecurityDesc: "Kunci kriptografi akun kamu diamankan oleh kombinasi password dan server secret key. Privasi keuangan kamu terlindungi seutuhnya.",
    faqTitle: "FAQ Seputar Fiku",
    faqSubtitle: "Segala hal yang perlu kamu ketahui tentang fitur dan perlindungan data di Fiku.",
    ctaTitle: "Siap Mengatur Keuangan Lebih Ringan?",
    ctaSub: "Daftar sekarang dan rasakan kemudahan mencatat keuangan tanpa ribet.",
    ctaBtn: "Mulai Pakai Fiku Sekarang",
    footerDesc: "Zero-Knowledge Personal Finance Platform",
  },
  transaksi: {
    metaTitle: "Transaksi • Fiku",
    metaDesc: "Pencatatan dan edit transaksi instan ala Google Sheet",
    heading: "Lembar Transaksi",
    subheading: "Ketik cepat pakai Smart Input atau edit langsung di tabel selayaknya spreadsheet.",
    quickBalance: "Saldo",
    quickWallets: "Kantong",
    quickCategories: "Kategori",
    smartInputPlaceholder: 'Smart input, misal: "-25k sayur cash" atau "tf 100k bca ke gopay"',
    smartInputRecord: "Catat",
    smartInputGuide: "Panduan",
    exportImport: "Ekspor / Impor",
    newRow: "Baris Baru (Row)",
    deleteSelected: "Hapus Terpilih",
    showingText: "Menampilkan",
    ofText: "dari",
    pageText: "Hal",
    batchDeleteConfirmTitle: "Hapus Transaksi Terpilih",
    batchDeleteConfirmDesc: "Apakah kamu yakin ingin menghapus transaksi yang dipilih? Saldo seluruh kantong terkait akan otomatis disesuaikan kembali.",
  },
  ringkasan: {
    metaTitle: "Ringkasan • Fiku",
    metaDesc: "Laporan dan analisis keuangan tahunan, bulanan, mingguan, dan harian",
    heading: "Ringkasan Keuangan",
    subheading: "Analisis tren cash flow, pengeluaran per kategori, dan akumulasi saldo akun.",
    totalBalance: "Total Saldo Bersih",
    totalIncome: "Total Pemasukan",
    totalExpense: "Total Pengeluaran",
    netSavings: "Selisih Bersih (Cashflow)",
    daily: "Harian",
    weekly: "Mingguan",
    monthly: "Bulanan",
    yearly: "Tahunan",
    expenseByCategory: "Pengeluaran per Kategori",
    walletBreakdown: "Rincian Saldo Kantong",
    noExpenseData: "Belum ada data pengeluaran pada rentang waktu ini.",
    cashflowChartTitle: "Tren Arus Kas (Pemasukan vs Pengeluaran)",
    incomeBar: "Pemasukan",
    expenseBar: "Pengeluaran",
  },
};

export const enDict: Dictionary = {
  common: {
    appTitle: "Fiku • Fast Tracking, Master Your Personal Finance",
    appName: "Fiku",
    tagline: "Fast Tracking, Master Your Personal Finance",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    loading: "Loading...",
    back: "Back",
    actions: "Actions",
    status: "Status",
    date: "Date",
    type: "Type",
    category: "Category",
    wallet: "Wallet / Account",
    amount: "Amount",
    note: "Notes",
    all: "All",
    success: "Success",
    error: "Failed",
  },
  nav: {
    transactions: "Transactions",
    summary: "Summary",
    signIn: "Sign In",
    signOut: "Sign Out",
    home: "Home",
    navigation: "Navigation",
  },
  txTypes: {
    expense: "Expense",
    income: "Income",
    transfer: "Transfer",
    outBadge: "out",
    inBadge: "in",
    tfBadge: "tf",
  },
  defaultWallets: {
    cash: "Cash (Physical Wallet)",
    bank: "Bank Account",
    ewallet: "e-Wallet (GoPay/PayPal)",
  },
  defaultCategories: {
    salary: "Salary & Wages",
    freelance: "Freelance & Bonus",
    investment: "Investments & Dividends",
    food: "Food & Dining",
    transport: "Transportation",
    groceries: "Groceries & Home",
    bills: "Bills & Utilities",
    health: "Healthcare",
    entertainment: "Entertainment & Leisure",
    education: "Education",
    installment: "Debt & Installments",
    gift: "Gifts & Donations",
  },
  landing: {
    metaTitle: "Fiku • Fast Tracking, Master Your Personal Finance",
    metaDesc: "Instant finance tracking with Smart Input and live-sync spreadsheet. End-to-end encrypted with Zero-Knowledge Security.",
    heroBadge: "Modern Encrypted Personal Finance",
    heroTitle: "Track Fast, Master Your Personal Finance.",
    heroSubtitle: "The speed of conversational Smart Input meets the power of live spreadsheets. Guarded by Zero-Knowledge encryption.",
    startFree: "Get Started — Free",
    starGitHub: "Star on GitHub",
    whyChooseTitle: "Why Choose Fiku?",
    whyChooseSub: "Engineered for speed, practicality, and uncompromising privacy.",
    featureSmartTitle: "Instant Smart Input",
    featureSmartDesc: "Record expenses on the go in seconds. Type natural shorthand, Fiku auto-categorizes and allocates to your wallet.",
    featureSheetTitle: "Excel-Style Live Sheet",
    featureSheetDesc: "Prefer reviewing finances on your desktop? Edit dates, amounts, and notes directly in cells with instant auto-save.",
    featureSecurityTitle: "Zero-Knowledge Protection",
    featureSecurityDesc: "Cryptographic keys are guarded by your password combined with server secret salt. Your numbers remain completely private.",
    faqTitle: "Frequently Asked Questions",
    faqSubtitle: "Everything you need to know about Fiku's features and data protection.",
    ctaTitle: "Ready to Take Control of Your Money?",
    ctaSub: "Sign up in seconds and experience effortless finance tracking.",
    ctaBtn: "Start Using Fiku Now",
    footerDesc: "Zero-Knowledge Personal Finance Platform",
  },
  transaksi: {
    metaTitle: "Transactions • Fiku",
    metaDesc: "Instant transaction tracking and live spreadsheet editor",
    heading: "Transaction Sheet",
    subheading: "Record quickly with Smart Input or edit directly inside the spreadsheet grid.",
    quickBalance: "Balance",
    quickWallets: "Wallets",
    quickCategories: "Categories",
    smartInputPlaceholder: 'Smart input, e.g. "-25k lunch cash" or "tf 100k bca to gopay"',
    smartInputRecord: "Record",
    smartInputGuide: "Guide",
    exportImport: "Export / Import",
    newRow: "New Row",
    deleteSelected: "Delete Selected",
    showingText: "Showing",
    ofText: "of",
    pageText: "Page",
    batchDeleteConfirmTitle: "Delete Selected Transactions",
    batchDeleteConfirmDesc: "Are you sure you want to delete the selected transactions? Corresponding wallet balances will be automatically recalculated.",
  },
  ringkasan: {
    metaTitle: "Summary • Fiku",
    metaDesc: "Annual, monthly, weekly, and daily financial analysis and reports",
    heading: "Financial Summary",
    subheading: "Analyze cash flow trends, category spending, and account balances.",
    totalBalance: "Net Total Balance",
    totalIncome: "Total Income",
    totalExpense: "Total Expense",
    netSavings: "Net Savings (Cashflow)",
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
    yearly: "Yearly",
    expenseByCategory: "Spending by Category",
    walletBreakdown: "Wallet Breakdown",
    noExpenseData: "No expense records found for this period.",
    cashflowChartTitle: "Cash Flow Trend (Income vs Expense)",
    incomeBar: "Income",
    expenseBar: "Expense",
  },
};

export const dictionaries: Record<Locale, Dictionary> = {
  id: idDict,
  en: enDict,
};

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
}

const CATEGORY_TRANSLATIONS: Record<string, { id: string; en: string }> = {
  "Gaji": { id: "Gaji", en: "Salary" },
  "Gaji & Pendapatan": { id: "Gaji & Pendapatan", en: "Salary & Wages" },
  "Freelance": { id: "Freelance", en: "Freelance" },
  "Bonus & Freelance": { id: "Bonus & Freelance", en: "Bonus & Freelance" },
  "Investasi": { id: "Investasi", en: "Investments" },
  "Investasi / Bunga": { id: "Investasi / Bunga", en: "Investments & Interest" },
  "Hadiah": { id: "Hadiah", en: "Gifts & Grants" },
  "Lainnya (Pemasukan)": { id: "Lainnya (Pemasukan)", en: "Other (Income)" },
  "Makan & Minum": { id: "Makan & Minum", en: "Food & Drinks" },
  "Makanan & Minuman": { id: "Makanan & Minuman", en: "Food & Dining" },
  "Transport": { id: "Transport", en: "Transportation" },
  "Transportasi": { id: "Transportasi", en: "Transportation" },
  "Belanja": { id: "Belanja", en: "Shopping & Groceries" },
  "Kebutuhan Rumah": { id: "Kebutuhan Rumah", en: "Home & Groceries" },
  "Tagihan & Utilitas": { id: "Tagihan & Utilitas", en: "Bills & Utilities" },
  "Langganan & Utilitas": { id: "Langganan & Utilitas", en: "Subscriptions & Utilities" },
  "Kesehatan": { id: "Kesehatan", en: "Healthcare" },
  "Hiburan": { id: "Hiburan", en: "Entertainment" },
  "Hiburan & Rekreasi": { id: "Hiburan & Rekreasi", en: "Entertainment & Leisure" },
  "Pendidikan": { id: "Pendidikan", en: "Education" },
  "Cicilan": { id: "Cicilan", en: "Installments & Debt" },
  "Lainnya (Pengeluaran)": { id: "Lainnya (Pengeluaran)", en: "Other (Expense)" },
};

export function translateCategoryName(name: string, locale: Locale): string {
  if (locale === "id") return name;
  const match = CATEGORY_TRANSLATIONS[name];
  if (match) return match.en;
  return name;
}

const ACCOUNT_TRANSLATIONS: Record<string, { id: string; en: string }> = {
  "Cash (Dompet Tunai)": { id: "Cash (Dompet Tunai)", en: "Cash (Wallet)" },
  "Rekening Bank": { id: "Rekening Bank", en: "Bank Account" },
  "e-Wallet (GoPay/OVO)": { id: "e-Wallet (GoPay/OVO)", en: "e-Wallet (Digital)" },
};

export function translateAccountName(name: string, locale: Locale): string {
  if (locale === "id") return name;
  const match = ACCOUNT_TRANSLATIONS[name];
  if (match) return match.en;
  return name;
}
