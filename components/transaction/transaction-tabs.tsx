"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import TransactionList from "@/components/transaction/transaction-list"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"

interface TransactionTabsProps {
  userRole: string
  userId: string
}

export default function TransactionTabs({ userRole, userId }: TransactionTabsProps) {
  const [activeTab, setActiveTab] = useState("process")
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [payments, setPayments] = useState([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { targetRef, isIntersecting } = useIntersectionObserver()

  useEffect(() => {
    // Reset when tab or search changes
    setPayments([])
    setPage(1)
    setHasMore(true)
    fetchPayments(1, true)
  }, [activeTab, userRole, userId, searchTerm])

  useEffect(() => {
    if (isIntersecting && !isLoading && !isLoadingMore && hasMore) {
      setPage((prev) => {
        const nextPage = prev + 1
        fetchPayments(nextPage, false)
        return nextPage
      })
    }
  }, [isIntersecting])

  const fetchPayments = async (targetPage: number, isNewSearch: boolean) => {
    if (isNewSearch) setIsLoading(true)
    else setIsLoadingMore(true)

    try {
      const response = await fetch(
        `/api/payments?status=${activeTab}&page=${targetPage}&search=${encodeURIComponent(searchTerm)}${
          userRole === "reseller" ? `&resellerId=${userId}` : ""
        }`,
      )
      const data = await response.json()
      
      setPayments((prev) => (isNewSearch ? data.payments : [...prev, ...data.payments]))
      setHasMore(data.hasMore)
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Basic debounce could be added here, but direct works for simple cases
    setSearchTerm(e.target.value)
  }

  const renderTabContent = (statusValue: string) => {
    return (
      <TabsContent value={statusValue} className="mt-4">
        {isLoading ? (
          <LoadingSpinner className="py-10" />
        ) : (
          <>
            <TransactionList payments={payments} status={statusValue} userRole={userRole} />
            {hasMore && (
              <div ref={targetRef as any} className="py-4 flex justify-center mt-4">
                {isLoadingMore && <LoadingSpinner className="py-2" />}
              </div>
            )}
            {!hasMore && payments.length > 0 && (
              <p className="text-center text-gray-500 mt-6 pb-6 text-sm">Tidak ada transaksi lagi</p>
            )}
          </>
        )}
      </TabsContent>
    )
  }

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

        {renderTabContent("process")}
        {renderTabContent("confirmed")}
        {renderTabContent("rejected")}
      </Tabs>
    </div>
  )
}

