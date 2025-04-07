"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Transaction, Payment, PaymentMethod } from "@prisma/client"
import { ArrowLeft, Plus, Check, X, Calendar, Clock, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingOverlay } from "@/components/loading-spinner"
import PaymentForm from "@/components/payment/payment-form"
import PaymentCard from "@/components/payment/payment-card"

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

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link href="/transaction" className="mr-4">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>

            <h1 className="text-2xl font-bold text-gray-800">Detail Transaksi</h1>
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

            {/* Customer Info */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Informasi Pelanggan</h2>
              <p className="text-gray-700">Nama: {transaction.customerName}</p>
              <p className="text-gray-700">Tanggal Daftar: {formatDate(transaction.createdAt)}</p>
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
                  <p className="font-semibold text-green-600">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Sisa Pembayaran</p>
                  <p className="font-semibold text-pink-600">{formatCurrency(remainingAmount)}</p>
                </div>
              </div>
            </div>

            {/* Payments */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Riwayat Pembayaran</h2>

                {!isAdmin && paidWeeks.size < transaction.tenor && (
                  <Button
                    size="sm"
                    className="bg-pink-500 hover:bg-pink-600"
                    onClick={() => setIsPaymentDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pembayaran
                  </Button>
                )}
              </div>

              {transaction.payments.length > 0 ? (
                <div className="space-y-6">
                  {/* Pending Payments */}
                  {paymentsByStatus.process.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium mb-2 flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-yellow-500" />
                        Menunggu Konfirmasi
                      </h3>
                      <div className="space-y-3">
                        {paymentsByStatus.process.map((payment) => (
                          <PaymentCard key={payment.id} payment={payment} isAdmin={isAdmin} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Confirmed Payments */}
                  {paymentsByStatus.confirmed.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium mb-2 flex items-center">
                        <Check className="h-4 w-4 mr-2 text-green-500" />
                        Pembayaran Dikonfirmasi
                      </h3>
                      <div className="space-y-3">
                        {paymentsByStatus.confirmed.map((payment) => (
                          <PaymentCard key={payment.id} payment={payment} isAdmin={isAdmin} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Rejected Payments */}
                  {paymentsByStatus.rejected.length > 0 && (
                    <div>
                      <h3 className="text-md font-medium mb-2 flex items-center">
                        <X className="h-4 w-4 mr-2 text-red-500" />
                        Pembayaran Ditolak
                      </h3>
                      <div className="space-y-3">
                        {paymentsByStatus.rejected.map((payment) => (
                          <PaymentCard key={payment.id} payment={payment} isAdmin={isAdmin} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <FileText className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Belum ada riwayat pembayaran</p>

                  {!isAdmin && (
                    <Button className="mt-4 bg-pink-500 hover:bg-pink-600" onClick={() => setIsPaymentDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Pembayaran
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Payment Schedule */}
            <div>
              <h2 className="text-lg font-semibold mb-4">Jadwal Pembayaran</h2>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-12 gap-2">
                {Array.from({ length: transaction.tenor }, (_, i) => i + 1).map((week) => (
                  <div
                    key={week}
                    className={`p-2 rounded-md text-center ${
                      paidWeeks.has(week)
                        ? "bg-green-100 text-green-800 border border-green-200"
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
      </div>

      {/* Payment Dialog */}
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
    </>
  )
}

