"use client"

import type React from "react"

import { useState } from "react"
import { Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import html2canvas from "html2canvas"

interface SharePaymentStatusProps {
  transactionId: string
  paymentStatusRef: React.RefObject<HTMLDivElement>
}

export default function SharePaymentStatus({ transactionId, paymentStatusRef }: SharePaymentStatusProps) {
  const [isSharing, setIsSharing] = useState(false)
  const { toast } = useToast()

  const handleShare = async () => {
    if (!paymentStatusRef.current) return

    try {
      setIsSharing(true)

      // Capture the payment status element as an image
      const canvas = await html2canvas(paymentStatusRef.current, {
        scale: 2, // Higher scale for better quality
        backgroundColor: "#FFFFFF",
        logging: false,
      })

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob(
          (blob) => {
            resolve(blob!)
          },
          "image/png",
          0.95,
        )
      })

      // Create file from blob
      const file = new File([blob], `status-pembayaran-${transactionId}.png`, { type: "image/png" })

      // Check if Web Share API is available
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Status Pembayaran",
          text: "Status pembayaran cicilan",
          files: [file],
        })
        toast({
          title: "Berhasil membagikan",
          description: "Status pembayaran telah dibagikan",
        })
      } else {
        // Fallback for browsers that don't support sharing files
        const shareUrl = URL.createObjectURL(blob)

        // Try to share via WhatsApp
        const whatsappUrl = `https://wa.me/?text=Status%20pembayaran%20cicilan`
        window.open(whatsappUrl, "_blank")

        // Also provide download option
        const link = document.createElement("a")
        link.href = shareUrl
        link.download = `status-pembayaran-${transactionId}.png`
        link.click()

        toast({
          title: "Gambar telah diunduh",
          description: "Silakan bagikan gambar melalui WhatsApp atau aplikasi lainnya",
        })
      }
    } catch (error) {
      console.error("Error sharing:", error)
      toast({
        title: "Gagal membagikan",
        description: "Terjadi kesalahan saat membagikan status pembayaran",
        variant: "destructive",
      })
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <Button variant="outline" size="sm" className="flex items-center" onClick={handleShare} disabled={isSharing}>
      <Share2 className="h-4 w-4 mr-2" />
      {isSharing ? "Memproses..." : "Bagikan ke WhatsApp"}
    </Button>
  )
}

