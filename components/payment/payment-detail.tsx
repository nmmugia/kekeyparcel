"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Payment, Transaction, PaymentMethod } from "@prisma/client"
import { ArrowLeft, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { LoadingOverlay } from "@/components/loading-spinner"

interface PaymentDetailProps {
  payment: Payment & {
    transaction: Transaction
  }
  isAdmin: boolean
  paymentMethod: PaymentMethod
}

export default function PaymentDetail({ payment, isAdmin, paymentMethod }: PaymentDetailProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionNote, setRejectionNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleConfirmPayment = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/payments/${payment.id}/confirm`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to confirm payment")
      }

      toast({
        title: "Pembayaran dikonfirmasi",
        description: "Pembayaran telah berhasil dikonfirmasi",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Gagal mengkonfirmasi pembayaran",
        description: "Terjadi kesalahan saat mengkonfirmasi pembayaran",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsConfirmDialogOpen(false)
    }
  }

  const handleRejectPayment = async () => {
    if (!rejectionNote.trim()) {
      toast({
        title: "Catatan diperlukan",
        description: "Berikan alasan penolakan pembayaran",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/payments/${payment.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ note: rejectionNote }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject payment")
      }

      toast({
        title: "Pembayaran ditolak",
        description: "Pembayaran telah ditolak",
      })

      router.refresh()
    } catch (error) {
      toast({
        title: "Gagal menolak pembayaran",
        description: "Terjadi kesalahan saat menolak pembayaran",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsRejectDialogOpen(false)
    }
  }

  const getStatusBadge = () => {
    switch (payment.status) {
      case "process":
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Proses</span>
      case "confirmed":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Dikonfirmasi</span>
        )
      case "rejected":
        return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Ditolak</span>
      default:
        return null
    }
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Link href={`/transaction/${payment.transactionId}`} className="mr-4">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>

            <h1 className="text-2xl font-bold text-gray-800">Detail Pembayaran</h1>
          </div>

          <div className="space-y-6">
            {/* Status */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Status</h2>
              {getStatusBadge()}
            </div>

            {/* Payment Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Informasi Pembayaran</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Jumlah</p>
                  <p className="font-semibold text-pink-600">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Minggu</p>
                  <p className="font-semibold">{payment.weekNumbers.join(", ")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Metode Pembayaran</p>
                  <p className="font-semibold">
                    {paymentMethod.type}
                    {paymentMethod.name && ` - ${paymentMethod.name}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal</p>
                  <p className="font-semibold">{formatDateTime(payment.createdAt)}</p>
                </div>
              </div>

              {payment.note && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Catatan</p>
                  <p className="mt-1 p-2 bg-white rounded border border-gray-200">{payment.note}</p>
                </div>
              )}
            </div>

            {/* Package Info */}
            <div>
              <h2 className="text-lg font-semibold mb-2">Informasi Paket</h2>
              <Link
                href={`/transaction/${payment.transactionId}`}
                className="block bg-white border rounded-lg p-4 hover:border-pink-200 transition-colors"
              >
                <h3 className="font-semibold text-gray-800">{payment.transaction.packageName}</h3>
                <p className="text-sm text-gray-600 mt-1">Pelanggan: {payment.transaction.customerName}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-500">
                    {formatCurrency(payment.transaction.pricePerWeek)}/Minggu
                  </span>
                  <span className="text-sm text-gray-500">{payment.transaction.tenor} Minggu</span>
                </div>
              </Link>
            </div>

            {/* Proof Image */}
            {payment.proofImage && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Bukti Pembayaran</h2>
                <div
                  className="relative h-48 bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setIsImageModalOpen(true)}
                >
                  <Image
                    src={payment.proofImage || "/placeholder.svg"}
                    alt="Bukti Pembayaran"
                    fill
                    className="object-contain"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-2 text-sm">
                    Klik untuk memperbesar
                  </div>
                </div>
              </div>
            )}

            {/* Admin Actions */}
            {isAdmin && payment.status === "process" && (
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  variant="outline"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => setIsRejectDialogOpen(true)}
                >
                  <X className="h-4 w-4 mr-2" />
                  Tolak Pembayaran
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsConfirmDialogOpen(true)}>
                  <Check className="h-4 w-4 mr-2" />
                  Konfirmasi Pembayaran
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bukti Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="relative h-[70vh]">
            {payment.proofImage ? (
              <Image
                src={payment.proofImage || "/placeholder.svg"}
                alt="Bukti Pembayaran"
                fill
                className="object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <span className="text-gray-400">Tidak ada bukti pembayaran</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Pembayaran</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin mengkonfirmasi pembayaran ini?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Batal
            </Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirmPayment}>
              Konfirmasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Pembayaran</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Berikan alasan penolakan pembayaran ini:</p>
            <Textarea
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
              placeholder="Alasan penolakan..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleRejectPayment}>
              Tolak Pembayaran
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

