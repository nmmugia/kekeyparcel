import LoginForm from "@/components/login-form"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-white">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 relative mb-4">
            <Image src="/logo.svg" alt="Logo" fill className="object-contain" priority />
          </div>
          <h1 className="text-2xl font-bold text-pink-500">Aplikasi Paket Cicilan</h1>
          <p className="text-gray-600 text-center mt-2">Masuk untuk mengelola paket dan transaksi</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

