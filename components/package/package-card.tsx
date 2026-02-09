import Link from "next/link"
import Image from "next/image"
import type { Package } from "@prisma/client"
import { formatCurrency } from "@/lib/utils"

interface PackageCardProps {
  package: Package
  isAdmin: boolean
}

export default function PackageCard({ package: pkg, isAdmin }: PackageCardProps) {
  return (
    <Link
      href={`/package/${pkg.id}`}
      className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100"
    >
      <div className="relative h-40 bg-gray-100">
        {pkg.photo ? (
          <Image src={pkg.photo || "/placeholder.svg"} alt={pkg.name} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-pink-50">
            <span className="text-pink-300 text-lg">No Image</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">{pkg.name}</h3>

        <div className="flex justify-between items-center mt-2">
          <div className="text-pink-600 font-medium">{formatCurrency(pkg.pricePerWeek)}/Minggu</div>
          <div className="text-sm text-gray-500">{pkg.tenor} Minggu</div>
        </div>

        {isAdmin && (
          <div className="mt-2 text-xs text-gray-500">
            {/* You could add admin-specific info here */}
            {pkg.isEligibleBonus ? <span className="text-green-600">Berhak Bonus</span> : <span>No Bonus</span>}
          </div>
        )}
      </div>
    </Link>
  )
}

