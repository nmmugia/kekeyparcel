import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileQuestion } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-full bg-pink-100 flex items-center justify-center mb-6">
        <FileQuestion className="h-10 w-10 text-pink-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-gray-600 mb-6 max-w-md">
        Maaf, halaman yang Anda cari tidak dapat ditemukan. Halaman mungkin telah dipindahkan atau dihapus.
      </p>
      <Link href="/home">
        <Button>Kembali ke Beranda</Button>
      </Link>
    </div>
  )
}

