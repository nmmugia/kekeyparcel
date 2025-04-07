import { Loader2 } from "lucide-react"

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
    </div>
  )
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        <Loader2 className="h-10 w-10 animate-spin text-pink-500 mb-2" />
        <p className="text-gray-700">Memproses...</p>
      </div>
    </div>
  )
}

