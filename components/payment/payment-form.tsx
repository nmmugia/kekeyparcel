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
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency } from "@/lib/utils"
import { ErrorMessage } from "@/components/error-message"
import { LoadingSpinner } from "@/components/loading-spinner"

interface PaymentFormProps {
  transaction: Transaction
  paymentMethods: PaymentMethod[]
  paidWeeks: Set<number>
  userId: string
  userName: string
  userEmail: string
  onSuccess: () => void
}

export default function PaymentForm({
  transaction,
  paymentMethods,
  paidWeeks,
  userId,
  userName,
  userEmail,
  onSuccess,
}: PaymentFormProps) {
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

  const handleWeekToggle = (week: number) => {
    setSelectedWeeks((prev) => {
      if (prev.includes(week)) {
        return prev.filter((w) => w !== week)
      } else {
        return [...prev, week].sort((a, b) => a - b)
      }
    })
  }

  const handleSelectAllWeeks = () => {
    if (selectedWeeks.length === availableWeeks.length) {
      setSelectedWeeks([])
    } else {
      setSelectedWeeks([...availableWeeks])
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
        bankName: paymentMethod === "transfer" ? bankName : null,
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
        throw new Error("Failed to create payment")
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {isLoading && (
        <div className="flex justify-center my-4">
          <LoadingSpinner />
        </div>
      )}

      <div className="space-y-2">
        <Label>Minggu Pembayaran</Label>

        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-500">Pilih minggu yang akan dibayar</span>
          <Button type="button" variant="outline" size="sm" onClick={handleSelectAllWeeks}>
            {selectedWeeks.length === availableWeeks.length ? "Batal Pilih Semua" : "Pilih Semua"}
          </Button>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {availableWeeks.map((week) => (
            <div key={week} className="flex items-center space-x-2">
              <Checkbox
                id={`week-${week}`}
                checked={selectedWeeks.includes(week)}
                onCheckedChange={() => handleWeekToggle(week)}
              />
              <Label htmlFor={`week-${week}`} className="text-sm cursor-pointer">
                {week}
              </Label>
            </div>
          ))}
        </div>

        {errors.weeks && <ErrorMessage message={errors.weeks} />}

        {selectedWeeks.length > 0 && (
          <div className="bg-gray-50 p-3 rounded-lg mt-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Total Minggu:</span>
              <span className="font-medium">{selectedWeeks.length} Minggu</span>
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
          <Input id="proofImage" type="file" accept="image/*" onChange={handleProofImageChange} disabled={isLoading} />
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

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={isLoading}>
          Batal
        </Button>
        <Button type="submit" disabled={isLoading || selectedWeeks.length === 0}>
          Kirim Pembayaran
        </Button>
      </div>
    </form>
  )
}

