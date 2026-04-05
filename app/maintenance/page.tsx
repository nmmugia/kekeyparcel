import { Wrench } from "lucide-react"
import Image from "next/image"

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-gray-100 max-w-lg w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center">
          <Wrench className="w-10 h-10 text-pink-600" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Sistem Sedang Maintenance
          </h1>
          <div className="w-24 h-24 relative mb-4">
            <Image src="https://luugchcflfbqxnlfagee.supabase.co/storage/v1/object/sign/dicoterra/logo.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lMWI3Y2EzMi1iYjdlLTRlZWEtYjUzZC0yMTQwMTliMmJmNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkaWNvdGVycmEvbG9nby5qcGVnIiwiaWF0IjoxNzcxNTM4ODIyLCJleHAiOjIwODY4OTg4MjJ9.xhi_m4kpxJwCwJcKxJX2bFcKaCwM3y9fiVHdEC_VBNI" alt="Logo" fill className="object-contain" priority />
          </div>
          <p className="text-gray-500 text-lg">
            Kami sedang melakukan peningkatan sistem dan pemeliharaan server. Silakan kembali dalam beberapa saat.
          </p>
        </div>

        <div className="pt-4 flex justify-center">
          <div className="h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-pink-500 rounded-full animate-[pulse_2s_ease-in-out_infinite]" />
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-sm text-gray-400">
        &copy; {new Date().getFullYear()} Kekeyparcel. All rights reserved.
      </p>
    </div>
  )
}
