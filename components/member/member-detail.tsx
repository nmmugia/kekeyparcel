"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { User, Transaction, Payment } from "@prisma/client"
import { ArrowLeft, Edit, Trash2, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { LoadingOverlay } from "@/components/loading-spinner"
import { formatCurrency, formatDate } from "@/lib/utils"

interface MemberDetailProps {
  user: User & {
    _count: {
      transactions: number
    }
    transactions: (Transaction & {
      payments: Payment[]
    })[]
  }
}

export default function MemberDetail({ user }: MemberDetailProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      toast({
        title: "Reseller berhasil dihapus",
        description: "Data reseller telah dihapus dari sistem",
      })

      router.push("/member")
      router.refresh()
    } catch (error) {
      toast({
        title: "Gagal menghapus reseller",
        description: "Terjadi kesalahan saat menghapus reseller",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleResetPassword = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}/reset-password`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to reset password")
      }

      const data = await response.json()

      toast({
        title: "Kata sandi berhasil direset",
        description: `Kata sandi baru: ${data.newPassword}`,
      })

      setIsResetPasswordDialogOpen(false)
    } catch (error) {
      toast({
        title: "Gagal mereset kata sandi",
        description: "Terjadi kesalahan saat mereset kata sandi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate total amount from confirmed payments
  const calculateTotalAmount = (transactions: (Transaction & { payments: Payment[] })[]) => {
    return transactions.reduce((total, transaction) => {
      const confirmedPayments = transaction.payments.filter((payment) => payment.status === "confirmed")
      return total + confirmedPayments.reduce((sum, payment) => sum + payment.amount, 0)
    }, 0)
  }

  const totalAmount = calculateTotalAmount(user.transactions)

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/member" className="mr-4">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Detail Reseller</h1>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => setIsResetPasswordDialogOpen(true)}>
              Reset Kata Sandi
            </Button>
            <Link href={`/member/edit/${user.id}`}>
              <Button size="sm" variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>
            <Button size="sm" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informasi Reseller</CardTitle>
            <CardDescription>Detail informasi reseller</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Nama</h3>
                <p className="mt-1">{user.name}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1">{user.email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tanggal Bergabung</h3>
                <p className="mt-1">{formatDate(user.createdAt)}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Transaksi</h3>
                <p className="mt-1">{user._count.transactions} Transaksi</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ringkasan Transaksi</CardTitle>
            <CardDescription>Ringkasan transaksi reseller</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-pink-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-pink-700">Total Transaksi</h3>
                <p className="mt-1 text-2xl font-bold text-pink-600">{user._count.transactions}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-700">Total Pembayaran</h3>
                <p className="mt-1 text-2xl font-bold text-green-600">{formatCurrency(totalAmount)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-700">Transaksi Terakhir</h3>
                <p className="mt-1 text-lg font-medium text-blue-600">
                  {user.transactions.length > 0 ? formatDate(user.transactions[0].createdAt) : "Belum ada transaksi"}
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-6">Transaksi Terbaru</h3>

            {user.transactions.length > 0 ? (
              <div className="space-y-3">
                {user.transactions.map((transaction) => {
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

                      <div className="mt-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs text-gray-500">Progress Pembayaran</span>
                          <span className="text-xs font-medium">
                            {paidWeeks.size}/{transaction.tenor} Minggu
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-pink-500 h-2 rounded-full"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </Link>
                  )
                })}

                <div className="flex justify-center mt-4">
                  <Link href={`/member/${user.id}/transactions`}>
                    <Button variant="outline">Lihat Semua Transaksi</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500">Belum ada transaksi</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Reseller</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menghapus reseller ini? Tindakan ini tidak dapat dibatalkan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Kata Sandi</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin mereset kata sandi untuk reseller ini? Kata sandi baru akan diberikan.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleResetPassword}>Reset Kata Sandi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

