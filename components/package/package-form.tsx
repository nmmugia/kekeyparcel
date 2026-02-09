"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Package, PackageType } from "@prisma/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { LoadingOverlay } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"

interface PackageFormProps {
  packageTypes: PackageType[]
  packageData?: Package
  defaultTypeId?: string
}

export default function PackageForm({ packageTypes, packageData, defaultTypeId }: PackageFormProps) {
  const [name, setName] = useState(packageData?.name || "")
  const [description, setDescription] = useState(packageData?.description || "")
  const [pricePerWeek, setPricePerWeek] = useState(packageData?.pricePerWeek.toString() || "")
  const [tenor, setTenor] = useState(packageData?.tenor.toString() || "")
  const [packageTypeId, setPackageTypeId] = useState(packageData?.packageTypeId || defaultTypeId || "")
  const [isEligibleBonus, setIsEligibleBonus] = useState(packageData?.isEligibleBonus || false)
  const [photoUrl, setPhotoUrl] = useState(packageData?.photo || "")
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!packageData

  useEffect(() => {
    if (defaultTypeId && !packageData) {
      setPackageTypeId(defaultTypeId)
    }
  }, [defaultTypeId, packageData])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Nama paket harus diisi"
    }

    if (!pricePerWeek.trim()) {
      newErrors.pricePerWeek = "Harga per minggu harus diisi"
    } else if (isNaN(Number(pricePerWeek)) || Number(pricePerWeek) <= 0) {
      newErrors.pricePerWeek = "Harga per minggu harus berupa angka positif"
    }

    if (!tenor.trim()) {
      newErrors.tenor = "Tenor harus diisi"
    } else if (isNaN(Number(tenor)) || !Number.isInteger(Number(tenor)) || Number(tenor) <= 0) {
      newErrors.tenor = "Tenor harus berupa angka bulat positif"
    }

    if (!packageTypeId) {
      newErrors.packageTypeId = "Tipe paket harus dipilih"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0])

      // Create a preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrl(event.target.result as string)
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

    setIsLoading(true)

    try {
      // First, upload the photo if there's a new one
      let finalPhotoUrl = packageData?.photo || ""

      if (photoFile) {
        const formData = new FormData()
        formData.append("file", photoFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload photo")
        }

        const uploadData = await uploadResponse.json()
        finalPhotoUrl = uploadData.url
      }

      // Then, create or update the package
      const packagePayload = {
        name,
        description,
        pricePerWeek: Number.parseFloat(pricePerWeek),
        tenor: Number.parseInt(tenor),
        packageTypeId,
        isEligibleBonus,
        photo: finalPhotoUrl,
      }

      const url = isEditing ? `/api/packages/${packageData.id}` : "/api/packages"

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(packagePayload),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? "update" : "create"} package`)
      }

      const data = await response.json()

      toast({
        title: `Paket berhasil ${isEditing ? "diperbarui" : "dibuat"}`,
        description: `Paket telah berhasil ${isEditing ? "diperbarui" : "dibuat"}`,
      })

      router.push(`/package/${data.id}`)
      router.refresh()
    } catch (error) {
      toast({
        title: `Gagal ${isEditing ? "memperbarui" : "membuat"} paket`,
        description: `Terjadi kesalahan saat ${isEditing ? "memperbarui" : "membuat"} paket`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="name">Nama Paket</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama paket" />
          {errors.name && <ErrorMessage message={errors.name} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="packageTypeId">Tipe Paket</Label>
          <Select value={packageTypeId} onValueChange={setPackageTypeId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe paket" />
            </SelectTrigger>
            <SelectContent>
              {packageTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.packageTypeId && <ErrorMessage message={errors.packageTypeId} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="pricePerWeek">Harga per Minggu (Rp)</Label>
            <Input
              id="pricePerWeek"
              value={pricePerWeek}
              onChange={(e) => setPricePerWeek(e.target.value)}
              placeholder="Masukkan harga per minggu"
              type="number"
              min="0"
            />
            {errors.pricePerWeek && <ErrorMessage message={errors.pricePerWeek} />}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tenor">Tenor (Minggu)</Label>
            <Input
              id="tenor"
              value={tenor}
              onChange={(e) => setTenor(e.target.value)}
              placeholder="Masukkan jumlah minggu"
              type="number"
              min="1"
              step="1"
            />
            {errors.tenor && <ErrorMessage message={errors.tenor} />}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Masukkan deskripsi paket"
            rows={4}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="photo">Foto Paket</Label>
          <div className="flex items-center space-x-4">
            {photoUrl && (
              <div className="w-24 h-24 relative rounded overflow-hidden border">
                <img src={photoUrl || "/placeholder.svg"} alt="Preview" className="object-cover w-full h-full" />
              </div>
            )}
            <Input id="photo" type="file" accept="image/*" onChange={handlePhotoChange} />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="isEligibleBonus" checked={isEligibleBonus} onCheckedChange={setIsEligibleBonus} />
          <Label htmlFor="isEligibleBonus">Eligible untuk bonus</Label>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
          <Button type="submit">{isEditing ? "Perbarui" : "Simpan"} Paket</Button>
        </div>
      </form>
    </>
  )
}

