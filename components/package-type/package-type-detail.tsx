"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { PackageType, Package } from "@prisma/client"
import { Edit, Trash2, ArrowLeft, Plus, FolderPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { LoadingOverlay } from "@/components/loading-spinner"
import PackageCard from "@/components/package/package-card"

interface PackageTypeDetailProps {
  packageType: PackageType & {
    packages: Package[]
  }
  isAdmin: boolean
}

export default function PackageTypeDetail({ packageType, isAdmin }: PackageTypeDetailProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/package-types/${packageType.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete package type")
      }

      toast({
        title: "Tipe paket berhasil dihapus",
        description: "Tipe paket telah dihapus dari sistem",
      })
      router.push("/home")
      router.refresh()
    } catch (error) {
      toast({
        title: "Gagal menghapus tipe paket",
        description: "Terjadi kesalahan saat menghapus tipe paket",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <div className="bg-white rounded-lg shadow-sm overflow-hidden p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/home" className="mr-4">
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Link>

            <div className="flex items-center">
              <div className="w-8 h-8 flex items-center justify-center text-pink-500 mr-2">
                <FolderPlus className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">{packageType.name}</h1>
            </div>
          </div>

          {isAdmin && (
            <div className="flex space-x-2">
              <Link href={`/package-type/edit/${packageType.id}`}>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            </div>
          )}
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Daftar Paket</h2>

          {isAdmin && (
            <Link href={`/package/create?typeId=${packageType.id}`}>
              <Button size="sm" className="bg-pink-500 hover:bg-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Paket
              </Button>
            </Link>
          )}
        </div>

        {packageType.packages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {packageType.packages.map((pkg) => (
              <PackageCard key={pkg.id} package={pkg} isAdmin={isAdmin} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-500 mb-4">Belum ada paket untuk tipe ini</p>

            {isAdmin && (
              <Link href={`/package/create?typeId=${packageType.id}`}>
                <Button className="bg-pink-500 hover:bg-pink-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Paket
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Tipe Paket</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menghapus tipe paket ini? Tindakan ini tidak dapat dibatalkan.</p>
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
    </>
  )
}

