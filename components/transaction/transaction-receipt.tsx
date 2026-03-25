"use client"

import { forwardRef } from "react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Calendar } from "lucide-react"

interface TransactionReceiptProps {
  transaction: {
    id: string
    packageName: string
    packageDescription: string | null
    customerName: string
    pricePerWeek: number
    tenor: number
    isEligibleBonus: boolean
    createdAt: string
    payments: {
      id: string
      amount: number
      status: string
      weekNumbers: number[]
    }[]
  }
}

const TransactionReceipt = forwardRef<HTMLDivElement, TransactionReceiptProps>(
  ({ transaction }, ref) => {
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

    return (
      <div ref={ref} className="bg-white p-6 space-y-6" style={{ width: "420px" }}>
        {/* Package Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">{transaction.packageName}</h2>
          <p className="text-gray-600 text-sm mb-4">
            {transaction.packageDescription || "Tidak ada deskripsi"}
          </p>

          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Harga per Minggu</p>
              <p className="font-semibold text-pink-600">
                {formatCurrency(transaction.pricePerWeek)}
              </p>
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
          <p className="text-gray-700">
            Tanggal Daftar: {formatDate(transaction.createdAt)}
          </p>
        </div>
        <div className="text-xs text-gray-500">
          {transaction.isEligibleBonus ? (
            <span className="text-green-600">Berhak Bonus</span>
          ) : (
            <span>Tidak dapat Bonus</span>
          )}
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
            <div
              className="bg-pink-500 h-2.5 rounded-full"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Total Dibayar</p>
              <p className="font-semibold text-pink-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">Sisa Pembayaran</p>
              <p className="font-semibold text-pink-600">
                {formatCurrency(remainingAmount)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Schedule */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Jadwal Pembayaran</h2>
          <div className="bg-white p-4 rounded-lg border">
            <div className="grid grid-cols-6 gap-2">
              {Array.from({ length: transaction.tenor }, (_, i) => i + 1).map(
                (week) => (
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
                )
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }
)

TransactionReceipt.displayName = "TransactionReceipt"

export default TransactionReceipt
