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

interface ChangePasswordFormProps {
  userId: string
}

export default function ChangePasswordForm({ userId }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const { toast } = useToast()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!currentPassword) {
      newErrors.currentPassword = "Kata sandi saat ini harus diisi"
    }

    if (!newPassword) {
      newErrors.newPassword = "Kata sandi baru harus diisi"
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Kata sandi baru minimal 6 karakter"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi kata sandi harus diisi"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Konfirmasi kata sandi tidak cocok"
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
      const response = await fetch(`/api/users/${userId}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to change password")
      }

      toast({
        title: "Kata sandi berhasil diubah",
        description: "Kata sandi Anda telah berhasil diperbarui",
      })

      router.push("/profile")
    } catch (error: any) {
      toast({
        title: "Gagal mengubah kata sandi",
        description: error.message || "Terjadi kesalahan saat mengubah kata sandi",
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
          <CardTitle>Ubah Kata Sandi</CardTitle>
          <CardDescription>Perbarui kata sandi akun Anda</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={isLoading}
              />
              {errors.currentPassword && <ErrorMessage message={errors.currentPassword} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Kata Sandi Baru</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading}
              />
              {errors.newPassword && <ErrorMessage message={errors.newPassword} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              {errors.confirmPassword && <ErrorMessage message={errors.confirmPassword} />}
            </div>
          </form>
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => router.push("/profile")} disabled={isLoading}>
            Kembali
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            Ubah Kata Sandi
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}

