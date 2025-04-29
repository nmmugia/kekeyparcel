"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Transaction, Payment, PaymentMethod, Package } from "@prisma/client"
import { ArrowLeft, Plus, Check, X, Calendar, Clock, FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle,DialogFooter } from "@/components/ui/dialog"
import { LoadingOverlay } from "@/components/loading-spinner"
import PaymentForm from "@/components/payment/payment-form"
import PaymentCard from "@/components/payment/payment-card"
import SharePaymentStatus from "@/components/transaction/share-payment-status"
// Import the new mobile payment form
import MobilePaymentForm from "@/components/payment/mobile-payment-form"
import { useIsMobile } from "@/hooks/use-mobile" // Make sure this hook exists

interface TransactionDetailProps {
  transaction: Transaction & {
    payments: Payment[]
  }
  paymentMethods: PaymentMethod[]
  isAdmin: boolean
  userId: string
  userName: string
  userEmail: string
}

export default function TransactionDetail({
  transaction,
  paymentMethods,
  isAdmin,
  userId,
  userName,
  userEmail,
}: TransactionDetailProps) {
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Calculate paid weeks
  const paidWeeks = new Set<number>()
  transaction.payments.forEach((payment) => {
    if (payment.status === "confirmed") {
      payment.weekNumbers.forEach((week) => paidWeeks.add(week))
    }
  })

  // Calculate total amount paid
  const totalPaid = transaction.payments
    .filter((payment) => payment.status === "confirmed")
    .reduce((sum, payment) => sum + payment.amount, 0)

  // Calculate total amount
  const totalAmount = transaction.pricePerWeek * transaction.tenor

  // Calculate remaining amount
  const remainingAmount = totalAmount - totalPaid

  // Calculate progress percentage
  const progressPercentage = (paidWeeks.size / transaction.tenor) * 100

  // Group payments by status
  const paymentsByStatus = {
    process: transaction.payments.filter((payment) => payment.status === "process"),
    confirmed: transaction.payments.filter((payment) => payment.status === "confirmed"),
    rejected: transaction.payments.filter((payment) => payment.status === "rejected"),
  }

  const paymentScheduleRef = useRef<HTMLDivElement>(null)

  // Inside the component, add:
  const isMobile = useIsMobile()
  
  // Handle transaction deletion
  const handleDeleteTransaction = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete transaction")
      }

      toast({
        title: "Transaksi berhasil dihapus",
        description: "Transaksi telah dihapus dari sistem",
      })

      router.push(`/member/${transaction.resellerId}/transactions`)
      router.refresh()
    } catch (error) {
      toast({
        title: "Gagal menghapus transaksi",
        description: "Terjadi kesalahan saat menghapus transaksi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }


  return (
    <>
      {isLoading && <LoadingOverlay />}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link href="/transaction" className="mr-4">
                <ArrowLeft className="h-5 w-5 text-gray-700" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">Detail Transaksi</h1>
            </div>

            {/* Add delete button for admin */}
            {isAdmin && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="flex items-center"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus Transaksi
              </Button>
            )}
          </div>

          <div className="space-y-6">
            {/* Package Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-2">{transaction.packageName}</h2>
              <p className="text-gray-600 text-sm mb-4">{transaction.packageDescription || "Tidak ada deskripsi"}</p>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-500">Harga per Minggu</p>
                  <p className="font-semibold text-pink-600">{formatCurrency(transaction.pricePerWeek)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tenor</p>
                  <p className="font-semibold">{transaction.tenor} Minggu</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-semibold">{formatCurrency(totalAmount)}</p>
                </div>
              </div>
            </div>
            <div ref={paymentScheduleRef}>
            {/* Customer Info */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Informasi Pelanggan</h2>
              <p className="text-gray-700">Nama: {transaction.customerName}</p>
              <p className="text-gray-700">Tanggal Daftar: {formatDate(transaction.createdAt)}</p>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              {transaction.isEligibleBonus ? <span className="text-green-600">Berhak Bonus</span> : <span>Tidak dapat Bonus</span>}
            </div>
            {/* Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Progress Pembayaran</h2>
                <span className="text-sm font-medium">
                  {paidWeeks.size}/{transaction.tenor} Minggu
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-pink-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Total Dibayar</p>
                  <p className="font-semibold text-pink-600">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Sisa Pembayaran</p>
                  <p className="font-semibold text-pink-600">{formatCurrency(remainingAmount)}</p>
                </div>
              </div>
            </div>

            {/* Payment Schedule */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Jadwal Pembayaran</h2>

                {!isAdmin && (
                  <SharePaymentStatus customerName={transaction.customerName} transactionId={transaction.id} paymentStatusRef={paymentScheduleRef} />
                )}
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                  {Array.from({ length: transaction.tenor }, (_, i) => i + 1).map((week) => (
                    <div
                      key={week}
                      className={`p-2 rounded-md text-center ${
                        paidWeeks.has(week)
                          ? "bg-pink-100 text-gray-800 border border-pink-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      <Calendar className="h-4 w-4 mx-auto mb-1" />
                      <span className="text-xs">{week}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            </div>
              <Button className="mt-4 bg-pink-500 hover:bg-pink-600" onClick={() => setIsPaymentDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Pembayaran
              </Button>
          </div>
        </div>
      </div>

      {/* Payment Dialog - Desktop or Mobile version based on device */}
      {isMobile ? (
        <MobilePaymentForm
          isOpen={isPaymentDialogOpen}
          onOpenChange={setIsPaymentDialogOpen}
          transaction={transaction}
          paymentMethods={paymentMethods}
          paidWeeks={paidWeeks}
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          onSuccess={() => {
            setIsPaymentDialogOpen(false)
            router.refresh()
          }}
        />
      ) : (
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Pembayaran</DialogTitle>
            </DialogHeader>

            <PaymentForm
              transaction={transaction}
              paymentMethods={paymentMethods}
              paidWeeks={paidWeeks}
              userId={userId}
              userName={userName}
              userEmail={userEmail}
              onSuccess={() => {
                setIsPaymentDialogOpen(false)
                router.refresh()
              }}
            />
          </DialogContent>
        </Dialog>
      )}
      

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Transaksi</DialogTitle>
          </DialogHeader>
          <p>
            Apakah Anda yakin ingin menghapus transaksi ini? Semua data pembayaran terkait juga akan dihapus. Tindakan
            ini tidak dapat dibatalkan.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDeleteTransaction}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

