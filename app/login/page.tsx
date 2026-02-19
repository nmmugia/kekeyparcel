import LoginForm from "@/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 relative mb-4">
            <Image src="https://luugchcflfbqxnlfagee.supabase.co/storage/v1/object/sign/dicoterra/logo.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lMWI3Y2EzMi1iYjdlLTRlZWEtYjUzZC0yMTQwMTliMmJmNTIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJkaWNvdGVycmEvbG9nby5qcGVnIiwiaWF0IjoxNzcxNTM4ODIyLCJleHAiOjIwODY4OTg4MjJ9.xhi_m4kpxJwCwJcKxJX2bFcKaCwM3y9fiVHdEC_VBNI" alt="Logo" fill className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold text-pink-500">Kekey Parcel</h1>
          <p className="text-gray-600 text-center mt-2">Masuk untuk mengelola paket dan transaksi</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

