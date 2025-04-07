"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingOverlay } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"

interface ProfileFormProps {
  user: {
    id: string
    name: string
    email: string
    role: string
    _count: {
      transactions: number
    }
  }
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const { toast } = useToast()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Nama harus diisi"
    }

    if (!email.trim()) {
      newErrors.email = "Email harus diisi"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Format email tidak valid"
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
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update profile")
      }

      toast({
        title: "Profil berhasil diperbarui",
        description: "Informasi profil Anda telah diperbarui",
      })

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      toast({
        title: "Gagal memperbarui profil",
        description: "Terjadi kesalahan saat memperbarui profil",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
          <CardDescription>Lihat dan perbarui informasi profil Anda</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              {isEditing ? (
                <>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
                  {errors.name && <ErrorMessage message={errors.name} />}
                </>
              ) : (
                <div className="p-2 bg-gray-50 rounded-md">{user.name}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.email && <ErrorMessage message={errors.email} />}
                </>
              ) : (
                <div className="p-2 bg-gray-50 rounded-md">{user.email}</div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Peran</Label>
              <div className="p-2 bg-gray-50 rounded-md capitalize">
                {user.role === "admin" ? "Administrator" : "Reseller"}
              </div>
            </div>

            {user.role === "reseller" && (
              <div className="space-y-2">
                <Label>Total Transaksi</Label>
                <div className="p-2 bg-gray-50 rounded-md">{user._count.transactions} Transaksi</div>
              </div>
            )}

            {isEditing && (
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setName(user.name)
                    setEmail(user.email)
                    setIsEditing(false)
                    setErrors({})
                  }}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  Simpan Perubahan
                </Button>
              </div>
            )}
          </form>
        </CardContent>

        {!isEditing && (
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => router.push("/change-password")}>
              Ubah Kata Sandi
            </Button>
            <Button onClick={() => setIsEditing(true)}>Edit Profil</Button>
          </CardFooter>
        )}
      </Card>
    </>
  )
}

