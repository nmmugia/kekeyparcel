"use client"

import { useState } from "react"
import Image from "next/image"
import type { PaymentMethod } from "@prisma/client"
import { Plus, Edit, Trash2, CreditCard, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadingOverlay } from "@/components/loading-spinner"
import PaymentMethodForm from "@/components/payment/payment-method-form"

interface PaymentMethodListProps {
  paymentMethods: PaymentMethod[]
}

export default function PaymentMethodList({ paymentMethods: initialPaymentMethods }: PaymentMethodListProps) {
  const [paymentMethods, setPaymentMethods] = useState(initialPaymentMethods)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleCreate = async (newMethod: Omit<PaymentMethod, "id" | "createdAt" | "updatedAt">) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/payment-methods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newMethod),
      })

      if (!response.ok) {
        throw new Error("Failed to create payment method")
      }

      const data = await response.json()

      setPaymentMethods([...paymentMethods, data])

      toast({
        title: "Metode pembayaran berhasil dibuat",
        description: "Metode pembayaran baru telah ditambahkan",
      })

      setIsCreateDialogOpen(false)
    } catch (error) {
      toast({
        title: "Gagal membuat metode pembayaran",
        description: "Terjadi kesalahan saat membuat metode pembayaran",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = async (updatedMethod: Omit<PaymentMethod, "createdAt" | "updatedAt">) => {
    if (!selectedMethod) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/payment-methods/${selectedMethod.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedMethod),
      })

      if (!response.ok) {
        throw new Error("Failed to update payment method")
      }

      const data = await response.json()

      setPaymentMethods(paymentMethods.map((method) => (method.id === data.id ? data : method)))

      toast({
        title: "Metode pembayaran berhasil diperbarui",
        description: "Metode pembayaran telah diperbarui",
      })

      setIsEditDialogOpen(false)
    } catch (error) {
      toast({
        title: "Gagal memperbarui metode pembayaran",
        description: "Terjadi kesalahan saat memperbarui metode pembayaran",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedMethod) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/payment-methods/${selectedMethod.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete payment method")
      }

      setPaymentMethods(paymentMethods.filter((method) => method.id !== selectedMethod.id))

      toast({
        title: "Metode pembayaran berhasil dihapus",
        description: "Metode pembayaran telah dihapus",
      })

      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast({
        title: "Gagal menghapus metode pembayaran",
        description: "Terjadi kesalahan saat menghapus metode pembayaran",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Group payment methods by type
  const bankMethods = paymentMethods.filter((method) => method.type === "bank")
  const cashMethods = paymentMethods.filter((method) => method.type === "cash")

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <div className="space-y-8">
        <div className="flex justify-end">
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-pink-500 hover:bg-pink-600">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Metode Pembayaran
          </Button>
        </div>

        {/* Bank Methods */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-pink-500" />
            Metode Bank
          </h2>

          {bankMethods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankMethods.map((method) => (
                <div key={method.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {method.logo && (
                        <div className="w-10 h-10 relative mr-3">
                          <Image
                            src={method.logo || "/placeholder.svg"}
                            alt={method.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{method.name}</h3>
                        {method.accountNumber && <p className="text-sm text-gray-600">{method.accountNumber}</p>}
                      </div>
                    </div>

                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedMethod(method)
                          setIsEditDialogOpen(true)
                        }}
                        className="p-1 text-gray-500 hover:text-pink-500"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMethod(method)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="p-1 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {method.accountHolder && <p className="text-sm text-gray-600 mt-2">a.n. {method.accountHolder}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500">Belum ada metode bank</p>
            </div>
          )}
        </div>

        {/* Cash Methods */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Wallet className="h-5 w-5 mr-2 text-pink-500" />
            Metode Tunai
          </h2>

          {cashMethods.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cashMethods.map((method) => (
                <div key={method.id} className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {method.logo && (
                        <div className="w-10 h-10 relative mr-3">
                          <Image
                            src={method.logo || "/placeholder.svg"}
                            alt={method.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                      <h3 className="font-semibold">{method.name}</h3>
                    </div>

                    <div className="flex space-x-1">
                      <button
                        onClick={() => {
                          setSelectedMethod(method)
                          setIsEditDialogOpen(true)
                        }}
                        className="p-1 text-gray-500 hover:text-pink-500"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMethod(method)
                          setIsDeleteDialogOpen(true)
                        }}
                        className="p-1 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500">Belum ada metode tunai</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Metode Pembayaran</DialogTitle>
          </DialogHeader>
          <PaymentMethodForm onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Metode Pembayaran</DialogTitle>
          </DialogHeader>
          {selectedMethod && <PaymentMethodForm paymentMethod={selectedMethod} onSubmit={handleEdit} />}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Metode Pembayaran</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menghapus metode pembayaran ini?</p>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

