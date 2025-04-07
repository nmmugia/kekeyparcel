"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type { PackageType } from "@prisma/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingOverlay } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"

interface PackageTypeFormProps {
  packageType?: PackageType
}

export default function PackageTypeForm({ packageType }: PackageTypeFormProps) {
  const [name, setName] = useState(packageType?.name || "")
  const [iconUrl, setIconUrl] = useState(packageType?.icon || "")
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!packageType

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Nama tipe paket harus diisi"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIconFile(e.target.files[0])

      // Create a preview URL
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setIconUrl(event.target.result as string)
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
      // First, upload the icon if there's a new one
      let finalIconUrl = packageType?.icon || ""

      if (iconFile) {
        const formData = new FormData()
        formData.append("file", iconFile)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload icon")
        }

        const uploadData = await uploadResponse.json()
        finalIconUrl = uploadData.url
      }

      // Then, create or update the package type
      const packageTypePayload = {
        name,
        icon: finalIconUrl,
      }

      const url = isEditing ? `/api/package-types/${packageType.id}` : "/api/package-types"

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(packageTypePayload),
      })

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? "update" : "create"} package type`)
      }

      const data = await response.json()

      toast({
        title: `Tipe paket berhasil ${isEditing ? "diperbarui" : "dibuat"}`,
        description: `Tipe paket telah berhasil ${isEditing ? "diperbarui" : "dibuat"}`,
      })

      router.push(`/package-type/${data.id}`)
      router.refresh()
    } catch (error) {
      toast({
        title: `Gagal ${isEditing ? "memperbarui" : "membuat"} tipe paket`,
        description: `Terjadi kesalahan saat ${isEditing ? "memperbarui" : "membuat"} tipe paket`,
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
          <Label htmlFor="name">Nama Tipe Paket</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masukkan nama tipe paket"
          />
          {errors.name && <ErrorMessage message={errors.name} />}
        </div>

        <div className="space-y-2">
          <Label htmlFor="icon">Ikon</Label>
          <div className="flex items-center space-x-4">
            {iconUrl && (
              <div className="w-16 h-16 relative rounded overflow-hidden border">
                <img src={iconUrl || "/placeholder.svg"} alt="Preview" className="object-contain w-full h-full" />
              </div>
            )}
            <Input id="icon" type="file" accept="image/*" onChange={handleIconChange} />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Batal
          </Button>
          <Button type="submit">{isEditing ? "Perbarui" : "Simpan"} Tipe Paket</Button>
        </div>
      </form>
    </>
  )
}

