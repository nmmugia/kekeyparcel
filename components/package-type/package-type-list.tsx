import Link from "next/link"
import { Plus, FolderPlus, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PackageType {
  id: string
  name: string
  icon: string | null
  packages: any[]
  _count: {
    packages: number
  }
}

interface PackageTypeListProps {
  packageTypes: PackageType[]
  isAdmin: boolean
}

export default function PackageTypeList({ packageTypes, isAdmin }: PackageTypeListProps) {
  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Link href="/package-type/create">
            <Button className="bg-pink-500 hover:bg-pink-600">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Tipe Paket
            </Button>
          </Link>
        </div>
      )}

      {packageTypes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packageTypes.map((packageType) => (
            <Link key={packageType.id} href={`/package-type/${packageType.id}`}>
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-2 flex items-center justify-center text-pink-500">
                      <FolderPlus className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{packageType.name}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-500">
                      <Package className="h-4 w-4 mr-1" />
                      <span>{packageType._count.packages} Paket</span>
                    </div>
                    <Button variant="ghost" size="sm" className="text-pink-500">
                      Lihat Detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">Belum ada tipe paket</p>

          {isAdmin && (
            <Link href="/package-type/create">
              <Button className="bg-pink-500 hover:bg-pink-600">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Tipe Paket
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

