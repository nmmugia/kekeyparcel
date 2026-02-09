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

interface MemberFormProps {
  user?: {
    id: string
    name: string
    email: string
  }
}

export default function MemberForm({ user }: MemberFormProps) {
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const { toast } = useToast()
  const isEditing = !!user

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

    if (!isEditing) {
      if (!password) {
        newErrors.password = "Kata sandi harus diisi"
      } else if (password.length < 6) {
        newErrors.password = "Kata sandi minimal 6 karakter"
      }

      if (!confirmPassword) {
        newErrors.confirmPassword = "Konfirmasi kata sandi harus diisi"
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Konfirmasi kata sandi tidak cocok"
      }
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
      const url = isEditing ? `/api/users/${user.id}` : "/api/users"
      const method = isEditing ? "PUT" : "POST"

      const payload: any = {
        name,
        email,
        role: "reseller",
      }

      if (!isEditing) {
        payload.password = password
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || `Failed to ${isEditing ? "update" : "create"} user`)
      }

      const data = await response.json()

      toast({
        title: `Reseller berhasil ${isEditing ? "diperbarui" : "dibuat"}`,
        description: `Data reseller telah berhasil ${isEditing ? "diperbarui" : "dibuat"}`,
      })

      router.push(`/member/${data.id}`)
      router.refresh()
    } catch (error: any) {
      toast({
        title: `Gagal ${isEditing ? "memperbarui" : "membuat"} reseller`,
        description: error.message || `Terjadi kesalahan saat ${isEditing ? "memperbarui" : "membuat"} reseller`,
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
          <CardTitle>{isEditing ? "Edit Reseller" : "Tambah Reseller Baru"}</CardTitle>
          <CardDescription>
            {isEditing ? "Perbarui informasi reseller" : "Tambahkan reseller baru ke sistem"}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} disabled={isLoading} />
              {errors.name && <ErrorMessage message={errors.name} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              {errors.email && <ErrorMessage message={errors.email} />}
            </div>

            {!isEditing && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password">Kata Sandi</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.password && <ErrorMessage message={errors.password} />}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && <ErrorMessage message={errors.confirmPassword} />}
                </div>
              </>
            )}
          </form>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/member")} disabled={isLoading}>
            Kembali
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isEditing ? "Perbarui Reseller" : "Tambah Reseller"}
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}

