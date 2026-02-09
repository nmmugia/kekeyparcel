"use client"

import Link from "next/link"
import type { User, Transaction, Payment } from "@prisma/client"
import { Users, Package, FileText, CreditCard, Clock, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import StatsCard from "@/components/dashboard/stats-card"
import StatusBadge from "@/components/status-badge"
import UserAvatar from "@/components/user-avatar"
import FadeIn from "@/components/animations/fade-in"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { TransactionListSkeleton } from "@/components/skeletons/transaction-skeleton"
import { PaymentListSkeleton } from "@/components/skeletons/payment-skeleton"

interface AdminDashboardProps {
  stats: {
    resellerCount: number
    packageCount: number
    transactionCount: number
    totalPayments: number
  }
  recentTransactions: (Transaction & {
    payments: Payment[]
  })[]
  pendingPayments: (Payment & {
    transaction: Transaction
  })[]
  topResellers: (User & {
    _count: {
      transactions: number
    }
    totalAmount: number
  })[]
  loading?: boolean
}

export default function AdminDashboard({
  stats,
  recentTransactions,
  pendingPayments,
  topResellers,
  loading = false,
}: AdminDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Reseller"
          value={stats.resellerCount}
          description="Total reseller terdaftar"
          icon={Users}
          iconColor="text-pink-600"
          iconBgColor="bg-pink-100"
          loading={loading}
          delay={0.1}
        />

        <StatsCard
          title="Paket"
          value={stats.packageCount}
          description="Total paket tersedia"
          icon={Package}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
          loading={loading}
          delay={0.2}
        />

        <StatsCard
          title="Transaksi"
          value={stats.transactionCount}
          description="Total transaksi"
          icon={FileText}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
          loading={loading}
          delay={0.3}
        />

        <StatsCard
          title="Pembayaran"
          value={formatCurrency(stats.totalPayments)}
          description="Total pembayaran"
          icon={CreditCard}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
          loading={loading}
          delay={0.4}
        />
      </div>

      {pendingPayments.length > 0 && (
        <FadeIn delay={0.2}>
          <Alert variant="warning" className="mb-6">
            <AlertTitle>Pembayaran Menunggu Konfirmasi</AlertTitle>
            <AlertDescription>
              Terdapat {pendingPayments.length} pembayaran yang menunggu konfirmasi Anda.
              <Link href="/transaction?status=process">
                <Button variant="outline" size="sm" className="ml-4">
                  Lihat Semua
                </Button>
              </Link>
            </AlertDescription>
          </Alert>
        </FadeIn>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Transaksi Terbaru</CardTitle>
                <CardDescription>5 transaksi terbaru dalam sistem</CardDescription>
              </div>
              <Link href="/transaction">
                <Button variant="outline" size="sm">
                  Lihat Semua
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <TransactionListSkeleton count={3} />
            ) : recentTransactions.length > 0 ? (
              <div className="space-y-4">
                {recentTransactions.map((transaction, index) => {
                  // Calculate paid weeks
                  const paidWeeks = new Set<number>()
                  transaction.payments.forEach((payment) => {
                    if (payment.status === "confirmed") {
                      payment.weekNumbers.forEach((week) => paidWeeks.add(week))
                    }
                  })

                  // Calculate progress percentage
                  const progressPercentage = (paidWeeks.size / transaction.tenor) * 100

                  return (
                    <FadeIn key={transaction.id} delay={0.1 * index}>
                      <Link
                        href={`/transaction/${transaction.id}`}
                        className="block bg-white border rounded-lg p-3 hover:border-pink-200 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-gray-800">{transaction.packageName}</h4>
                            <div className="flex items-center mt-1">
                              <span className="text-sm text-gray-600 mr-2">Pelanggan:</span>
                              <span className="text-sm font-medium">{transaction.customerName}</span>
                            </div>
                            <div className="flex items-center mt-1">
                              <span className="text-sm text-gray-600 mr-2">Reseller:</span>
                              <div className="flex items-center">
                                <UserAvatar name={transaction.resellerName} size="sm" showTooltip={false} />
                                <span className="text-sm ml-2">{transaction.resellerName}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</div>
                        </div>

                        <div className="mt-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">Progress</span>
                            <span className="text-xs font-medium">
                              {paidWeeks.size}/{transaction.tenor} Minggu
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-pink-500 h-1.5 rounded-full transition-all duration-500 ease-in-out"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      </Link>
                    </FadeIn>
                  )
                })}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-gray-500">Belum ada transaksi</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Pembayaran Menunggu Konfirmasi</CardTitle>
                <CardDescription>Pembayaran yang perlu dikonfirmasi</CardDescription>
              </div>
              <Link href="/transaction?status=process">
                <Button variant="outline" size="sm">
                  Lihat Semua
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <PaymentListSkeleton count={3} />
            ) : pendingPayments.length > 0 ? (
              <div className="space-y-4">
                {pendingPayments.map((payment, index) => (
                  <FadeIn key={payment.id} delay={0.1 * index}>
                    <Link
                      href={`/payment/${payment.id}`}
                      className="block bg-white border rounded-lg p-3 hover:border-pink-200 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-gray-800">{payment.transaction.packageName}</h4>
                          <div className="flex items-center mt-1">
                            <span className="text-sm text-gray-600 mr-2">Pelanggan:</span>
                            <span className="text-sm font-medium">{payment.transaction.customerName}</span>
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="text-sm text-gray-600 mr-2">Reseller:</span>
                            <div className="flex items-center">
                              <UserAvatar name={payment.resellerName} size="sm" showTooltip={false} />
                              <span className="text-sm ml-2">{payment.resellerName}</span>
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={payment.status} />
                      </div>

                      <div className="mt-2 flex justify-between items-center">
                        <div className="text-pink-600 font-medium">{formatCurrency(payment.amount)}</div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(payment.createdAt)}
                        </div>
                      </div>
                    </Link>
                  </FadeIn>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-gray-500">Tidak ada pembayaran yang menunggu konfirmasi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Resellers */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Top Reseller</CardTitle>
              <CardDescription>Reseller dengan performa terbaik</CardDescription>
            </div>
            <Link href="/member">
              <Button variant="outline" size="sm">
                Lihat Semua Reseller
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : topResellers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Nama</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-right py-3 px-4">Transaksi</th>
                    <th className="text-right py-3 px-4">Total Pembayaran</th>
                    <th className="text-center py-3 px-4">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {topResellers.map((reseller, index) => (
                    <tr key={reseller.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <UserAvatar name={reseller.name} size="sm" />
                          <span className="ml-2">{reseller.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{reseller.email}</td>
                      <td className="py-3 px-4 text-right">{reseller._count.transactions}</td>
                      <td className="py-3 px-4 text-right font-medium text-pink-600">
                        {formatCurrency(reseller.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Link href={`/member/${reseller.id}`}>
                          <Button size="sm" variant="outline">
                            Detail
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-500">Belum ada reseller</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

