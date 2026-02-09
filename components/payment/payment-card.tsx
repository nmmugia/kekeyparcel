"use client"

import { useState } from "react"
import Image from "next/image"
import type { Payment } from "@prisma/client"
import { Check, X, FileText } from "lucide-react"
import { formatCurrency, formatDateTime } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/loading-spinner"

interface PaymentCardProps {
  payment: Payment
  isAdmin: boolean
}

export default function PaymentCard({ payment, isAdmin }: PaymentCardProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [rejectionNote, setRejectionNote] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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

      // Reload the page to reflect changes
      window.location.reload()
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

      // Reload the page to reflect changes
      window.location.reload()
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
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-medium">{formatCurrency(payment.amount)}</span>
              {getStatusBadge()}
            </div>

            <p className="text-sm text-gray-600">Minggu: {payment.weekNumbers.join(", ")}</p>
            <p className="text-sm text-gray-600">
              Metode: {payment.paymentMethod}
              {payment.bankName && ` - ${payment.bankName}`}
            </p>
            <p className="text-sm text-gray-600">Tanggal: {formatDateTime(payment.createdAt)}</p>

            {payment.note && <p className="text-sm text-gray-600 mt-2">Catatan: {payment.note}</p>}
          </div>

          {payment.proofImage && (
            <button onClick={() => setIsImageModalOpen(true)} className="flex items-center text-pink-600 text-sm">
              <FileText className="h-4 w-4 mr-1" />
              Bukti
            </button>
          )}
        </div>

        {isAdmin && payment.status === "process" && (
          <div className="flex justify-end space-x-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => setIsRejectDialogOpen(true)}
            >
              <X className="h-4 w-4 mr-1" />
              Tolak
            </Button>
            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setIsConfirmDialogOpen(true)}>
              <Check className="h-4 w-4 mr-1" />
              Konfirmasi
            </Button>
          </div>
        )}
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
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
                  Batal
                </Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleConfirmPayment}>
                  Konfirmasi
                </Button>
              </>
            )}
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
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
                  Batal
                </Button>
                <Button variant="destructive" onClick={handleRejectPayment}>
                  Tolak Pembayaran
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

