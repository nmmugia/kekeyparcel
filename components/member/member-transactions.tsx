"use client"

import Link from "next/link"
import type { Transaction, Payment } from "@prisma/client"
import { ArrowLeft, Package } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface MemberTransactionsProps {
  user: {
    id: string
    name: string
    email: string
  }
  transactions: (Transaction & {
    payments: Payment[]
  })[]
}

export default function MemberTransactions({ user, transactions }: MemberTransactionsProps) {
  // Calculate total amount from confirmed payments
  const calculateTotalAmount = (transactions: (Transaction & { payments: Payment[] })[]) => {
    return transactions.reduce((total, transaction) => {
      return total + transaction.payments.reduce((sum, payment) => sum + payment.amount, 0)
    }, 0)
  }

  const totalAmount = calculateTotalAmount(transactions)

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Link href={`/member/${user.id}`} className="mr-4">
          <ArrowLeft className="h-5 w-5 text-gray-700" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Transaksi {user.name}</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">{user.name}</h2>
            <p className="text-gray-600">{user.email}</p>
          </div>

          <div className="mt-4 md:mt-0">
            <div className="bg-pink-50 p-3 rounded-lg">
              <p className="text-sm text-pink-700">Total Pembayaran</p>
              <p className="text-xl font-bold text-pink-600">{formatCurrency(totalAmount)}</p>
            </div>
          </div>
        </div>

        <h3 className="text-lg font-semibold mb-4">Daftar Transaksi</h3>

        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((transaction) => {
              // Calculate paid weeks
              const paidWeeks = new Set<number>()
              transaction.payments.forEach((payment) => {
                payment.weekNumbers.forEach((week) => paidWeeks.add(week))
              })

              // Calculate progress percentage
              const progressPercentage = (paidWeeks.size / transaction.tenor) * 100

              // Calculate total paid amount
              const paidAmount = transaction.payments.reduce((sum, payment) => sum + payment.amount, 0)

              return (
                <Link
                  key={transaction.id}
                  href={`/transaction/${transaction.id}`}
                  className="block bg-white border rounded-lg p-4 hover:border-pink-200 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-gray-800">{transaction.packageName}</h4>
                      <p className="text-sm text-gray-600 mt-1">Pelanggan: {transaction.customerName}</p>
                    </div>
                    <div className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Harga per Minggu</p>
                      <p className="font-medium">{formatCurrency(transaction.pricePerWeek)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Tenor</p>
                      <p className="font-medium">{transaction.tenor} Minggu</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Dibayar</p>
                      <p className="font-medium text-green-600">{formatCurrency(paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Sisa Pembayaran</p>
                      <p className="font-medium text-pink-600">
                        {formatCurrency(transaction.pricePerWeek * transaction.tenor - paidAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500">Progress Pembayaran</span>
                      <span className="text-xs font-medium">
                        {paidWeeks.size}/{transaction.tenor} Minggu
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-pink-500 h-2 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="bg-gray-50 p-6 rounded-lg text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">Belum ada transaksi</p>
          </div>
        )}
      </div>
    </div>
  )
}

