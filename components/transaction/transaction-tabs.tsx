"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import TransactionList from "@/components/transaction/transaction-list"

interface TransactionTabsProps {
  userRole: string
  userId: string
}

export default function TransactionTabs({ userRole, userId }: TransactionTabsProps) {
  const [activeTab, setActiveTab] = useState("process")
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [payments, setPayments] = useState([])

  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/payments?status=${activeTab}${userRole === "reseller" ? `&resellerId=${userId}` : ""}`,
        )
        const data = await response.json()
        setPayments(data)
      } catch (error) {
        console.error("Error fetching payments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()
  }, [activeTab, userRole, userId])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const filteredPayments = payments.filter(
    (payment: any) =>
      payment.transaction.packageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input placeholder="Cari transaksi..." className="pl-10" value={searchTerm} onChange={handleSearch} />
      </div>

      <Tabs defaultValue="process" onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="process">Proses</TabsTrigger>
          <TabsTrigger value="confirmed">Dikonfirmasi</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak</TabsTrigger>
        </TabsList>

        <TabsContent value="process" className="mt-4">
          {isLoading ? (
            <LoadingSpinner className="py-10" />
          ) : (
            <TransactionList payments={filteredPayments} status="process" userRole={userRole} />
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="mt-4">
          {isLoading ? (
            <LoadingSpinner className="py-10" />
          ) : (
            <TransactionList payments={filteredPayments} status="confirmed" userRole={userRole} />
          )}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {isLoading ? (
            <LoadingSpinner className="py-10" />
          ) : (
            <TransactionList payments={filteredPayments} status="rejected" userRole={userRole} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

