"use client"

import { useState } from "react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { Package, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface Payment {
  id: string
  weekNumbers: number[]
  status: string
}

interface Transaction {
  id: string
  packageName: string
  customerName: string
  pricePerWeek: number
  tenor: number
  payments: Payment[]
}

interface MyPackagesListProps {
  transactions: Transaction[]
  customerCount: number
}

export default function MyPackagesList({ transactions, customerCount }: MyPackagesListProps) {
  
  const [searchTerm, setSearchTerm] = useState("")

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
  )
  if (transactions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">Anda belum memiliki paket</p>
        <Link
          href="/home"
          className="mt-4 inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
        >
          Lihat Paket
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative mb-6">
        Jumlah Transaksi: {customerCount}
      </div>
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          placeholder="Cari nama paket atau pelanggan..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      {filteredTransactions.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">Tidak ada paket yang sesuai dengan pencarian</p>
        </div>
      ) : (
      filteredTransactions.map((transaction) => {
        // Calculate paid weeks
        const paidWeeks = new Set<number>()
        transaction.payments.forEach((payment) => {
          if (payment.status === "confirmed") {
            payment.weekNumbers.forEach((week) => paidWeeks.add(week))
          }
        })

        return (
          <Link
            key={transaction.id}
            href={`/transaction/${transaction.id}`}
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
          >
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-800">{transaction.packageName}</h3>
                  <p className="text-sm text-gray-600">Pelanggan: {transaction.customerName}</p>
                </div>

                <div className="flex items-center">
                  <Package className="h-6 w-6 text-pink-500" />
                </div>
              </div>

              <div className="mt-3 flex justify-between items-center">
                <div className="text-pink-600 font-medium">{formatCurrency(transaction.pricePerWeek)}/Minggu</div>

                <div className="text-sm text-gray-500">{transaction.tenor} Minggu</div>
              </div>

              <div className="mt-3 bg-gray-50 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Progress Pembayaran:</span>
                  <span className="text-xs font-medium">
                    {paidWeeks.size}/{transaction.tenor} Minggu
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-1">
                  <div
                    className="bg-pink-500 h-2.5 rounded-full"
                    style={{ width: `${(paidWeeks.size / transaction.tenor) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </Link>
        )
      })
    )}
    </div>
  )
}

