"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"

interface Transaction {
  id: string
  packageName: string
  customerName: string
  pricePerWeek: number
  tenor: number
  createdAt: string
  payments: any[]
}

interface TransactionWithPaymentStatus extends Transaction {
  confirmedAmount: number
  processingAmount: number
  remainingAmount: number
}

interface ReportSummaryProps {
  noPaymentTransactions: Transaction[]
  transactionsWithPayment: TransactionWithPaymentStatus[]
  totalNoPayment: number
}

export default function ReportSummary({
  noPaymentTransactions,
  transactionsWithPayment,
  totalNoPayment,
}: ReportSummaryProps) {
  const [activeTab, setActiveTab] = useState("all")

  // Calculate totals
  const totalConfirmed = transactionsWithPayment.reduce((sum, t) => sum + t.confirmedAmount, 0)
  const totalProcessing = transactionsWithPayment.reduce((sum, t) => sum + t.processingAmount, 0)
  const totalRemaining = transactionsWithPayment.reduce((sum, t) => sum + t.remainingAmount, 0)

  const grandTotal = totalNoPayment + totalConfirmed + totalProcessing + totalRemaining

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Pendapatan</CardTitle>
            <CardDescription>Semua transaksi</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-pink-600">{formatCurrency(grandTotal)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {noPaymentTransactions.length + transactionsWithPayment.length} Transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pembayaran Dikonfirmasi</CardTitle>
            <CardDescription>Sudah diterima</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totalConfirmed)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {transactionsWithPayment.filter((t) => t.confirmedAmount > 0).length} Transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pembayaran Diproses</CardTitle>
            <CardDescription>Menunggu konfirmasi</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totalProcessing)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {transactionsWithPayment.filter((t) => t.processingAmount > 0).length} Transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Belum Dibayar</CardTitle>
            <CardDescription>Semua transaksi</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">{formatCurrency(totalNoPayment + totalRemaining)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {noPaymentTransactions.length + transactionsWithPayment.filter((t) => t.remainingAmount > 0).length}{" "}
              Transaksi
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi</CardTitle>
          <CardDescription>Ringkasan semua transaksi</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="nopayment">Belum Bayar</TabsTrigger>
              <TabsTrigger value="processing">Diproses</TabsTrigger>
              <TabsTrigger value="confirmed">Dikonfirmasi</TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="all" className="space-y-4">
                {noPaymentTransactions.length === 0 && transactionsWithPayment.length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">Belum ada transaksi</p>
                  </div>
                ) : (
                  <>
                    {noPaymentTransactions.map((transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        status="nopayment"
                        confirmedAmount={0}
                        processingAmount={0}
                        remainingAmount={transaction.pricePerWeek * transaction.tenor}
                      />
                    ))}

                    {transactionsWithPayment.map((transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        status={
                          transaction.confirmedAmount > 0
                            ? "confirmed"
                            : transaction.processingAmount > 0
                              ? "processing"
                              : "nopayment"
                        }
                        confirmedAmount={transaction.confirmedAmount}
                        processingAmount={transaction.processingAmount}
                        remainingAmount={transaction.remainingAmount}
                      />
                    ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="nopayment" className="space-y-4">
                {noPaymentTransactions.length === 0 &&
                transactionsWithPayment.filter(
                  (t) => t.remainingAmount > 0 && t.confirmedAmount === 0 && t.processingAmount === 0,
                ).length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">Tidak ada transaksi yang belum dibayar</p>
                  </div>
                ) : (
                  <>
                    {noPaymentTransactions.map((transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        status="nopayment"
                        confirmedAmount={0}
                        processingAmount={0}
                        remainingAmount={transaction.pricePerWeek * transaction.tenor}
                      />
                    ))}

                    {transactionsWithPayment
                      .filter((t) => t.remainingAmount > 0 && t.confirmedAmount === 0 && t.processingAmount === 0)
                      .map((transaction) => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          status="nopayment"
                          confirmedAmount={transaction.confirmedAmount}
                          processingAmount={transaction.processingAmount}
                          remainingAmount={transaction.remainingAmount}
                        />
                      ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="processing" className="space-y-4">
                {transactionsWithPayment.filter((t) => t.processingAmount > 0).length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">Tidak ada transaksi yang sedang diproses</p>
                  </div>
                ) : (
                  <>
                    {transactionsWithPayment
                      .filter((t) => t.processingAmount > 0)
                      .map((transaction) => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          status="processing"
                          confirmedAmount={transaction.confirmedAmount}
                          processingAmount={transaction.processingAmount}
                          remainingAmount={transaction.remainingAmount}
                        />
                      ))}
                  </>
                )}
              </TabsContent>

              <TabsContent value="confirmed" className="space-y-4">
                {transactionsWithPayment.filter((t) => t.confirmedAmount > 0).length === 0 ? (
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">Tidak ada transaksi yang sudah dikonfirmasi</p>
                  </div>
                ) : (
                  <>
                    {transactionsWithPayment
                      .filter((t) => t.confirmedAmount > 0)
                      .map((transaction) => (
                        <TransactionCard
                          key={transaction.id}
                          transaction={transaction}
                          status="confirmed"
                          confirmedAmount={transaction.confirmedAmount}
                          processingAmount={transaction.processingAmount}
                          remainingAmount={transaction.remainingAmount}
                        />
                      ))}
                  </>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface TransactionCardProps {
  transaction: Transaction
  status: "nopayment" | "processing" | "confirmed"
  confirmedAmount: number
  processingAmount: number
  remainingAmount: number
}

function TransactionCard({
  transaction,
  status,
  confirmedAmount,
  processingAmount,
  remainingAmount,
}: TransactionCardProps) {
  const totalAmount = transaction.pricePerWeek * transaction.tenor

  return (
    <Link
      href={`/transaction/${transaction.id}`}
      className="block bg-white border rounded-lg p-4 hover:border-pink-200 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-800">{transaction.packageName}</h3>
          <p className="text-sm text-gray-600 mt-1">Pelanggan: {transaction.customerName}</p>
        </div>

        <div className="flex items-center">
          {status === "nopayment" && (
            <div className="flex items-center text-gray-500">
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Belum Bayar</span>
            </div>
          )}

          {status === "processing" && (
            <div className="flex items-center text-yellow-600">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-sm">Diproses</span>
            </div>
          )}

          {status === "confirmed" && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Dikonfirmasi</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <p className="text-xs text-gray-500">Total</p>
          <p className="font-medium">{formatCurrency(totalAmount)}</p>
        </div>

        {confirmedAmount > 0 && (
          <div>
            <p className="text-xs text-gray-500">Dikonfirmasi</p>
            <p className="font-medium text-green-600">{formatCurrency(confirmedAmount)}</p>
          </div>
        )}

        {processingAmount > 0 && (
          <div>
            <p className="text-xs text-gray-500">Diproses</p>
            <p className="font-medium text-yellow-600">{formatCurrency(processingAmount)}</p>
          </div>
        )}

        {remainingAmount > 0 && (
          <div>
            <p className="text-xs text-gray-500">Sisa</p>
            <p className="font-medium text-gray-600">{formatCurrency(remainingAmount)}</p>
          </div>
        )}
      </div>

      <div className="mt-3 text-xs text-gray-500 flex justify-between">
        <span>Tanggal: {formatDate(transaction.createdAt)}</span>
        <span>{transaction.tenor} Minggu</span>
      </div>
    </Link>
  )
}

