"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { LoadingOverlay } from "@/components/loading-spinner"
import { Check, X, Clock, Trash2, AlertTriangle, User } from "lucide-react"

interface DeletionRequest {
  id: string
  transactionId: string
  reason: string
  status: string
  adminNote: string | null
  createdAt: string
  transaction: {
    id: string
    packageName: string
    customerName: string
    pricePerWeek: number
    tenor: number
    resellerName: string
    createdAt: string
    payments: any[]
  }
  requestedBy: {
    id: string
    name: string
    email: string
  }
}

export default function DeletionRequestsList() {
  const [activeTab, setActiveTab] = useState("pending")
  const [requests, setRequests] = useState<DeletionRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null)
  const [adminNote, setAdminNote] = useState("")
  const { toast } = useToast()

  const fetchRequests = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/deletion-requests?status=${activeTab}`)
      if (!response.ok) throw new Error("Failed to fetch")
      const data = await response.json()
      setRequests(data)
    } catch (error) {
      console.error("Error fetching deletion requests:", error)
      toast({
        title: "Gagal memuat data",
        description: "Terjadi kesalahan saat memuat permintaan hapus",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [activeTab, toast])

  useEffect(() => {
    fetchRequests()
  }, [fetchRequests])

  const handleAction = (request: DeletionRequest, action: "approve" | "reject") => {
    setSelectedRequest(request)
    setActionType(action)
    setAdminNote("")
  }

  const processAction = async () => {
    if (!selectedRequest || !actionType) return

    setIsProcessing(true)
    try {
      const response = await fetch(`/api/deletion-requests/${selectedRequest.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: actionType === "approve" ? "approved" : "rejected",
          adminNote: adminNote || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to process request")
      }

      toast({
        title: actionType === "approve" ? "Transaksi berhasil dihapus" : "Permintaan ditolak",
        description:
          actionType === "approve"
            ? "Transaksi dan semua data terkait telah dihapus"
            : "Permintaan hapus telah ditolak",
      })

      setSelectedRequest(null)
      setActionType(null)
      fetchRequests()
    } catch (error: any) {
      toast({
        title: "Gagal memproses",
        description: error.message || "Terjadi kesalahan",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      {isProcessing && <LoadingOverlay />}

      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="pending">Menunggu</TabsTrigger>
          <TabsTrigger value="approved">Disetujui</TabsTrigger>
          <TabsTrigger value="rejected">Ditolak</TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected"].map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-4">
            {isLoading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
              </div>
            ) : requests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="bg-gray-50 p-6 rounded-lg text-center">
                    <p className="text-gray-500">
                      {tab === "pending"
                        ? "Tidak ada permintaan yang menunggu persetujuan"
                        : tab === "approved"
                          ? "Belum ada permintaan yang disetujui"
                          : "Belum ada permintaan yang ditolak"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <div
                      className={`h-1 ${
                        request.status === "pending"
                          ? "bg-yellow-400"
                          : request.status === "approved"
                            ? "bg-green-400"
                            : "bg-red-400"
                      }`}
                    />
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        {/* Requester info */}
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="h-4 w-4" />
                          <span>
                            Diminta oleh <strong>{request.requestedBy.name}</strong> ({request.requestedBy.email})
                          </span>
                        </div>

                        {/* Transaction info */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <h3 className="font-semibold text-gray-800">{request.transaction.packageName}</h3>
                          <p className="text-sm text-gray-600">Pelanggan: {request.transaction.customerName}</p>
                          <p className="text-sm text-gray-600">Reseller: {request.transaction.resellerName}</p>
                          <div className="flex gap-4 mt-2">
                            <div>
                              <p className="text-xs text-gray-500">Total</p>
                              <p className="font-medium text-sm">
                                {formatCurrency(request.transaction.pricePerWeek * request.transaction.tenor)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Pembayaran</p>
                              <p className="font-medium text-sm">{request.transaction.payments.length} kali</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Tanggal Transaksi</p>
                              <p className="font-medium text-sm">{formatDate(request.transaction.createdAt)}</p>
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                          <p className="text-xs font-medium text-yellow-800 mb-1 flex items-center">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Alasan Penghapusan:
                          </p>
                          <p className="text-sm text-yellow-900">{request.reason}</p>
                        </div>

                        {/* Admin note (for processed requests) */}
                        {request.adminNote && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-xs font-medium text-blue-800 mb-1">Catatan Admin:</p>
                            <p className="text-sm text-blue-900">{request.adminNote}</p>
                          </div>
                        )}

                        {/* Timestamp */}
                        <p className="text-xs text-gray-400">
                          Diminta pada: {formatDateTime(request.createdAt)}
                        </p>

                        {/* Action buttons (only for pending) */}
                        {request.status === "pending" && (
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 flex-1"
                              onClick={() => handleAction(request, "approve")}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Setujui & Hapus
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              onClick={() => handleAction(request, "reject")}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Tolak
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog
        open={!!selectedRequest && !!actionType}
        onOpenChange={() => {
          setSelectedRequest(null)
          setActionType(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Setujui Penghapusan" : "Tolak Penghapusan"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {actionType === "approve" ? (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm text-red-700 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Transaksi <strong className="mx-1">{selectedRequest?.transaction.packageName}</strong> untuk
                  pelanggan <strong className="mx-1">{selectedRequest?.transaction.customerName}</strong> akan dihapus
                  permanen beserta semua data pembayaran.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">
                Permintaan hapus untuk transaksi{" "}
                <strong>{selectedRequest?.transaction.packageName}</strong> akan ditolak.
              </p>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">
                Catatan admin (opsional)
              </label>
              <textarea
                className="mt-1 w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-pink-500 focus:border-pink-500"
                rows={2}
                placeholder="Tambahkan catatan..."
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRequest(null)
                setActionType(null)
              }}
            >
              Batal
            </Button>
            <Button
              variant={actionType === "approve" ? "destructive" : "default"}
              onClick={processAction}
              disabled={isProcessing}
            >
              {isProcessing
                ? "Memproses..."
                : actionType === "approve"
                  ? "Ya, Hapus Transaksi"
                  : "Tolak Permintaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
