import Link from "next/link"
import Image from "next/image"
import type { PackageType, Package } from "@prisma/client"
import { ChevronRight, Plus } from "lucide-react"
import PackageCard from "@/components/package/package-card"

interface PackageTypeWithPackages extends PackageType {
  packages: Package[]
}

interface PackageTypeListProps {
  packageTypes: PackageTypeWithPackages[]
  isAdmin: boolean
}

export default function PackageTypeList({ packageTypes, isAdmin }: PackageTypeListProps) {
  return (
    <div className="space-y-8">
      {packageTypes.map((packageType) => (
        <div key={packageType.id} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {packageType.icon && (
                <div className="w-8 h-8 mr-2 relative">
                  <Image
                    src={packageType.icon || "/placeholder.svg"}
                    alt={packageType.name}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <h2 className="text-xl font-semibold text-gray-800">{packageType.name}</h2>
            </div>

            <Link
              href={`/package-type/${packageType.id}`}
              className="flex items-center text-sm text-pink-600 hover:text-pink-700"
            >
              <span>Lihat Detail</span>
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>

          {packageType.packages.length > 0 ? (
            <div className="overflow-x-auto pb-2">
              <div className="flex space-x-4">
                {packageType.packages.map((pkg) => (
                  <div key={pkg.id} className="w-64 flex-shrink-0">
                    <PackageCard package={pkg} isAdmin={isAdmin} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-500">Belum ada paket untuk kategori ini</p>

              {isAdmin && (
                <Link
                  href={`/package/create?typeId=${packageType.id}`}
                  className="mt-4 inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Paket
                </Link>
              )}
            </div>
          )}
        </div>
      ))}

      {packageTypes.length === 0 && (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">Belum ada tipe paket</p>

          {isAdmin && (
            <Link
              href="/package-type/create"
              className="inline-flex items-center px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tambah Tipe Paket
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

