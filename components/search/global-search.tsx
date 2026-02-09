"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Search, Package, FileText, Users, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

interface GlobalSearchProps {
  userRole: string
}

export default function GlobalSearch({ userRole }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [results, setResults] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Handle keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setIsOpen(true)
      }

      // Escape to close search
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen])

  // Focus search input when dialog opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch()
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, activeTab])

  const performSearch = async () => {
    if (query.trim().length < 2) {
      setResults({})
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`)
      const data = await response.json()
      setResults(data.results)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleItemClick = (url: string) => {
    router.push(url)
    setIsOpen(false)
  }

  const hasResults = () => {
    if (activeTab === "all") {
      return (
        (results.packages && results.packages.length > 0) ||
        (results.transactions && results.transactions.length > 0) ||
        (results.members && results.members.length > 0)
      )
    }

    return results && Array.isArray(results) && results.length > 0
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-between text-muted-foreground"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center">
          <Search className="mr-2 h-4 w-4" />
          <span>Cari...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-xs font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] p-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle>Pencarian</DialogTitle>
          </DialogHeader>

          <div className="relative px-4 py-2">
            <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              ref={searchInputRef}
              placeholder="Cari paket, transaksi, reseller..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {query && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-6 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4 text-gray-400" />
                <span className="sr-only">Clear search</span>
              </Button>
            )}
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="px-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="packages">Paket</TabsTrigger>
              <TabsTrigger value="transactions">Transaksi</TabsTrigger>
              {userRole === "admin" && <TabsTrigger value="members">Reseller</TabsTrigger>}
            </TabsList>

            <div className="mt-4 max-h-[60vh] overflow-y-auto p-1">
              {isLoading ? (
                <div className="space-y-2 py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center p-2">
                      <Skeleton className="h-10 w-10 rounded-full mr-3" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : query.trim().length < 2 ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Search className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                  <p>Masukkan minimal 2 karakter untuk mencari</p>
                </div>
              ) : !hasResults() ? (
                <div className="py-8 text-center text-muted-foreground">
                  <p>Tidak ada hasil untuk "{query}"</p>
                </div>
              ) : (
                <TabsContent value="all" className="space-y-4">
                  {/* Packages */}
                  {results.packages && results.packages.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm flex items-center mb-2">
                        <Package className="h-4 w-4 mr-1 text-pink-500" />
                        Paket
                      </h3>
                      <div className="space-y-1">
                        {results.packages.map((pkg: any) => (
                          <div
                            key={pkg.id}
                            className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleItemClick(`/package/${pkg.id}`)}
                          >
                            <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                              <Package className="h-4 w-4 text-pink-600" />
                            </div>
                            <div>
                              <p className="font-medium">{pkg.name}</p>
                              <p className="text-sm text-gray-500">
                                {formatCurrency(pkg.pricePerWeek)}/Minggu • {pkg.tenor} Minggu
                              </p>
                            </div>
                          </div>
                        ))}
                        {results.packages.length >= 5 && (
                          <Link
                            href={`/home?q=${encodeURIComponent(query)}`}
                            className="block text-center text-sm text-pink-600 hover:text-pink-700 py-1"
                            onClick={() => setIsOpen(false)}
                          >
                            Lihat semua paket
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Transactions */}
                  {results.transactions && results.transactions.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm flex items-center mb-2">
                        <FileText className="h-4 w-4 mr-1 text-pink-500" />
                        Transaksi
                      </h3>
                      <div className="space-y-1">
                        {results.transactions.map((transaction: any) => (
                          <div
                            key={transaction.id}
                            className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleItemClick(`/transaction/${transaction.id}`)}
                          >
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                              <FileText className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{transaction.packageName}</p>
                              <p className="text-sm text-gray-500">
                                {transaction.customerName} • {transaction.resellerName}
                              </p>
                            </div>
                          </div>
                        ))}
                        {results.transactions.length >= 5 && (
                          <Link
                            href={`/transaction?q=${encodeURIComponent(query)}`}
                            className="block text-center text-sm text-pink-600 hover:text-pink-700 py-1"
                            onClick={() => setIsOpen(false)}
                          >
                            Lihat semua transaksi
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Members (Admin only) */}
                  {userRole === "admin" && results.members && results.members.length > 0 && (
                    <div>
                      <h3 className="font-medium text-sm flex items-center mb-2">
                        <Users className="h-4 w-4 mr-1 text-pink-500" />
                        Reseller
                      </h3>
                      <div className="space-y-1">
                        {results.members.map((member: any) => (
                          <div
                            key={member.id}
                            className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleItemClick(`/member/${member.id}`)}
                          >
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <Users className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-gray-500">
                                {member.email} • {member._count.transactions} Transaksi
                              </p>
                            </div>
                          </div>
                        ))}
                        {results.members.length >= 5 && (
                          <Link
                            href={`/member?q=${encodeURIComponent(query)}`}
                            className="block text-center text-sm text-pink-600 hover:text-pink-700 py-1"
                            onClick={() => setIsOpen(false)}
                          >
                            Lihat semua reseller
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              )}

              {/* Packages Tab */}
              <TabsContent value="packages">
                {!isLoading && query.trim().length >= 2 && results.length > 0 && (
                  <div className="space-y-1">
                    {results.map((pkg: any) => (
                      <div
                        key={pkg.id}
                        className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleItemClick(`/package/${pkg.id}`)}
                      >
                        <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                          <Package className="h-4 w-4 text-pink-600" />
                        </div>
                        <div>
                          <p className="font-medium">{pkg.name}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(pkg.pricePerWeek)}/Minggu • {pkg.tenor} Minggu
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions">
                {!isLoading && query.trim().length >= 2 && results.length > 0 && (
                  <div className="space-y-1">
                    {results.map((transaction: any) => (
                      <div
                        key={transaction.id}
                        className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleItemClick(`/transaction/${transaction.id}`)}
                      >
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.packageName}</p>
                          <p className="text-sm text-gray-500">
                            {transaction.customerName} • {transaction.resellerName}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Members Tab (Admin only) */}
              {userRole === "admin" && (
                <TabsContent value="members">
                  {!isLoading && query.trim().length >= 2 && results.length > 0 && (
                    <div className="space-y-1">
                      {results.map((member: any) => (
                        <div
                          key={member.id}
                          className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleItemClick(`/member/${member.id}`)}
                        >
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                            <Users className="h-4 w-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-500">
                              {member.email} • {member._count.transactions} Transaksi
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
            </div>
          </Tabs>

          <div className="p-4 border-t text-xs text-gray-500">
            Tekan <kbd className="px-1 py-0.5 bg-gray-100 rounded border">↵</kbd> untuk memilih,
            <kbd className="px-1 py-0.5 bg-gray-100 rounded border ml-1">Esc</kbd> untuk menutup
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

