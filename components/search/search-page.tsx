"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Package, FileText, Users, Search } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import EmptyState from "@/components/empty-state"
import UserAvatar from "@/components/user-avatar"

interface SearchPageProps {
  initialQuery: string
  initialType: string
  userRole: string
}

export default function SearchPage({ initialQuery, initialType, userRole }: SearchPageProps) {
  const [query, setQuery] = useState(initialQuery)
  const [activeTab, setActiveTab] = useState(initialType)
  const [results, setResults] = useState<any>({})
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Update URL when query or tab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())

    if (query) {
      params.set("q", query)
    } else {
      params.delete("q")
    }

    params.set("type", activeTab)

    const newUrl = `${pathname}?${params.toString()}`
    router.push(newUrl)

    // Perform search if query is not empty
    if (query.trim().length >= 2) {
      performSearch()
    } else {
      setResults({})
    }
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pencarian</CardTitle>
          <CardDescription>Cari paket, transaksi, dan reseller</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input placeholder="Cari..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-10" />
          </div>

          <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">Semua</TabsTrigger>
              <TabsTrigger value="packages">Paket</TabsTrigger>
              <TabsTrigger value="transactions">Transaksi</TabsTrigger>
              {userRole === "admin" && <TabsTrigger value="members">Reseller</TabsTrigger>}
            </TabsList>

            <div className="mt-4">
              {isLoading ? (
                <div className="space-y-4 py-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i}>
                      <CardContent className="p-4">
                        <div className="flex items-center">
                          <Skeleton className="h-10 w-10 rounded-full mr-3" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : query.trim().length < 2 ? (
                <EmptyState
                  icon={Search}
                  title="Masukkan kata kunci pencarian"
                  description="Masukkan minimal 2 karakter untuk mencari"
                />
              ) : !hasResults() ? (
                <EmptyState icon={Search} title="Tidak ada hasil" description={`Tidak ada hasil untuk "${query}"`} />
              ) : (
                <>
                  <TabsContent value="all" className="space-y-6">
                    {/* Packages */}
                    {results.packages && results.packages.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Package className="h-5 w-5 mr-2 text-pink-500" />
                          Paket
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {results.packages.map((pkg: any) => (
                            <Link key={pkg.id} href={`/package/${pkg.id}`}>
                              <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                                      <Package className="h-5 w-5 text-pink-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{pkg.name}</h4>
                                      <p className="text-sm text-gray-500">
                                        {formatCurrency(pkg.pricePerWeek)}/Minggu • {pkg.tenor} Minggu
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transactions */}
                    {results.transactions && results.transactions.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <FileText className="h-5 w-5 mr-2 text-pink-500" />
                          Transaksi
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {results.transactions.map((transaction: any) => (
                            <Link key={transaction.id} href={`/transaction/${transaction.id}`}>
                              <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-center">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                      <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-medium">{transaction.packageName}</h4>
                                      <p className="text-sm text-gray-500">
                                        {transaction.customerName} • {transaction.resellerName}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Members (Admin only) */}
                    {userRole === "admin" && results.members && results.members.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-3 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-pink-500" />
                          Reseller
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {results.members.map((member: any) => (
                            <Link key={member.id} href={`/member/${member.id}`}>
                              <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-center">
                                    <UserAvatar name={member.name} size="md" showTooltip={false} />
                                    <div className="ml-3">
                                      <h4 className="font-medium">{member.name}</h4>
                                      <p className="text-sm text-gray-500">
                                        {member.email} • {member._count.transactions} Transaksi
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Other tabs content */}
                  <TabsContent value="packages">
                    {results.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.map((pkg: any) => (
                          <Link key={pkg.id} href={`/package/${pkg.id}`}>
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mr-3">
                                    <Package className="h-5 w-5 text-pink-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{pkg.name}</h4>
                                    <p className="text-sm text-gray-500">
                                      {formatCurrency(pkg.pricePerWeek)}/Minggu • {pkg.tenor} Minggu
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="transactions">
                    {results.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {results.map((transaction: any) => (
                          <Link key={transaction.id} href={`/transaction/${transaction.id}`}>
                            <Card className="hover:shadow-md transition-shadow">
                              <CardContent className="p-4">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <FileText className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium">{transaction.packageName}</h4>
                                    <p className="text-sm text-gray-500">
                                      {transaction.customerName} • {transaction.resellerName}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  {userRole === "admin" && (
                    <TabsContent value="members">
                      {results.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {results.map((member: any) => (
                            <Link key={member.id} href={`/member/${member.id}`}>
                              <Card className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                                  <div className="flex items-center">
                                    <UserAvatar name={member.name} size="md" showTooltip={false} />
                                    <div className="ml-3">
                                      <h4 className="font-medium">{member.name}</h4>
                                      <p className="text-sm text-gray-500">
                                        {member.email} • {member._count.transactions} Transaksi
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  )}
                </>
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

