"use client"

import type React from "react"

import { useState } from "react"
import type { PaymentMethod } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ErrorMessage } from "@/components/error-message"

interface PaymentMethodFormProps {
  paymentMethod?: PaymentMethod
  onSubmit: (data: Omit<PaymentMethod, "id" | "createdAt" | "updatedAt">) => void
}

export default function PaymentMethodForm({ paymentMethod, onSubmit }: PaymentMethodFormProps) {
  const [name, setName] = useState(paymentMethod?.name || "")
  const [type, setType] = useState(paymentMethod?.type || "bank")
  const [accountNumber, setAccountNumber] = useState(paymentMethod?.accountNumber || "")
  const [accountHolder, setAccountHolder] = useState(paymentMethod?.accountHolder || "")
  const [logoUrl, setLogoUrl] = useState(paymentMethod?.logo || "")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const isEditing = !!paymentMethod

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Nama metode pembayaran harus diisi"
    }

    if (type === "bank" && !accountNumber.trim()) {
      newErrors.accountNumber = "Nomor rekening harus diisi"
    }

    if (type === "bank" && !accountHolder.trim()) {
      newErrors.accountHolder = "Nama pemilik rekening harus diisi"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0])

      // Create a preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setLogoUrl(event.target.result as string)
        }
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // First, upload the logo if there's a new one
    let finalLogoUrl = paymentMethod?.logo || ""

    if (logoFile) {
      const formData = new FormData()
      formData.append("file", logoFile)

      try {
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload logo")
        }

        const uploadData = await uploadResponse.json()
        finalLogoUrl = uploadData.url
      } catch (error) {
        setErrors({
          ...errors,
          logo: "Gagal mengunggah logo",
        })
        return
      }
    }

    // Then, submit the form
    onSubmit({
      name,
      type,
      accountNumber: type === "bank" ? accountNumber : null,
      accountHolder: type === "bank" ? accountHolder : null,
      logo: finalLogoUrl,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Tipe Metode Pembayaran</Label>
        <RadioGroup value={type} onValueChange={setType} className="flex space-x-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="bank" id="bank" />
            <Label htmlFor="bank">Bank</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cash" id="cash" />
            <Label htmlFor="cash">Tunai</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Nama</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Masukkan nama metode pembayaran"
        />
        {errors.name && <ErrorMessage message={errors.name} />}
      </div>

      {type === "bank" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Nomor Rekening</Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Masukkan nomor rekening"
            />
            {errors.accountNumber && <ErrorMessage message={errors.accountNumber} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountHolder">Nama Pemilik Rekening</Label>
            <Input
              id="accountHolder"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Masukkan nama pemilik rekening"
            />
            {errors.accountHolder && <ErrorMessage message={errors.accountHolder} />}
          </div>
        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="logo">Logo (Opsional)</Label>
        <div className="flex items-center space-x-4">
          {logoUrl && (
            <div className="w-16 h-16 relative rounded overflow-hidden border">
              <img src={logoUrl || "/placeholder.svg"} alt="Preview" className="object-contain w-full h-full" />
            </div>
          )}
          <Input id="logo" type="file" accept="image/*" onChange={handleLogoChange} />
        </div>
        {errors.logo && <ErrorMessage message={errors.logo} />}
      </div>

      <div className="flex justify-end space-x-2 pt-2">
        <Button type="submit">{isEditing ? "Perbarui" : "Simpan"}</Button>
      </div>
    </form>
  )
}

