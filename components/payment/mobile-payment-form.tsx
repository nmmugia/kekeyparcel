
"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { Transaction, PaymentMethod } from "@prisma/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { ErrorMessage } from "@/components/error-message"
import { LoadingSpinner } from "@/components/loading-spinner"
import {
  MobileDialog,
  MobileDialogContent,
  MobileDialogHeader,
  MobileDialogTitle,
  MobileDialogFixedFooter,
} from "@/components/ui/mobile-dialog"

interface MobilePaymentFormProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction
  paymentMethods: PaymentMethod[]
  paidWeeks: Set<number>
  userId: string
  userName: string
  userEmail: string
  onSuccess: () => void
}

export default function MobilePaymentForm({
  isOpen,
  onOpenChange,
  transaction,
  paymentMethods,
  paidWeeks,
  userId,
  userName,
  userEmail,
  onSuccess,
}: MobilePaymentFormProps) {
  const [paymentMethod, setPaymentMethod] = useState("")
  const [bankName, setBankName] = useState("")
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [proofImage, setProofImage] = useState<File | null>(null)
  const [proofImagePreview, setProofImagePreview] = useState("")
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([])
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const { toast } = useToast()

  // Initialize available weeks
  useEffect(() => {
    const weeks = []
    for (let i = 1; i <= transaction.tenor; i++) {
      if (!paidWeeks.has(i)) {
        weeks.push(i)
      }
    }
    setAvailableWeeks(weeks)
  }, [transaction.tenor, paidWeeks])

  // Update amount when selected weeks change
  useEffect(() => {
    if (selectedWeeks.length > 0) {
      const calculatedAmount = selectedWeeks.length * transaction.pricePerWeek
      setAmount(calculatedAmount.toString())
    } else {
      setAmount("")
    }
  }, [selectedWeeks, transaction.pricePerWeek])

  const handleProofImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setProofImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setProofImagePreview(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (selectedWeeks.length === 0) {
      newErrors.weeks = "Pilih minimal satu minggu untuk pembayaran"
    }

    if (!paymentMethod) {
      newErrors.paymentMethod = "Metode pembayaran harus dipilih"
    }

    if (paymentMethod === "transfer" && !proofImage) {
      newErrors.proofImage = "Bukti pembayaran diperlukan untuk transfer"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // First, upload the proof image if there's one
      let proofImageUrl = ""

      if (proofImage) {
        const formData = new FormData()
        formData.append("file", proofImage)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload proof image")
        }

        const uploadData = await uploadResponse.json()
        proofImageUrl = uploadData.url
      }

      // Then, create the payment
      const paymentData = {
        transactionId: transaction.id,
        amount: Number.parseFloat(amount),
        weekNumbers: selectedWeeks,
        paymentMethod,
        bankName: paymentMethod === "bank" ? bankName : null,
        proofImage: proofImageUrl,
        note,
        resellerId: userId,
        resellerName: userName,
        resellerEmail: userEmail,
      }

      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      })

      if (!response.ok) {
        const data = await response.json();
        toast({
            title: "Gagal membuat pembayaran",
            description: data.error,
            variant: "destructive",
        })
        return
      }

      toast({
        title: "Pembayaran berhasil dibuat",
        description: "Pembayaran telah berhasil dibuat dan menunggu konfirmasi",
      })

      onSuccess()
    } catch (error) {
      toast({
        title: "Gagal membuat pembayaran",
        description: "Terjadi kesalahan saat membuat pembayaran",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const selectedPaymentMethod = paymentMethods.find((pm) => pm.id === paymentMethod)

  return (
    <MobileDialog open={isOpen} onOpenChange={onOpenChange}>
      <MobileDialogContent className="pb-24">
        {" "}
        {/* Add padding for fixed footer */}
        <MobileDialogHeader>
          <MobileDialogTitle>Tambah Pembayaran</MobileDialogTitle>
        </MobileDialogHeader>
        <form id="payment-form" onSubmit={handleSubmit} className="space-y-4">
          {isLoading && (
            <div className="flex justify-center my-4">
              <LoadingSpinner />
            </div>
          )}

          <div className="space-y-2">
            <Label>Minggu Pembayaran</Label>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm mb-2">
                Minggu yang belum dibayar:{" "}
                {availableWeeks.length > 0
                  ? `${availableWeeks[0]} - ${availableWeeks[availableWeeks.length - 1]}`
                  : "Tidak ada"}
              </p>

              <div className="flex items-center space-x-2">
                <Label htmlFor="totalWeeks" className="whitespace-nowrap">
                  Total Minggu:
                </Label>
                <Input
                  id="totalWeeks"
                  type="number"
                  min="1"
                  max={availableWeeks.length}
                  value={selectedWeeks.length.toString()}
                  onChange={(e) => {
                    const total = Number.parseInt(e.target.value) || 0
                    if (total <= 0 || availableWeeks.length === 0) {
                      setSelectedWeeks([])
                    } else {
                      const count = Math.min(total, availableWeeks.length)
                      setSelectedWeeks(availableWeeks.slice(0, count))
                    }
                  }}
                  className="w-24"
                />
                <span className="text-sm text-gray-500">dari {availableWeeks.length} minggu</span>
              </div>
            </div>

            {errors.weeks && <ErrorMessage message={errors.weeks} />}

            {selectedWeeks.length > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Minggu yang akan dibayar:</span>
                  <span className="font-medium">{selectedWeeks.join(", ")}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm">Total Pembayaran:</span>
                  <span className="font-medium text-pink-600">{formatCurrency(Number.parseFloat(amount))}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
            <Select
              value={paymentMethod}
              onValueChange={(value) => {
                setPaymentMethod(value)
                // Reset bank name if not transfer
                if (value !== "transfer") {
                  setBankName("")
                } else {
                  // Set default bank name from selected payment method
                  const method = paymentMethods.find((pm) => pm.id === value)
                  if (method) {
                    setBankName(method.name)
                  }
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih metode pembayaran" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id}>
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.paymentMethod && <ErrorMessage message={errors.paymentMethod} />}
          </div>

          {selectedPaymentMethod && selectedPaymentMethod.type === "bank" && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium">{selectedPaymentMethod.name}</p>
              {selectedPaymentMethod.accountNumber && (
                <p className="text-sm mt-1">No. Rekening: {selectedPaymentMethod.accountNumber}</p>
              )}
              {selectedPaymentMethod.accountHolder && (
                <p className="text-sm">Atas Nama: {selectedPaymentMethod.accountHolder}</p>
              )}
            </div>
          )}

          {paymentMethod && paymentMethods.find((pm) => pm.id === paymentMethod)?.type === "bank" && (
            <div className="space-y-2">
              <Label htmlFor="proofImage">Bukti Pembayaran</Label>
              <Input
                id="proofImage"
                type="file"
                accept="image/*"
                onChange={handleProofImageChange}
                disabled={isLoading}
              />
              {proofImagePreview && (
                <div className="mt-2">
                  <img src={proofImagePreview || "/placeholder.svg"} alt="Preview" className="max-h-40 rounded-md" />
                </div>
              )}
              {errors.proofImage && <ErrorMessage message={errors.proofImage} />}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="note">Catatan (Opsional)</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan"
              disabled={isLoading}
            />
          </div>
          
            <Button type="button" variant="outline" onClick={onSuccess} disabled={isLoading}>
            Batal
            </Button>
            <Button type="submit" form="payment-form" disabled={isLoading || selectedWeeks.length === 0}>
            Kirim Pembayaran
            </Button>
        </form>
      </MobileDialogContent>
    </MobileDialog>
  )
}

