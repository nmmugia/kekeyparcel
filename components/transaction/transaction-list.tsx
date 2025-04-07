import Link from "next/link"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Receipt } from "lucide-react"
import StatusBadge from "@/components/status-badge"

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

              <StatusBadge status={status} />
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
                <Receipt className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-xs text-gray-500">Bukti Pembayaran</span>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  )
}

