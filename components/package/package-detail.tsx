"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Package, PackageType } from "@prisma/client"
import { Edit, Trash2, ArrowLeft, Check, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { LoadingOverlay } from "@/components/loading-spinner"

interface PackageDetailProps {
  packageData: Package & {
    packageType: PackageType
    _count?: {
      transactions: number
    }
  }
  isAdmin: boolean
  userId: string
  userName: string
  userEmail: string
  transactionCount: number
}

export default function PackageDetail({ packageData, isAdmin, userId, userName, userEmail, transactionCount }: PackageDetailProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/packages/${packageData.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete package")
      }

      toast({
        title: "Paket berhasil dihapus",
        description: "Paket telah dihapus dari sistem",
      })
      router.push("/home")
      router.refresh()
    } catch (error) {
      toast({
        title: "Gagal menghapus paket",
        description: "Terjadi kesalahan saat menghapus paket",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  const handleCreateTransaction = async () => {
    if (!customerName.trim()) {
      toast({
        title: "Nama pelanggan diperlukan",
        description: "Silakan masukkan nama pelanggan",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId: packageData.id,
          customerName,
          resellerId: userId,
          resellerName: userName,
          resellerEmail: userEmail,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create transaction")
      }

      const data = await response.json()

      toast({
        title: "Transaksi berhasil dibuat",
        description: "Transaksi telah berhasil dibuat",
      })
      router.push(`/transaction/${data.id}`)
      router.refresh()
    } catch (error) {
      toast({
        title: "Gagal membuat transaksi",
        description: "Terjadi kesalahan saat membuat transaksi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsTransactionDialogOpen(false)
    }
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="relative">
          <Link href="/home" className="absolute top-4 left-4 z-10 bg-white/80 p-2 rounded-full shadow-sm">
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </Link>

          {isAdmin && (
            <div className="absolute top-4 right-4 z-10 flex space-x-2">
              <Link href={`/package/edit/${packageData.id}`} className="bg-white/80 p-2 rounded-full shadow-sm">
                <Edit className="h-5 w-5 text-gray-700" />
              </Link>
              <button onClick={() => setIsDeleteDialogOpen(true)} className="bg-white/80 p-2 rounded-full shadow-sm">
                <Trash2 className="h-5 w-5 text-red-500" />
              </button>
            </div>
          )}

          <div className="h-64 bg-gray-100 relative cursor-pointer" onClick={() => setIsImageModalOpen(true)}>
            {packageData.photo ? (
              <Image
                src={packageData.photo || "/placeholder.svg"}
                alt={packageData.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-pink-50">
                <span className="text-pink-300 text-lg">No Image</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 relative mr-2">
              <Image
                src={packageData.packageType.icon || "/icons/package.svg"}
                alt={packageData.packageType.name}
                fill
                className="object-contain"
              />
            </div>
            <span className="text-sm text-gray-500">{packageData.packageType.name}</span>
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-2">{packageData.name}</h1>

          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500">Jumlah Pembayaran</p>
              <p className="text-lg font-semibold">{packageData.tenor} Minggu</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Harga</p>
              <p className="text-lg font-semibold text-pink-600">{formatCurrency(packageData.pricePerWeek)}/Minggu</p>
            </div>
          </div>

          {isAdmin && (
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-md mb-4 text-sm flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Total Transaksi: {transactionCount}
            </div>
          )}

          {packageData.isEligibleBonus && (
            <div className="bg-green-50 text-green-700 px-4 py-2 rounded-md mb-4 text-sm flex items-center">
              <Check className="h-4 w-4 mr-2" />
              Berhak atas bonus
            </div>
          )}

          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Deskripsi</h2>
            <p className="text-gray-700 whitespace-pre-line">{packageData.description || "Tidak ada deskripsi"}</p>
          </div>

          {!isAdmin && (
            <Button className="w-full bg-pink-500 hover:bg-pink-600" onClick={() => setIsTransactionDialogOpen(true)}>
              Daftar Paket
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Paket</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menghapus paket ini? Tindakan ini tidak dapat dibatalkan.</p>
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

      {/* Transaction Dialog */}
      <Dialog open={isTransactionDialogOpen} onOpenChange={setIsTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Daftar Paket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Nama Paket</p>
              <p>{packageData.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Harga</p>
              <p>{formatCurrency(packageData.pricePerWeek)}/Minggu</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Tenor</p>
              <p>{packageData.tenor} Minggu</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Nama Pelanggan</p>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Masukkan nama pelanggan"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTransactionDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleCreateTransaction}>Konfirmasi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Modal */}
      <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
        <DialogContent className="max-w-3xl">
          <div className="relative h-[70vh]">
            {packageData.photo ? (
              <Image
                src={packageData.photo || "/placeholder.svg"}
                alt={packageData.name}
                fill
                className="object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-pink-50">
                <span className="text-pink-300 text-lg">No Image</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

