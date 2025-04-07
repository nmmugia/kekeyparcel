"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ErrorBoundaryProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  const router = useRouter()

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Error caught by error boundary:", error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-6">
        <AlertTriangle className="h-10 w-10 text-red-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi atau kembali ke halaman utama.
      </p>
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        <Button onClick={() => reset()} variant="default">
          Coba Lagi
        </Button>
        <Button onClick={() => router.push("/home")} variant="outline">
          Kembali ke Beranda
        </Button>
      </div>
    </div>
  )
}

