"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { Download, Upload, FileSpreadsheet, X, AlertCircle, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { importTransactionsBatch, getAllUserTransactionsForExport } from "@/app/actions/transactions";

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  familyId?: string | null;
  transactions?: any[];
  accounts: any[];
  categories: any[];
  onSuccess: () => Promise<void>;
}

export function ExportImportModal({
  isOpen,
  onClose,
  userId,
  familyId,
  transactions = [],
  accounts,
  categories,
  onSuccess,
}: ExportImportModalProps) {
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");
  const [exportRange, setExportRange] = useState<"all" | "this_month" | "last_month" | "this_year">("this_month");
  const [isExporting, setIsExporting] = useState(false);
  
  // Import state
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape & backdrop
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  // EXPORT HANDLER
  async function handleExport() {
    setIsExporting(true);
    try {
      let sourceTransactions = transactions;
      if (!sourceTransactions || sourceTransactions.length === 0) {
        sourceTransactions = await getAllUserTransactionsForExport(userId);
      }

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth(); // 0-indexed

      const filtered = sourceTransactions.filter((tx) => {
        if (exportRange === "all") return true;
        const d = new Date(tx.transactionDate);
        if (exportRange === "this_year") {
          return d.getFullYear() === currentYear;
        }
        if (exportRange === "this_month") {
          return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        }
        if (exportRange === "last_month") {
          const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
          return (
            d.getFullYear() === lastMonthDate.getFullYear() &&
            d.getMonth() === lastMonthDate.getMonth()
          );
        }
        return true;
      });

      const exportRows = filtered.map((tx) => {
        const acc = accounts.find((a) => a.id === tx.accountId)?.name || "";
        const toAcc = tx.toAccountId
          ? accounts.find((a) => a.id === tx.toAccountId)?.name || ""
          : "";
        const cat = tx.categoryId
          ? categories.find((c) => c.id === tx.categoryId)?.name || ""
          : "";

        return {
          Tanggal: tx.transactionDate,
          Tipe: tx.type === "income" ? "Pemasukan" : tx.type === "expense" ? "Pengeluaran" : "Transfer",
          Kategori: cat,
          Kantong: acc,
          "Kantong Tujuan": toAcc,
          Nominal: parseFloat(tx.amount || "0"),
          Keterangan: tx.note || "",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transaksi");

      const rangeLabel =
        exportRange === "this_month"
          ? "bulan_ini"
          : exportRange === "last_month"
          ? "bulan_lalu"
          : exportRange === "this_year"
          ? `tahun_${currentYear}`
          : "semua";

      XLSX.writeFile(workbook, `fana_transaksi_${rangeLabel}.xlsx`);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  }

  // DOWNLOAD TEMPLATE
  function handleDownloadTemplate() {
    const sampleRows = [
      {
        Tanggal: new Date().toISOString().split("T")[0],
        Tipe: "Pengeluaran",
        Kategori: categories.find((c) => c.type === "expense")?.name || "Makanan",
        Kantong: accounts[0]?.name || "Dompet Utama",
        "Kantong Tujuan": "",
        Nominal: 25000,
        Keterangan: "Makan siang",
      },
      {
        Tanggal: new Date().toISOString().split("T")[0],
        Tipe: "Pemasukan",
        Kategori: categories.find((c) => c.type === "income")?.name || "Gaji",
        Kantong: accounts[0]?.name || "Bank BCA",
        "Kantong Tujuan": "",
        Nominal: 5000000,
        Keterangan: "Gaji bulanan",
      },
      {
        Tanggal: new Date().toISOString().split("T")[0],
        Tipe: "Transfer",
        Kategori: "",
        Kantong: accounts[0]?.name || "Bank BCA",
        "Kantong Tujuan": accounts[1]?.name || accounts[0]?.name || "Dompet Tunai",
        Nominal: 100000,
        Keterangan: "Tarik tunai ATM",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "fiku_template_transaksi.xlsx");
  }

  // FILE PARSER FOR IMPORT
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    setParsingError(null);
    setSuccessMessage(null);
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json<any>(ws);

        if (!data || data.length === 0) {
          setParsingError("File Excel kosong atau tidak terbaca.");
          setPreviewData([]);
          return;
        }

        // Validate and map columns
        const mapped = data.map((row, idx) => {
          const rawType = (row["Tipe"] || row["tipe"] || "").toString().toLowerCase().trim();
          let type: "income" | "expense" | "transfer" = "expense";
          if (rawType.includes("pemasukan") || rawType.includes("masuk") || rawType === "income") {
            type = "income";
          } else if (rawType.includes("transfer") || rawType.includes("tf")) {
            type = "transfer";
          }

          const rawDate = row["Tanggal"] || row["tanggal"];
          let dateStr = new Date().toISOString().split("T")[0];
          if (rawDate) {
            if (typeof rawDate === "number") {
              // Excel date serial number
              const jsDate = new Date((rawDate - 25569) * 86400 * 1000);
              dateStr = jsDate.toISOString().split("T")[0];
            } else {
              const parsed = new Date(rawDate);
              if (!isNaN(parsed.getTime())) {
                dateStr = parsed.toISOString().split("T")[0];
              }
            }
          }

          const rawAmount = row["Nominal"] || row["nominal"] || row["Jumlah"] || row["jumlah"] || 0;
          const amount = typeof rawAmount === "number" ? rawAmount : parseFloat(String(rawAmount).replace(/[^0-9.]/g, "")) || 0;

          const accName = (row["Kantong"] || row["kantong"] || row["Akun"] || "").toString().trim().toLowerCase();
          const targetAcc = accounts.find((a) => a.name.toLowerCase() === accName) || accounts[0];

          const toAccName = (row["Kantong Tujuan"] || row["kantong tujuan"] || "").toString().trim().toLowerCase();
          const toTargetAcc = accounts.find((a) => a.name.toLowerCase() === toAccName);

          const catName = (row["Kategori"] || row["kategori"] || "").toString().trim().toLowerCase();
          const targetCat = categories.find((c) => c.name.toLowerCase() === catName && c.type === type);

          return {
            rowNumber: idx + 2,
            transactionDate: dateStr,
            type,
            accountId: targetAcc?.id,
            accountName: targetAcc?.name || "Tidak valid",
            toAccountId: toTargetAcc?.id,
            toAccountName: toTargetAcc?.name || (type === "transfer" ? "Tidak valid" : ""),
            categoryId: targetCat?.id || null,
            categoryName: targetCat?.name || "-",
            amount,
            note: (row["Keterangan"] || row["keterangan"] || row["Catatan"] || "").toString().trim(),
          };
        });

        setPreviewData(mapped);
      } catch (err: any) {
        setParsingError(err.message || "Gagal membaca format file.");
        setPreviewData([]);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  }

  // PROCESS IMPORT
  async function handleProcessImport() {
    if (previewData.length === 0) return;

    setIsSubmitting(true);
    setParsingError(null);
    setSuccessMessage(null);

    try {
      const recordsToImport = previewData.map((p) => ({
        transactionDate: p.transactionDate,
        type: p.type,
        accountId: p.accountId,
        toAccountId: p.toAccountId || null,
        categoryId: p.categoryId || null,
        amount: p.amount,
        note: p.note,
      }));

      const res = await importTransactionsBatch(userId, familyId, recordsToImport);
      setSuccessMessage(`Berhasil mengimpor ${res.count} transaksi!`);
      setFile(null);
      setPreviewData([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      await onSuccess();
    } catch (err: any) {
      setParsingError(err.message || "Gagal mengimpor transaksi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Ekspor & Impor Excel
              </h2>
              <p className="text-xs text-zinc-500">
                Unduh riwayat transaksi atau unggah file Excel untuk input massal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl my-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab("export");
              setParsingError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "export"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Download className="w-3.5 h-3.5" /> Ekspor Excel
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("import");
              setParsingError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "import"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            }`}
          >
            <Upload className="w-3.5 h-3.5" /> Impor Excel
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {activeTab === "export" ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                  Pilih Rentang Waktu:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "this_month", label: "Bulan Ini" },
                    { id: "last_month", label: "Bulan Lalu" },
                    { id: "this_year", label: "Tahun Ini" },
                    { id: "all", label: "Semua Transaksi" },
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setExportRange(r.id as any)}
                      className={`py-2 px-3 text-xs rounded-xl border text-left font-medium transition-all ${
                        exportRange === r.id
                          ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200/60 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
                <p className="font-semibold text-zinc-700 dark:text-zinc-300">Format Kolom Excel:</p>
                <p>Tanggal, Tipe, Kategori, Kantong, Kantong Tujuan, Nominal, Keterangan</p>
              </div>

              <Button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Mengunduh...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-1.5" /> Unduh File Excel (.xlsx)
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Download Template Banner */}
              <div className="flex items-center justify-between p-3.5 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
                <div className="text-xs">
                  <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Template Excel Fiku
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Gunakan template ini agar nama kolom dan data sesuai
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="h-8 text-xs font-semibold border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50 rounded-lg"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> Unduh Template
                </Button>
              </div>

              {/* Upload Input */}
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5 block">
                  Pilih File Excel (.xlsx / .xls):
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-zinc-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-100 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-200 hover:file:bg-zinc-200 dark:hover:file:bg-zinc-700 cursor-pointer border border-zinc-200 dark:border-zinc-800 rounded-xl p-1"
                />
              </div>

              {/* Status messages */}
              {parsingError && (
                <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{parsingError}</span>
                </div>
              )}

              {successMessage && (
                <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Preview */}
              {previewData.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Preview Data ({previewData.length} baris):
                  </p>
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        <tr>
                          <th className="p-2">Tgl</th>
                          <th className="p-2">Tipe</th>
                          <th className="p-2">Kantong</th>
                          <th className="p-2">Nominal</th>
                          <th className="p-2">Ket</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-mono">
                        {previewData.slice(0, 5).map((row, i) => (
                          <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                            <td className="p-2">{row.transactionDate}</td>
                            <td className="p-2">{row.type}</td>
                            <td className="p-2">
                              {row.accountName}
                              {row.type === "transfer" && ` ➔ ${row.toAccountName}`}
                            </td>
                            <td className="p-2 font-bold">
                              Rp {row.amount.toLocaleString("id-ID")}
                            </td>
                            <td className="p-2 font-sans">{row.note || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {previewData.length > 5 && (
                    <p className="text-[10px] text-zinc-400 italic text-center">
                      ...dan {previewData.length - 5} baris lainnya
                    </p>
                  )}

                  <Button
                    type="button"
                    onClick={handleProcessImport}
                    disabled={isSubmitting}
                    className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs mt-2"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin mr-1.5" />
                    ) : (
                      <Upload className="w-4 h-4 mr-1.5" />
                    )}
                    {isSubmitting
                      ? "Mengimpor Data..."
                      : `Impor Sekarang (${previewData.length} Data)`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
