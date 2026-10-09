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
    saving: string;
    saved: string;
    cancel: string;
    delete: string;
    deleting: string;
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
    logout: string;
    loggingOut: string;
    confirmLogoutTitle: string;
    confirmLogoutDesc: string;
    confirmLogoutBtn: string;
    confirmDelete: string;
    close: string;
  };

  // Nav
  nav: {
    transactions: string;
    summary: string;
    signIn: string;
    signOut: string;
    home: string;
    navigation: string;
    dashboard: string;
    signInRegister: string;
    themeLight: string;
    themeDark: string;
    themeSystem: string;
    themeToggle: string;
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
    heroTitlePrefix: string;
    heroTitleHighlight: string;
    heroTitleSuffix: string;
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
    mockupAutoParsed: string;
    mockupSaved: string;
    previewTitle: string;
    previewSub: string;
    previewBadge: string;
    previewTabTransactions: string;
    previewTabSummary: string;
    previewResetBtn: string;
    previewResetSuccess: string;
    previewAddRowBtn: string;
    previewSmartHint: string;
    previewSyncing: string;
    previewSynced: string;
    previewDeleteConfirm: string;
    previewSandboxNotice: string;
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
    smartInputSubmitBtn: string;
    smartInputGuideBtn: string;
    insufficientBalanceTitle: string;
    searchPlaceholder: string;
    btnNewRow: string;
    btnExportImport: string;
    btnDeleteSelected: (count: number) => string;
    colDate: string;
    colType: string;
    colCategory: string;
    colWallet: string;
    colAmount: string;
    colNote: string;
    colActions: string;
    internalTransfer: string;
    notePlaceholder: string;
    emptyRows: string;
    statusSaving: string;
    statusSaved: string;
    statusError: string;
    tooltipSave: string;
    tooltipDelete: string;
    paginationShowing: (start: number, end: number, total: number) => string;
    perPageLabel: string;
    perPageOption: string;
    pageFirst: string;
    pagePrev: string;
    pageNext: string;
    pageLast: string;
    pageCurrent: (page: number, totalPages: number) => string;
    confirmDeleteRowTitle: string;
    confirmDeleteRowDesc: string;
    defaultRowItemName: string;
    confirmDeleteBatchTitle: string;
    confirmDeleteBatchDesc: (count: number) => string;
    confirmDeleteBatchItem: (count: number) => string;
    errTransferSameWallet: string;
    errSaveGeneric: string;
    errSaveTitle: string;
    errDeleteGeneric: string;
    errDeleteTitle: string;
    errBatchDeleteGeneric: string;
  };

  // Ringkasan Page
  ringkasan: {
    metaTitle: string;
    metaDesc: string;
    heading: string;
    subheading: string;
    tabDaily: string;
    tabWeekly: string;
    tabMonthly: string;
    tabYearly: string;
    yearLabel: string;
    btnReset: string;
    totalBalanceAll: string;
    totalBalanceDesc: string;
    incomeThisPeriod: string;
    expenseThisPeriod: string;
    netSavings: string;
    netSavingsSurplus: string;
    netSavingsDeficit: string;
    txCount: (count: number) => string;
    cashflowChartTitle: (period: string) => string;
    chartIncomeLegend: string;
    chartExpenseLegend: string;
    chartInTooltip: string;
    chartOutTooltip: string;
    emptyChartData: (period: string) => string;
    slotMorning: string;
    slotAfternoon: string;
    slotEvening: string;
    slotNight: string;
    dayMon: string;
    dayTue: string;
    dayWed: string;
    dayThu: string;
    dayFri: string;
    daySat: string;
    daySun: string;
    weekPrefix: string;
    monthJan: string;
    monthFeb: string;
    monthMar: string;
    monthApr: string;
    monthMay: string;
    monthJun: string;
    monthJul: string;
    monthAug: string;
    monthSep: string;
    monthOct: string;
    monthNov: string;
    monthDec: string;
    categoryAllocationTitle: string;
    emptyCategoryExpenses: string;
    walletStatusTitle: string;
    primaryWalletBadge: string;
  };

  // Login & Register
  login: {
    metaTitle: string;
    metaDesc: string;
    backToHome: string;
    brandTagline: string;
    brandSubtagline: string;
    titleLogin: string;
    titleRegister: string;
    subtitleLogin: string;
    subtitleRegister: string;
    nameLabel: string;
    namePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    showPassword: string;
    hidePassword: string;
    btnLogin: string;
    btnRegister: string;
    processing: string;
    hasAccountPrompt: string;
    noAccountPrompt: string;
    loginLink: string;
    registerLink: string;
    errEmailPasswordReq: string;
    errFullNameReq: string;
    errPasswordMin: string;
    loginSuccess: string;
    registerSuccess: string;
    errConnection: string;
  };

  // Quick Modals (/saldo, /kantong, /kategori)
  quickModals: {
    btnSaldo: string;
    btnKantong: string;
    btnKategori: string;
    titleSaldo: string;
    titleKantong: string;
    titleKategori: string;
    totalWealth: string;
    wealthDesc: (count: number) => string;
    defaultBadge: string;
    addWallet: string;
    editWallet: string;
    walletNameLabel: string;
    walletNamePlaceholder: string;
    walletTypeLabel: string;
    cashType: string;
    bankType: string;
    ewalletType: string;
    initialBalanceLabel: string;
    btnSaveWallet: string;
    btnUpdateWallet: string;
    activeWallets: (count: number) => string;
    addCategory: string;
    editCategory: string;
    categoryNameLabel: string;
    categoryNamePlaceholder: string;
    categoryTypeLabel: string;
    expenseType: string;
    incomeType: string;
    btnSaveCategory: string;
    btnUpdateCategory: string;
    activeCategories: (count: number) => string;
    defaultCategoryBadge: string;
    errWalletNameReq: string;
    errCategoryNameReq: string;
    confirmDeleteWalletTitle: string;
    confirmDeleteWalletDesc: string;
    confirmDeleteCategoryTitle: string;
    confirmDeleteCategoryDesc: string;
  };

  // Smart Input Guide Modal
  smartInputGuide: {
    modalTitle: string;
    modalSubtitle: string;
    tipsTitle: string;
    tipsDesc: string;
    categoryDisclaimerTitle: string;
    categoryDisclaimerDesc: string;
    useExample: string;
    expenseTitle: string;
    expenseBadge: string;
    expenseDesc: string;
    ex1Note: string;
    ex2Note: string;
    ex3Note: string;
    ex4Note: string;
    incomeTitle: string;
    incomeBadge: string;
    incomeDesc: string;
    in1Note: string;
    in2Note: string;
    in3Note: string;
    transferTitle: string;
    transferBadge: string;
    transferDesc: string;
    tf1Note: string;
    tf2Note: string;
    tf3Note: string;
    atmTitle: string;
    atmBadge: string;
    atmDesc: string;
    atm1Note: string;
    atm2Note: string;
  };
}

export const idDict: Dictionary = {
  common: {
    appTitle: "Fiku • Catat Cepat, Kendalikan Keuangan Pribadi",
    appName: "Fiku",
    tagline: "Catat Cepat, Kendalikan Keuangan Pribadi",
    save: "Simpan",
    saving: "Menyimpan...",
    saved: "Tersimpan",
    cancel: "Batal",
    delete: "Hapus",
    deleting: "Menghapus...",
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
    logout: "Keluar",
    loggingOut: "Keluar...",
    confirmLogoutTitle: "Konfirmasi Keluar",
    confirmLogoutDesc: "Apakah kamu yakin ingin keluar dari akun Fiku? Sesi aktif di perangkat ini akan diakhiri.",
    confirmLogoutBtn: "Ya, Keluar",
    confirmDelete: "Konfirmasi Hapus",
    close: "Tutup",
  },
  nav: {
    transactions: "Transaksi",
    summary: "Ringkasan",
    signIn: "Masuk",
    signOut: "Keluar",
    home: "Beranda",
    navigation: "Navigasi",
    dashboard: "Dashboard",
    signInRegister: "Masuk / Daftar",
    themeLight: "Terang",
    themeDark: "Gelap",
    themeSystem: "Sistem",
    themeToggle: "Ganti Tema",
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
    heroBadge: "Cara Paling Cepat & Simpel Mencatat Keuangan",
    heroTitlePrefix: "Beres belanja, ketik sekali, ",
    heroTitleHighlight: "langsung tercatat",
    heroTitleSuffix: " rapi.",
    heroSubtitle: "Gak perlu lagi ribet ngisi form bertahap di pinggir jalan. Cukup ketik seperti chat biasa atau edit langsung di tabel spreadsheet dengan keamanan enkripsi mutlak.",
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
    mockupAutoParsed: "Terbaca Otomatis",
    mockupSaved: "Tersimpan",
    previewTitle: "Coba Langsung Pengalaman Mengatur Keuangan di Fiku",
    previewSub: "Eksplorasi tabel transaksi live spreadsheet dan ringkasan finansial di bawah ini. Coba ketik Smart Input atau edit sel data secara instan.",
    previewBadge: "Live Interactive Sandbox",
    previewTabTransactions: "Lembar Transaksi (Live)",
    previewTabSummary: "Ringkasan Finansial (Realtime)",
    previewResetBtn: "Reset Data Simulasi",
    previewResetSuccess: "Data simulasi dikembalikan ke awal",
    previewAddRowBtn: "+ Tambah Baris",
    previewSmartHint: 'Coba ketik cepat: "-35k ayam bakar bca" atau "+1jt bonus transfer"',
    previewSyncing: "Menyimpan...",
    previewSynced: "Tersinkron",
    previewDeleteConfirm: "Hapus baris ini?",
    previewSandboxNotice: "Simulasi interaktif langsung di browsermu — tanpa perlu login atau instalasi.",
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
    smartInputSubmitBtn: "Catat",
    smartInputGuideBtn: "Panduan",
    insufficientBalanceTitle: "Saldo Tidak Mencukupi",
    searchPlaceholder: "Cari transaksi (keterangan, nominal, tanggal, kategori, dompet)...",
    btnNewRow: "Baris Baru (Row)",
    btnExportImport: "Ekspor / Impor",
    btnDeleteSelected: (count: number) => `Hapus (${count}) Terpilih`,
    colDate: "Tanggal",
    colType: "Tipe",
    colCategory: "Kategori",
    colWallet: "Kantong / Dompet",
    colAmount: "Nominal (Rp)",
    colNote: "Keterangan",
    colActions: "Status / Aksi",
    internalTransfer: "Mutasi Internal",
    notePlaceholder: "Keterangan...",
    emptyRows: "Tidak ada transaksi yang cocok. Klik tombol + Baris Baru untuk mulai mencatat.",
    statusSaving: "Menyimpan otomatis...",
    statusSaved: "Tersimpan",
    statusError: "Gagal disimpan",
    tooltipSave: "Simpan baris",
    tooltipDelete: "Hapus baris",
    paginationShowing: (start: number, end: number, total: number) =>
      `Menampilkan ${start} - ${end} dari ${total} transaksi`,
    perPageLabel: "Tampilkan:",
    perPageOption: "hal",
    pageFirst: "Halaman Pertama",
    pagePrev: "Halaman Sebelumnya",
    pageNext: "Halaman Berikutnya",
    pageLast: "Halaman Terakhir",
    pageCurrent: (page: number, totalPages: number) => `Hal ${page} dari ${totalPages}`,
    confirmDeleteRowTitle: "Hapus Transaksi",
    confirmDeleteRowDesc: "Apakah kamu yakin ingin menghapus baris transaksi ini? Saldo kantong terkait akan otomatis disesuaikan kembali.",
    defaultRowItemName: "Baris Transaksi",
    confirmDeleteBatchTitle: "Hapus Transaksi Terpilih",
    confirmDeleteBatchDesc: (count: number) =>
      `Apakah kamu yakin ingin menghapus ${count} transaksi yang dipilih? Saldo seluruh kantong terkait akan otomatis disesuaikan kembali.`,
    confirmDeleteBatchItem: (count: number) => `${count} transaksi`,
    errTransferSameWallet: "Pilih kantong sumber dan tujuan yang berbeda.",
    errSaveGeneric: "Gagal menyimpan perubahan.",
    errSaveTitle: "Gagal Menyimpan Transaksi",
    errDeleteGeneric: "Gagal menghapus transaksi.",
    errDeleteTitle: "Gagal Menghapus Transaksi",
    errBatchDeleteGeneric: "Gagal menghapus transaksi terpilih.",
  },
  ringkasan: {
    metaTitle: "Ringkasan • Fiku",
    metaDesc: "Laporan dan analisis keuangan tahunan, bulanan, mingguan, dan harian",
    heading: "Ringkasan Keuangan",
    subheading: "Pantau arus kas, alokasi pengeluaran, dan tren keuangan kamu.",
    tabDaily: "Harian",
    tabWeekly: "Mingguan",
    tabMonthly: "Bulanan",
    tabYearly: "Tahunan",
    yearLabel: "Tahun",
    btnReset: "Reset",
    totalBalanceAll: "Total Saldo Semua Kantong",
    totalBalanceDesc: "Kekayaan tunai & tabungan",
    incomeThisPeriod: "Pemasukan Periode Ini",
    expenseThisPeriod: "Pengeluaran Periode Ini",
    netSavings: "Arus Kas Bersih (Net)",
    netSavingsSurplus: "Surplus (Hemat)",
    netSavingsDeficit: "Defisit (Lebih besar belanja)",
    txCount: (count: number) => `Dari ${count} transaksi`,
    cashflowChartTitle: (period: string) => `Grafik Arus Kas (${period})`,
    chartIncomeLegend: "Pemasukan",
    chartExpenseLegend: "Pengeluaran",
    chartInTooltip: "Masuk",
    chartOutTooltip: "Keluar",
    emptyChartData: (period: string) => `Belum ada data transaksi untuk ditampilkan pada grafik ${period}.`,
    slotMorning: "Pagi",
    slotAfternoon: "Siang",
    slotEvening: "Sore",
    slotNight: "Malam",
    dayMon: "Sen",
    dayTue: "Sel",
    dayWed: "Rab",
    dayThu: "Kam",
    dayFri: "Jum",
    daySat: "Sab",
    daySun: "Min",
    weekPrefix: "Mgg",
    monthJan: "Jan",
    monthFeb: "Feb",
    monthMar: "Mar",
    monthApr: "Apr",
    monthMay: "Mei",
    monthJun: "Jun",
    monthJul: "Jul",
    monthAug: "Agu",
    monthSep: "Sep",
    monthOct: "Okt",
    monthNov: "Nov",
    monthDec: "Des",
    categoryAllocationTitle: "Alokasi Pengeluaran per Kategori",
    emptyCategoryExpenses: "Belum ada pengeluaran pada periode ini.",
    walletStatusTitle: "Status Kantong & Rekening",
    primaryWalletBadge: "Dompet Utama",
  },
  login: {
    metaTitle: "Masuk • Fiku",
    metaDesc: "Masuk ke Fiku menggunakan email dan password.",
    backToHome: "Kembali ke Beranda",
    brandTagline: "Kelola Keuangan Jadi Mudah",
    brandSubtagline: "Catat transaksi secepat kilat & pantau ringkasan keuangan kamu.",
    titleLogin: "Masuk ke Fiku",
    titleRegister: "Buat Akun Baru",
    subtitleLogin: "Masuk dengan email dan password akun Fiku kamu",
    subtitleRegister: "Daftar dengan email dan password untuk mulai mengelola keuangan",
    nameLabel: "Nama Lengkap",
    namePlaceholder: "misal: Fikri Syahid",
    emailLabel: "Email",
    emailPlaceholder: "nama@email.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Minimal 6 karakter",
    showPassword: "Tampilkan",
    hidePassword: "Sembunyikan",
    btnLogin: "Masuk",
    btnRegister: "Daftar Akun",
    processing: "Memproses...",
    hasAccountPrompt: "Sudah memiliki akun?",
    noAccountPrompt: "Belum punya akun?",
    loginLink: "Masuk di sini",
    registerLink: "Daftar sekarang",
    errEmailPasswordReq: "Email dan password wajib diisi.",
    errFullNameReq: "Nama lengkap wajib diisi.",
    errPasswordMin: "Password minimal 6 karakter.",
    loginSuccess: "Login berhasil! Mengalihkan...",
    registerSuccess: "Registrasi berhasil! Mengalihkan ke dashboard...",
    errConnection: "Terjadi kesalahan koneksi. Silakan coba lagi.",
  },
  quickModals: {
    btnSaldo: "/saldo",
    btnKantong: "/kantong",
    btnKategori: "/kategori",
    titleSaldo: "Ringkasan /saldo Dompet",
    titleKantong: "Kelola /kantong (Dompet & Rekening)",
    titleKategori: "Kelola /kategori Transaksi",
    totalWealth: "Total Kekayaan Tersedia",
    wealthDesc: (count: number) => `Tersebar di ${count} dompet dan kantong keuangan`,
    defaultBadge: "Utama",
    addWallet: "Tambah Kantong Baru",
    editWallet: "Edit Kantong",
    walletNameLabel: "Nama Kantong",
    walletNamePlaceholder: "misal: BCA, Dompet Tunai",
    walletTypeLabel: "Tipe Kantong",
    cashType: "Tunai (Cash)",
    bankType: "Bank (Rekening)",
    ewalletType: "e-Wallet",
    initialBalanceLabel: "Saldo Awal",
    btnSaveWallet: "Simpan Kantong",
    btnUpdateWallet: "Perbarui Kantong",
    activeWallets: (count: number) => `Daftar Kantong Aktif (${count})`,
    addCategory: "Buat Kategori Baru",
    editCategory: "Edit Kategori",
    categoryNameLabel: "Nama Kategori",
    categoryNamePlaceholder: "misal: Belanja Bulanan",
    categoryTypeLabel: "Tipe",
    expenseType: "Pengeluaran",
    incomeType: "Pemasukan",
    btnSaveCategory: "Simpan",
    btnUpdateCategory: "Perbarui",
    activeCategories: (count: number) => `Daftar Kategori (${count})`,
    defaultCategoryBadge: "Bawaan",
    errWalletNameReq: "Nama dompet/kantong wajib diisi.",
    errCategoryNameReq: "Nama kategori wajib diisi.",
    confirmDeleteWalletTitle: "Hapus Kantong Keuangan",
    confirmDeleteWalletDesc: "Apakah kamu yakin ingin menghapus kantong ini? Tindakan ini tidak dapat dibatalkan jika kantong belum memiliki transaksi.",
    confirmDeleteCategoryTitle: "Hapus Kategori Transaksi",
    confirmDeleteCategoryDesc: "Apakah kamu yakin ingin menghapus kategori kustom ini?",
  },
  smartInputGuide: {
    modalTitle: "Panduan Smart Input",
    modalSubtitle: "Catat transaksi dalam 1 kalimat natural dengan auto-detect kategori & kantong",
    tipsTitle: "Tips Format Nominal",
    tipsDesc: "Mendukung singkatan nominal: k / rb (ribu), jt (juta). Contoh: 25k = 25.000, 1.5jt = 1.500.000.",
    categoryDisclaimerTitle: "Perhatian Auto-Detect Kategori",
    categoryDisclaimerDesc: "Smart Input berusaha menebak kategori secara cerdas dari teks yang kamu tulis, namun sewaktu-waktu tebakan bisa kurang tepat. Kamu selalu bisa mengubah kategori langsung pada tabel setelah transaksi tercatat.",
    useExample: "Gunakan ↵",
    expenseTitle: "Pengeluaran Cepat",
    expenseBadge: "Expense",
    expenseDesc: "Ketik nominal (pakai tanda - atau langsung angka), keterangan, lalu nama kantong di akhir.",
    ex1Note: "Keluar Rp 25.000 kategori Makan & Minum dari BCA",
    ex2Note: "Keluar Rp 50.000 kategori Transport dari Mandiri",
    ex3Note: "Keluar Rp 150.000 dari dompet Cash/Tunai",
    ex4Note: "Keluar Rp 1.500.000 kategori Tagihan dari BCA",
    incomeTitle: "Pemasukan Cepat",
    incomeBadge: "Income",
    incomeDesc: "Awali dengan tanda + atau gunakan kata kunci pemasukan (gaji, bonus, thr, dll).",
    in1Note: "Masuk Rp 5.000.000 kategori Gaji ke BCA",
    in2Note: "Masuk Rp 350.000 kategori Freelance ke Mandiri",
    in3Note: "Masuk Rp 100.000 kategori Hadiah ke dompet Cash",
    transferTitle: "Transfer Antar Kantong",
    transferBadge: "Transfer",
    transferDesc: "Gunakan awalan 'tf', 'transfer', atau 'pindah' dengan format asal 'ke' tujuan.",
    tf1Note: "Pindah Rp 100.000 dari BCA ke Gopay catatan 'topup'",
    tf2Note: "Pindah Rp 500.000 dari Mandiri ke Cash",
    tf3Note: "Pindah saldo Rp 50.000 dari Gopay ke OVO",
    atmTitle: "Tarik Tunai ATM",
    atmBadge: "Tarik Tunai",
    atmDesc: "Otomatis memindahkan saldo dari rekening bank pilihan ke kantong tunai/cash.",
    atm1Note: "Tarik Rp 500.000 dari Mandiri ke dompet Cash",
    atm2Note: "Tarik Rp 200.000 dari BCA ke dompet Cash",
  },
};

export const enDict: Dictionary = {
  common: {
    appTitle: "Fiku • Fast Tracking, Master Your Personal Finance",
    appName: "Fiku",
    tagline: "Fast Tracking, Master Your Personal Finance",
    save: "Save",
    saving: "Saving...",
    saved: "Saved",
    cancel: "Cancel",
    delete: "Delete",
    deleting: "Deleting...",
    loading: "Loading...",
    back: "Back",
    actions: "Actions",
    status: "Status",
    date: "Date",
    type: "Type",
    category: "Category",
    wallet: "Wallet / Account",
    amount: "Amount (IDR)",
    note: "Note",
    all: "All",
    success: "Success",
    error: "Failed",
    logout: "Sign Out",
    loggingOut: "Signing out...",
    confirmLogoutTitle: "Confirm Sign Out",
    confirmLogoutDesc: "Are you sure you want to sign out of Fiku? Your active session on this device will end.",
    confirmLogoutBtn: "Yes, Sign Out",
    confirmDelete: "Confirm Delete",
    close: "Close",
  },
  nav: {
    transactions: "Transactions",
    summary: "Summary",
    signIn: "Sign In",
    signOut: "Sign Out",
    home: "Home",
    navigation: "Navigation",
    dashboard: "Dashboard",
    signInRegister: "Sign In / Register",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    themeToggle: "Toggle Theme",
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
    cash: "Cash (Wallet)",
    bank: "Bank Account",
    ewallet: "e-Wallet (Digital)",
  },
  defaultCategories: {
    salary: "Salary & Wages",
    freelance: "Bonus & Freelance",
    investment: "Investments & Interest",
    food: "Food & Dining",
    transport: "Transportation",
    groceries: "Home & Groceries",
    bills: "Subscriptions & Utilities",
    health: "Healthcare",
    entertainment: "Entertainment & Leisure",
    education: "Education",
    installment: "Installments & Debt",
    gift: "Gifts & Grants",
  },
  landing: {
    metaTitle: "Fiku • Fast Tracking, Master Your Personal Finance",
    metaDesc: "Instant finance tracking with Smart Input and live-sync spreadsheet. End-to-end encrypted with Zero-Knowledge Security.",
    heroBadge: "The Fastest & Simplest Way to Track Money",
    heroTitlePrefix: "Spend, type once, ",
    heroTitleHighlight: "instantly tracked",
    heroTitleSuffix: " neatly.",
    heroSubtitle: "No more cumbersome multi-step forms on the street. Simply type like a casual chat or edit directly in a live spreadsheet with absolute cryptographic privacy.",
    startFree: "Get Started — Free",
    starGitHub: "Star on GitHub",
    whyChooseTitle: "Why Choose Fiku?",
    whyChooseSub: "Built for speed, convenience, and uncompromising security.",
    featureSmartTitle: "Instant Smart Input",
    featureSmartDesc: "Record expenses on the go within seconds. Simply type clean shorthand text, and the engine routes it to the right wallet.",
    featureSheetTitle: "Excel-Style Live Spreadsheet",
    featureSheetDesc: "Reviewing spending at home? Edit dates, amounts, and notes directly inside table cells with automatic formatting & debounce auto-saving.",
    featureSecurityTitle: "Zero-Knowledge Protection",
    featureSecurityDesc: "Cryptographic keys are guarded by your password combined with server secret salt. Your numbers remain completely private.",
    faqTitle: "Frequently Asked Questions",
    faqSubtitle: "Everything you need to know about Fiku's features and data protection.",
    ctaTitle: "Ready to Take Control of Your Money?",
    ctaSub: "Sign up in seconds and experience effortless finance tracking.",
    ctaBtn: "Start Using Fiku Now",
    footerDesc: "Zero-Knowledge Personal Finance Platform",
    mockupAutoParsed: "Auto Parsed",
    mockupSaved: "Saved",
    previewTitle: "Experience Fiku Live in Your Browser",
    previewSub: "Interact directly with the live spreadsheet and visual summary below. Try typing with Smart Input or editing cells on the fly.",
    previewBadge: "Interactive Live Sandbox",
    previewTabTransactions: "Transactions Sheet (Live)",
    previewTabSummary: "Financial Summary (Realtime)",
    previewResetBtn: "Reset Demo Data",
    previewResetSuccess: "Demo data restored to initial state",
    previewAddRowBtn: "+ Add Row",
    previewSmartHint: 'Try natural shorthand: "-35k chicken dinner bca" or "+1m quarterly bonus"',
    previewSyncing: "Syncing...",
    previewSynced: "Synced",
    previewDeleteConfirm: "Delete this row?",
    previewSandboxNotice: "Fully functional sandbox right here in your browser — no account required.",
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
    smartInputSubmitBtn: "Record",
    smartInputGuideBtn: "Guide",
    insufficientBalanceTitle: "Insufficient Balance",
    searchPlaceholder: "Search transactions (note, amount, date, category, wallet)...",
    btnNewRow: "New Row",
    btnExportImport: "Export / Import",
    btnDeleteSelected: (count: number) => `Delete (${count}) Selected`,
    colDate: "Date",
    colType: "Type",
    colCategory: "Category",
    colWallet: "Wallet / Account",
    colAmount: "Amount (IDR)",
    colNote: "Note",
    colActions: "Status / Actions",
    internalTransfer: "Internal Transfer",
    notePlaceholder: "Note...",
    emptyRows: "No transactions found matching your criteria. Click + New Row to begin.",
    statusSaving: "Auto-saving...",
    statusSaved: "Saved",
    statusError: "Failed to save",
    tooltipSave: "Save row",
    tooltipDelete: "Delete row",
    paginationShowing: (start: number, end: number, total: number) =>
      `Showing ${start} - ${end} of ${total} transactions`,
    perPageLabel: "Show:",
    perPageOption: "page",
    pageFirst: "First Page",
    pagePrev: "Previous Page",
    pageNext: "Next Page",
    pageLast: "Last Page",
    pageCurrent: (page: number, totalPages: number) => `Page ${page} of ${totalPages}`,
    confirmDeleteRowTitle: "Delete Transaction",
    confirmDeleteRowDesc: "Are you sure you want to delete this transaction row? Associated wallet balance will be automatically adjusted back.",
    defaultRowItemName: "Transaction Row",
    confirmDeleteBatchTitle: "Delete Selected Transactions",
    confirmDeleteBatchDesc: (count: number) =>
      `Are you sure you want to delete ${count} selected transactions? All associated wallet balances will be automatically adjusted back.`,
    confirmDeleteBatchItem: (count: number) => `${count} transactions`,
    errTransferSameWallet: "Please select different source and destination wallets.",
    errSaveGeneric: "Failed to save changes.",
    errSaveTitle: "Failed to Save Transaction",
    errDeleteGeneric: "Failed to delete transaction.",
    errDeleteTitle: "Failed to Delete Transaction",
    errBatchDeleteGeneric: "Failed to delete selected transactions.",
  },
  ringkasan: {
    metaTitle: "Summary • Fiku",
    metaDesc: "Annual, monthly, weekly, and daily financial analysis and reports",
    heading: "Financial Summary",
    subheading: "Analyze cash flow trends, category spending, and account balances.",
    tabDaily: "Daily",
    tabWeekly: "Weekly",
    tabMonthly: "Monthly",
    tabYearly: "Yearly",
    yearLabel: "Year",
    btnReset: "Reset",
    totalBalanceAll: "Net Balance Across All Wallets",
    totalBalanceDesc: "Cash holdings & savings",
    incomeThisPeriod: "Income This Period",
    expenseThisPeriod: "Expense This Period",
    netSavings: "Net Cash Flow",
    netSavingsSurplus: "Surplus (Saved)",
    netSavingsDeficit: "Deficit (Overspent)",
    txCount: (count: number) => `From ${count} transactions`,
    cashflowChartTitle: (period: string) => `Cash Flow Trend (${period})`,
    chartIncomeLegend: "Income",
    chartExpenseLegend: "Expense",
    chartInTooltip: "In",
    chartOutTooltip: "Out",
    emptyChartData: (period: string) => `No transaction data available for chart in ${period}.`,
    slotMorning: "Morning",
    slotAfternoon: "Noon",
    slotEvening: "Evening",
    slotNight: "Night",
    dayMon: "Mon",
    dayTue: "Tue",
    dayWed: "Wed",
    dayThu: "Thu",
    dayFri: "Fri",
    daySat: "Sat",
    daySun: "Sun",
    weekPrefix: "Wk",
    monthJan: "Jan",
    monthFeb: "Feb",
    monthMar: "Mar",
    monthApr: "Apr",
    monthMay: "May",
    monthJun: "Jun",
    monthJul: "Jul",
    monthAug: "Aug",
    monthSep: "Sep",
    monthOct: "Oct",
    monthNov: "Nov",
    monthDec: "Dec",
    categoryAllocationTitle: "Spending Allocation by Category",
    emptyCategoryExpenses: "No expenses recorded for this period.",
    walletStatusTitle: "Wallets & Accounts Status",
    primaryWalletBadge: "Primary Wallet",
  },
  login: {
    metaTitle: "Sign In • Fiku",
    metaDesc: "Sign in to Fiku using your email and password.",
    backToHome: "Back to Home",
    brandTagline: "Managing Finances Made Easy",
    brandSubtagline: "Record transactions in seconds & monitor your cash flow overview.",
    titleLogin: "Sign In to Fiku",
    titleRegister: "Create New Account",
    subtitleLogin: "Sign in with your Fiku account email and password",
    subtitleRegister: "Register with email and password to master your personal finance",
    nameLabel: "Full Name",
    namePlaceholder: "e.g. John Doe",
    emailLabel: "Email Address",
    emailPlaceholder: "name@example.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Minimum 6 characters",
    showPassword: "Show",
    hidePassword: "Hide",
    btnLogin: "Sign In",
    btnRegister: "Create Account",
    processing: "Processing...",
    hasAccountPrompt: "Already have an account?",
    noAccountPrompt: "Don't have an account?",
    loginLink: "Sign in here",
    registerLink: "Register now",
    errEmailPasswordReq: "Email and password are required.",
    errFullNameReq: "Full name is required.",
    errPasswordMin: "Password must be at least 6 characters.",
    loginSuccess: "Signed in successfully! Redirecting to dashboard...",
    registerSuccess: "Account created successfully! Redirecting to dashboard...",
    errConnection: "Connection error occurred. Please try again.",
  },
  quickModals: {
    btnSaldo: "/balance",
    btnKantong: "/wallets",
    btnKategori: "/categories",
    titleSaldo: "Wallet /balance Summary",
    titleKantong: "Manage /wallets (Cash & Bank Accounts)",
    titleKategori: "Manage Transaction /categories",
    totalWealth: "Total Available Wealth",
    wealthDesc: (count: number) => `Distributed across ${count} wallets and bank accounts`,
    defaultBadge: "Default",
    addWallet: "Add New Wallet",
    editWallet: "Edit Wallet",
    walletNameLabel: "Wallet Name",
    walletNamePlaceholder: "e.g. Chase Bank, Pocket Cash",
    walletTypeLabel: "Wallet Type",
    cashType: "Cash (Wallet)",
    bankType: "Bank Account",
    ewalletType: "e-Wallet",
    initialBalanceLabel: "Initial Balance",
    btnSaveWallet: "Save Wallet",
    btnUpdateWallet: "Update Wallet",
    activeWallets: (count: number) => `Active Wallets (${count})`,
    addCategory: "Create New Category",
    editCategory: "Edit Category",
    categoryNameLabel: "Category Name",
    categoryNamePlaceholder: "e.g. Monthly Groceries",
    categoryTypeLabel: "Type",
    expenseType: "Expense",
    incomeType: "Income",
    btnSaveCategory: "Save",
    btnUpdateCategory: "Update",
    activeCategories: (count: number) => `Categories List (${count})`,
    defaultCategoryBadge: "Default",
    errWalletNameReq: "Wallet name is required.",
    errCategoryNameReq: "Category name is required.",
    confirmDeleteWalletTitle: "Delete Wallet",
    confirmDeleteWalletDesc: "Are you sure you want to delete this wallet? This action cannot be undone if the wallet contains no transactions.",
    confirmDeleteCategoryTitle: "Delete Category",
    confirmDeleteCategoryDesc: "Are you sure you want to delete this custom category?",
  },
  smartInputGuide: {
    modalTitle: "Smart Input Guide",
    modalSubtitle: "Record transactions in 1 natural sentence with auto-detected categories & wallets",
    tipsTitle: "Amount Format Shorthand",
    tipsDesc: "Supports shorthand multipliers: k (thousand), jt/m (million). Example: 25k = 25,000, 1.5m = 1,500,000.",
    categoryDisclaimerTitle: "Category Auto-Detection Note",
    categoryDisclaimerDesc: "Smart Input uses smart matching to guess the category from your input, but it might occasionally guess incorrectly. You can easily adjust the category anytime in the table afterwards.",
    useExample: "Use ↵",
    expenseTitle: "Quick Expense",
    expenseBadge: "Expense",
    expenseDesc: "Type amount (use - or number), note description, and wallet name at the end.",
    ex1Note: "Expense Rp 25,000 category Food & Dining from BCA",
    ex2Note: "Expense Rp 50,000 category Transport from Mandiri",
    ex3Note: "Expense Rp 150,000 from Cash wallet",
    ex4Note: "Expense Rp 1,500,000 category Bills from BCA",
    incomeTitle: "Quick Income",
    incomeBadge: "Income",
    incomeDesc: "Start with + or income keywords (salary, bonus, grant, etc).",
    in1Note: "Income Rp 5,000,000 category Salary into BCA",
    in2Note: "Income Rp 350,000 category Freelance into Mandiri",
    in3Note: "Income Rp 100,000 category Gift into Cash wallet",
    transferTitle: "Wallet Transfer",
    transferBadge: "Transfer",
    transferDesc: "Use prefix 'tf', 'transfer', or 'move' with source 'to' destination format.",
    tf1Note: "Move Rp 100,000 from BCA to Gopay with note 'topup'",
    tf2Note: "Move Rp 500,000 from Mandiri to Cash",
    tf3Note: "Move balance Rp 50,000 from Gopay to OVO",
    atmTitle: "ATM Cash Withdrawal",
    atmBadge: "Cash Withdrawal",
    atmDesc: "Automatically moves funds from selected bank account into cash wallet.",
    atm1Note: "Withdraw Rp 500,000 from Mandiri to Cash wallet",
    atm2Note: "Withdraw Rp 200,000 from BCA to Cash wallet",
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
