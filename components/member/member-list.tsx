"use client"

import Link from "next/link"
import { Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

interface Reseller {
  id: string
  name: string
  email: string
  _count: {
    transactions: number
  }
}

interface MemberListProps {
  resellers: Reseller[]
}

export default function MemberList({ resellers }: MemberListProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredResellers = resellers.filter(
    (reseller) =>
      reseller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reseller.email.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            placeholder="Cari reseller..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Link href="/member/create">
          <Button className="bg-pink-500 hover:bg-pink-600">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Reseller
          </Button>
        </Link>
      </div>

      {filteredResellers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500">
            {searchTerm ? "Tidak ada reseller yang sesuai dengan pencarian" : "Belum ada reseller"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResellers.map((reseller) => (
            <Link
              key={reseller.id}
              href={`/member/${reseller.id}`}
              className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 p-4"
            >
              <h3 className="font-semibold text-gray-800">{reseller.name}</h3>
              <p className="text-sm text-gray-600 mt-1">{reseller.email}</p>

              <div className="mt-3 flex justify-between items-center">
                <div className="text-sm text-gray-500">Total Transaksi:</div>
                <div className="text-pink-600 font-medium">{reseller._count.transactions}</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

