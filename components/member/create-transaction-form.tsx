"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingOverlay } from "@/components/loading-spinner"
import { ErrorMessage } from "@/components/error-message"
import { formatCurrency } from "@/lib/utils"

interface Package {
  id: string
  name: string
  description: string | null
  pricePerWeek: number
  tenor: number
  isEligibleBonus: boolean
}

interface CreateTransactionFormProps {
  resellerId: string
  resellerName: string
  resellerEmail: string
  onSuccess: () => void
}

export default function CreateTransactionForm({
  resellerId,
  resellerName,
  resellerEmail,
  onSuccess,
}: CreateTransactionFormProps) {
  const [packages, setPackages] = useState<Package[]>([])
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [packageId, setPackageId] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingPackages, setIsLoadingPackages] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const router = useRouter()
  const { toast } = useToast()

  // Fetch packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch("/api/packages")
        if (response.ok) {
          const data = await response.json()
          setPackages(data)
        }
      } catch (error) {
        console.error("Error fetching packages:", error)
      } finally {
        setIsLoadingPackages(false)
      }
    }

    fetchPackages()
  }, [])

  // Update selected package when packageId changes
  useEffect(() => {
    if (packageId) {
      const pkg = packages.find((p) => p.id === packageId)
      setSelectedPackage(pkg || null)
    } else {
      setSelectedPackage(null)
    }
  }, [packageId, packages])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!packageId) {
      newErrors.packageId = "Paket harus dipilih"
    }

    if (!customerName.trim()) {
      newErrors.customerName = "Nama pelanggan harus diisi"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageId,
          customerName,
          resellerId,
          resellerName,
          resellerEmail,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create transaction")
      }

      const data = await response.json()

      toast({
        title: "Transaksi berhasil dibuat",
        description: "Transaksi telah berhasil dibuat untuk reseller",
      })

      onSuccess()
      router.push(`/transaction/${data.id}`)
    } catch (error) {
      toast({
        title: "Gagal membuat transaksi",
        description: "Terjadi kesalahan saat membuat transaksi",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && <LoadingOverlay />}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="packageId">Pilih Paket</Label>
          {isLoadingPackages ? (
            <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
          ) : (
            <Select value={packageId} onValueChange={setPackageId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih paket" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((pkg) => (
                  <SelectItem key={pkg.id} value={pkg.id}>
                    {pkg.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {errors.packageId && <ErrorMessage message={errors.packageId} />}
        </div>

        {selectedPackage && (
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-500">Harga per Minggu</p>
                <p className="font-medium text-pink-600">{formatCurrency(selectedPackage.pricePerWeek)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tenor</p>
                <p className="font-medium">{selectedPackage.tenor} Minggu</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-medium">{formatCurrency(selectedPackage.pricePerWeek * selectedPackage.tenor)}</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="customerName">Nama Pelanggan</Label>
          <Input
            id="customerName"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Masukkan nama pelanggan"
          />
          {errors.customerName && <ErrorMessage message={errors.customerName} />}
        </div>

        <div className="space-y-2">
          <Label>Reseller</Label>
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="font-medium">{resellerName}</p>
            <p className="text-sm text-gray-500">{resellerEmail}</p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Batal
          </Button>
          <Button type="button" onClick={handleSubmit}>
            Buat Transaksi
          </Button>
        </div>
      </div>
    </>
  )
}

