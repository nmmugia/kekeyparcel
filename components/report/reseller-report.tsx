"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { LoadingOverlay } from "@/components/loading-spinner"
import html2canvas from "html2canvas"
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Share2,
  Calendar,
  Camera,
  CheckSquare,
  Square,
  Send,
  X,
} from "lucide-react"

interface Transaction {
  id: string
  packageName: string
  packageDescription: string | null
  customerName: string
  pricePerWeek: number
  tenor: number
  isEligibleBonus: boolean
  resellerId: string
  resellerName: string
  resellerEmail: string
  createdAt: string
  payments: Payment[]
  deletionRequests?: DeletionRequest[]
}

interface Payment {
  id: string
  amount: number
  status: string
  weekNumbers: number[]
  createdAt: string
}

interface DeletionRequest {
  id: string
  status: string
  reason: string
  adminNote: string | null
  createdAt: string
}

interface TransactionWithPaymentStatus extends Transaction {
  confirmedAmount: number
  processingAmount: number
  remainingAmount: number
}

interface ResellerReportProps {
  userId: string
  userName: string
}

export default function ResellerReport({ userId, userName }: ResellerReportProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split("T")[0]
  })
  const [transactions, setTransactions] = useState<TransactionWithPaymentStatus[]>([])
  const [allTransactions, setAllTransactions] = useState<TransactionWithPaymentStatus[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState("")
  const [selectedTransactionForDelete, setSelectedTransactionForDelete] = useState<string | null>(null)
  const [selectedForShare, setSelectedForShare] = useState<Set<string>>(new Set())
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [showAllDates, setShowAllDates] = useState(false)
  const transactionRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const { toast } = useToast()

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/reseller-report?resellerId=${userId}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()

      const processed = data.map((t: Transaction) => {
        const confirmedPayments = t.payments.filter((p) => p.status === "confirmed")
        const processingPayments = t.payments.filter((p) => p.status === "process")
        const confirmedAmount = confirmedPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
        const processingAmount = processingPayments.reduce((sum: number, p: Payment) => sum + p.amount, 0)
        return {
          ...t,
          confirmedAmount,
          processingAmount,
          remainingAmount: t.pricePerWeek * t.tenor - confirmedAmount - processingAmount,
        }
      })

      setAllTransactions(processed)
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat memuat data transaksi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [userId, toast])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // Filter transactions by selected date
  useEffect(() => {
    if (showAllDates) {
      setTransactions(allTransactions)
    } else {
      const filtered = allTransactions.filter((t) => {
        const transDate = new Date(t.createdAt).toISOString().split("T")[0]
        return transDate === selectedDate
      })
      setTransactions(filtered)
    }
  }, [selectedDate, allTransactions, showAllDates])

  // Calculate totals for filtered transactions
  const totalTransactions = transactions.length
  const totalAmount = transactions.reduce((sum, t) => sum + t.pricePerWeek * t.tenor, 0)
  const totalConfirmed = transactions.reduce((sum, t) => sum + t.confirmedAmount, 0)
  const totalProcessing = transactions.reduce((sum, t) => sum + t.processingAmount, 0)
  const totalRemaining = transactions.reduce((sum, t) => sum + t.remainingAmount, 0)

  // Handle deletion request
  const handleRequestDelete = (transactionId: string) => {
    setSelectedTransactionForDelete(transactionId)
    setDeleteReason("")
    setDeleteDialogOpen(true)
  }

  const submitDeleteRequest = async () => {
    if (!selectedTransactionForDelete || !deleteReason.trim()) return

    setIsDeleting(true)
    try {
      const response = await fetch("/api/deletion-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionId: selectedTransactionForDelete,
          reason: deleteReason,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create deletion request")
      }

      toast({
        title: "Permintaan hapus terkirim",
        description: "Permintaan hapus transaksi telah dikirim ke admin untuk persetujuan",
      })

      setDeleteDialogOpen(false)
      fetchTransactions()
    } catch (error: any) {
      toast({
        title: "Gagal mengirim permintaan",
        description: error.message || "Terjadi kesalahan saat mengirim permintaan hapus",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Handle share to WhatsApp
  const handleShareSingle = async (transactionId: string) => {
    const el = transactionRefs.current[transactionId]
    if (!el) return

    setIsSharing(true)
    try {
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#FFFFFF",
        logging: false,
        useCORS: true,
      })

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), "image/png", 0.95)
      })

      const file = new File([blob], `transaksi-${transactionId}.png`, { type: "image/png" })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Detail Transaksi",
          text: "Detail transaksi paket",
          files: [file],
        })
      } else {
        // Fallback: download then open WhatsApp
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `transaksi-${transactionId}.png`
        link.click()

        window.open("https://wa.me/?text=Detail%20transaksi%20paket", "_blank")
      }

      toast({
        title: "Berhasil",
        description: "Screenshot transaksi siap dibagikan",
      })
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Gagal membagikan",
        description: "Terjadi kesalahan saat membuat screenshot",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  // Handle multi-select share
  const toggleSelection = (id: string) => {
    setSelectedForShare((prev) => {
      const updated = new Set(prev)
      if (updated.has(id)) {
        updated.delete(id)
      } else {
        updated.add(id)
      }
      return updated
    })
  }

  const handleShareMultiple = async () => {
    if (selectedForShare.size === 0) return

    setIsSharing(true)
    try {
      const files: File[] = []

      for (const transactionId of selectedForShare) {
        const el = transactionRefs.current[transactionId]
        if (!el) continue

        const canvas = await html2canvas(el, {
          scale: 2,
          backgroundColor: "#FFFFFF",
          logging: false,
          useCORS: true,
        })

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), "image/png", 0.95)
        })

        files.push(new File([blob], `transaksi-${transactionId}.png`, { type: "image/png" }))
      }

      if (navigator.share && navigator.canShare({ files })) {
        await navigator.share({
          title: "Detail Transaksi",
          text: `${files.length} transaksi`,
          files,
        })
      } else {
        // Fallback: download all then open WhatsApp
        for (const file of files) {
          const link = document.createElement("a")
          link.href = URL.createObjectURL(file)
          link.download = file.name
          link.click()
          // Small delay between downloads
          await new Promise((r) => setTimeout(r, 300))
        }

        window.open("https://wa.me/?text=Detail%20transaksi%20paket", "_blank")
      }

      toast({
        title: "Berhasil",
        description: `${files.length} screenshot transaksi siap dibagikan`,
      })

      setSelectedForShare(new Set())
      setIsMultiSelectMode(false)
    } catch (error) {
      console.error("Error sharing multiple:", error)
      toast({
        title: "Gagal membagikan",
        description: "Terjadi kesalahan saat membuat screenshot",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  const getDeletionStatus = (transaction: TransactionWithPaymentStatus) => {
    if (!transaction.deletionRequests || transaction.deletionRequests.length === 0) return null
    const pending = transaction.deletionRequests.find((d) => d.status === "pending")
    if (pending) return "pending"
    const rejected = transaction.deletionRequests.find((d) => d.status === "rejected")
    if (rejected) return "rejected"
    return null
  }

  return (
    <div className="space-y-6">
      {(isSharing || isDeleting) && <LoadingOverlay />}

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-pink-500" />
              <span className="font-medium text-gray-700">Filter Tanggal:</span>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value)
                  setShowAllDates(false)
                }}
                className="w-auto"
                disabled={showAllDates}
              />
              <Button
                variant={showAllDates ? "default" : "outline"}
                size="sm"
                onClick={() => setShowAllDates(!showAllDates)}
                className={showAllDates ? "bg-pink-500 hover:bg-pink-600" : ""}
              >
                {showAllDates ? "Semua Tanggal" : "Tampilkan Semua"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Total Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-pink-600">{totalTransactions}</p>
            <p className="text-xs text-gray-500 mt-1">{formatCurrency(totalAmount)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Dikonfirmasi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-green-600">{formatCurrency(totalConfirmed)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Diproses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{formatCurrency(totalProcessing)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base">Belum Dibayar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl sm:text-2xl font-bold text-gray-600">{formatCurrency(totalRemaining)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Multi-select toolbar */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={isMultiSelectMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsMultiSelectMode(!isMultiSelectMode)
                  setSelectedForShare(new Set())
                }}
                className={isMultiSelectMode ? "bg-pink-500 hover:bg-pink-600" : ""}
              >
                {isMultiSelectMode ? (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    Batal Pilih
                  </>
                ) : (
                  <>
                    <CheckSquare className="h-4 w-4 mr-1" />
                    Pilih & Kirim WA
                  </>
                )}
              </Button>

              {isMultiSelectMode && (
                <span className="text-sm text-gray-500">
                  {selectedForShare.size} dipilih
                </span>
              )}
            </div>

            {isMultiSelectMode && selectedForShare.size > 0 && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={handleShareMultiple}
                disabled={isSharing}
              >
                <Send className="h-4 w-4 mr-1" />
                Kirim {selectedForShare.size} ke WA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Daftar Transaksi
            {!showAllDates && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({formatDate(selectedDate)})
              </span>
            )}
          </CardTitle>
          <CardDescription>
            {totalTransactions} transaksi {!showAllDates ? `pada tanggal ${formatDate(selectedDate)}` : "semua tanggal"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-500">
                {!showAllDates
                  ? `Tidak ada transaksi pada tanggal ${formatDate(selectedDate)}`
                  : "Belum ada transaksi"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => {
                const deletionStatus = getDeletionStatus(transaction)

                return (
                  <div key={transaction.id} className="relative">
                    {/* Multi-select checkbox */}
                    {isMultiSelectMode && (
                      <button
                        onClick={() => toggleSelection(transaction.id)}
                        className="absolute -left-1 top-2 z-10 p-1 rounded-full bg-white shadow-md border"
                      >
                        {selectedForShare.has(transaction.id) ? (
                          <CheckSquare className="h-5 w-5 text-pink-600" />
                        ) : (
                          <Square className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    )}

                    {/* Transaction card (capturable) */}
                    <div
                      ref={(el) => { transactionRefs.current[transaction.id] = el }}
                      className={`bg-white border rounded-lg p-4 transition-all ${
                        isMultiSelectMode ? "ml-6" : ""
                      } ${
                        selectedForShare.has(transaction.id)
                          ? "border-pink-400 ring-2 ring-pink-200"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Top row: package name + status */}
                      <div className="flex justify-between items-start">
                        <Link href={`/transaction/${transaction.id}`} className="flex-1">
                          <h3 className="font-semibold text-gray-800">{transaction.packageName}</h3>
                          <p className="text-sm text-gray-600 mt-1">Pelanggan: {transaction.customerName}</p>
                        </Link>

                        <div className="flex items-center gap-1">
                          {transaction.confirmedAmount > 0 ? (
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span className="text-xs">Dikonfirmasi</span>
                            </div>
                          ) : transaction.processingAmount > 0 ? (
                            <div className="flex items-center text-yellow-600">
                              <Clock className="h-4 w-4 mr-1" />
                              <span className="text-xs">Diproses</span>
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-500">
                              <AlertCircle className="h-4 w-4 mr-1" />
                              <span className="text-xs">Belum Bayar</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Payment info */}
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-medium">{formatCurrency(transaction.pricePerWeek * transaction.tenor)}</p>
                        </div>

                        {transaction.confirmedAmount > 0 && (
                          <div>
                            <p className="text-xs text-gray-500">Dikonfirmasi</p>
                            <p className="font-medium text-green-600">
                              {formatCurrency(transaction.confirmedAmount)}
                            </p>
                          </div>
                        )}

                        {transaction.processingAmount > 0 && (
                          <div>
                            <p className="text-xs text-gray-500">Diproses</p>
                            <p className="font-medium text-yellow-600">
                              {formatCurrency(transaction.processingAmount)}
                            </p>
                          </div>
                        )}

                        {transaction.remainingAmount > 0 && (
                          <div>
                            <p className="text-xs text-gray-500">Sisa</p>
                            <p className="font-medium text-gray-600">
                              {formatCurrency(transaction.remainingAmount)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-gray-500 flex justify-between">
                        <span>Tanggal: {formatDate(transaction.createdAt)}</span>
                        <span>{transaction.tenor} Minggu</span>
                      </div>

                      {/* Deletion status banner */}
                      {deletionStatus === "pending" && (
                        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                          <p className="text-xs text-yellow-700 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Menunggu persetujuan admin untuk penghapusan
                          </p>
                        </div>
                      )}
                      {deletionStatus === "rejected" && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
                          <p className="text-xs text-red-700 flex items-center">
                            <X className="h-3 w-3 mr-1" />
                            Permintaan hapus ditolak admin
                          </p>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="mt-3 pt-3 border-t flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Share single */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault()
                              handleShareSingle(transaction.id)
                            }}
                            disabled={isSharing}
                            className="text-xs"
                          >
                            <Camera className="h-3 w-3 mr-1" />
                            Screenshot & WA
                          </Button>
                        </div>

                        {/* Delete request */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            handleRequestDelete(transaction.id)
                          }}
                          disabled={deletionStatus === "pending"}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          {deletionStatus === "pending" ? "Menunggu Approval" : "Minta Hapus"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Request Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permintaan Hapus Transaksi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Permintaan hapus ini akan dikirim ke admin untuk disetujui. Transaksi tidak akan langsung dihapus.
            </p>
            <div>
              <label className="text-sm font-medium text-gray-700">Alasan penghapusan *</label>
              <textarea
                className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-pink-500 focus:border-pink-500"
                rows={3}
                placeholder="Jelaskan alasan mengapa transaksi ini perlu dihapus..."
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={submitDeleteRequest}
              disabled={!deleteReason.trim() || isDeleting}
            >
              {isDeleting ? "Mengirim..." : "Kirim Permintaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
