import Link from "next/link"
import Image from "next/image"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Payment {
  id: string
  amount: number
  status: string
  createdAt: string
  weekNumbers: number[]
  transaction: {
    id: string
    packageName: string
    customerName: string
    pricePerWeek: number
  }
  proofImage?: string | null
}

interface TransactionListProps {
  payments: Payment[]
  status: string
  userRole: string
}

export default function TransactionList({ payments, status, userRole }: TransactionListProps) {
  if (payments.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-gray-500">
          Tidak ada transaksi{" "}
          {status === "process" ? "dalam proses" : status === "confirmed" ? "yang dikonfirmasi" : "yang ditolak"}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {payments.map((payment) => (
        <Link
          key={payment.id}
          href={`/payment/${payment.id}`}
          className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
        >
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-800">{payment.transaction.packageName}</h3>
                <p className="text-sm text-gray-600">Pelanggan: {payment.transaction.customerName}</p>
              </div>

              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  status === "process"
                    ? "bg-yellow-100 text-yellow-800"
                    : status === "confirmed"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                }`}
              >
                {status === "process" ? "Proses" : status === "confirmed" ? "Dikonfirmasi" : "Ditolak"}
              </div>
            </div>

            <div className="mt-3 flex justify-between items-center">
              <div>
                <p className="text-pink-600 font-medium">{formatCurrency(payment.amount)}</p>
                <p className="text-xs text-gray-500">
                  {payment.weekNumbers.length > 1 ? `${payment.weekNumbers.length} minggu` : "1 minggu"}
                </p>
              </div>

              <div className="text-sm text-gray-500">{formatDate(payment.createdAt)}</div>
            </div>

            {payment.proofImage && (
              <div className="mt-3 flex items-center">
                <div className="w-6 h-6 relative mr-2">
                  <Image src="/icons/receipt.svg" alt="Bukti Pembayaran" fill className="object-contain" />
                </div>
                <span className="text-xs text-gray-500">Bukti Pembayaran</span>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

