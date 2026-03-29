"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, formatDate } from "@/lib/utils"
import { AlertCircle, CheckCircle, Clock } from "lucide-react"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"

import { LoadingSpinner } from "@/components/loading-spinner"

interface ReportSummaryProps {
  totals: {
    grandTotal: number
    totalConfirmed: number
    totalProcessing: number
    totalRemaining: number
    counts: {
      total: number
      confirmed: number
      processing: number
      unpaid: number
    }
  }
}

export default function ReportSummary({ totals }: ReportSummaryProps) {
  const [activeTab, setActiveTab] = useState("all")
  const [transactions, setTransactions] = useState<any[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  const { targetRef, isIntersecting } = useIntersectionObserver()

  useEffect(() => {
    setTransactions([])
    setPage(1)
    setHasMore(true)
    fetchTransactions(1, true)
  }, [activeTab])

  useEffect(() => {
    if (isIntersecting && !isLoading && !isLoadingMore && hasMore) {
      setPage((prev) => {
        const next = prev + 1
        fetchTransactions(next, false)
        return next
      })
    }
  }, [isIntersecting])

  const fetchTransactions = async (targetPage: number, isNew: boolean) => {
    if (isNew) setIsLoading(true)
    else setIsLoadingMore(true)

    try {
      const res = await fetch(`/api/reports/transactions?status=${activeTab}&page=${targetPage}`)
      const data = await res.json()
      setTransactions(prev => isNew ? data.transactions : [...prev, ...data.transactions])
      setHasMore(data.hasMore)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

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
            <p className="text-2xl font-bold text-pink-600">{formatCurrency(totals.grandTotal)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {totals.counts.total} Transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pembayaran Dikonfirmasi</CardTitle>
            <CardDescription>Sudah diterima</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalConfirmed)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {totals.counts.confirmed} Transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pembayaran Diproses</CardTitle>
            <CardDescription>Menunggu konfirmasi</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{formatCurrency(totals.totalProcessing)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {totals.counts.processing} Transaksi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Belum Dibayar</CardTitle>
            <CardDescription>Semua transaksi</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gray-600">{formatCurrency(totals.totalRemaining)}</p>
            <p className="text-sm text-gray-500 mt-1">
              {totals.counts.unpaid} Transaksi
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
              {['all', 'nopayment', 'processing', 'confirmed'].map((statusValue) => (
                <TabsContent key={statusValue} value={statusValue} className="space-y-4">
                  {isLoading ? (
                    <div className="py-10 flex justify-center"><LoadingSpinner /></div>
                  ) : transactions.length === 0 ? (
                    <div className="bg-gray-50 p-6 rounded-lg text-center">
                      <p className="text-gray-500">Tidak ada transaksi yang cocok</p>
                    </div>
                  ) : (
                    <>
                      {transactions.map((t) => (
                        <TransactionCard
                          key={t.id}
                          transaction={t}
                          status={t.computedStatus}
                          confirmedAmount={t.confirmedAmount}
                          processingAmount={t.processingAmount}
                          remainingAmount={t.remainingAmount}
                        />
                      ))}
                      
                      {hasMore && (
                        <div ref={targetRef as any} className="py-4 flex justify-center mt-4">
                          {isLoadingMore ? <LoadingSpinner /> : <span className="text-sm text-gray-400">Loading ke bawah...</span>}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              ))}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

interface TransactionCardProps {
  transaction: any
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

