import { PrismaClient } from "@prisma/client"
import { hash } from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  // Create admin user
  const adminPassword = await hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin",
      password: adminPassword,
      role: "admin",
    },
  })

  // Create reseller user
  const resellerPassword = await hash("reseller123", 10)
  const reseller = await prisma.user.upsert({
    where: { email: "reseller@example.com" },
    update: {},
    create: {
      email: "reseller@example.com",
      name: "Reseller Demo",
      password: resellerPassword,
      role: "reseller",
    },
  })

  // Create package types
  const moneyPackageType = await prisma.packageType.upsert({
    where: { id: "money-package-type" },
    update: {},
    create: {
      id: "money-package-type",
      name: "Paket Uang",
      icon: "/icons/money.svg",
    },
  })

  const foodPackageType = await prisma.packageType.upsert({
    where: { id: "food-package-type" },
    update: {},
    create: {
      id: "food-package-type",
      name: "Paket Makanan",
      icon: "/icons/food.svg",
    },
  })

  // Create packages
  const moneyPackage = await prisma.package.upsert({
    where: { id: "money-package-1" },
    update: {},
    create: {
      id: "money-package-1",
      name: "Paket Uang 1 Juta",
      description: "Paket uang tunai senilai 1 juta rupiah",
      pricePerWeek: 20833.33,
      tenor: 48,
      photo: "/packages/money.jpg",
      isEligibleBonus: true,
      packageTypeId: moneyPackageType.id,
    },
  })

  const foodPackage = await prisma.package.upsert({
    where: { id: "food-package-1" },
    update: {},
    create: {
      id: "food-package-1",
      name: "Paket Sembako Bulanan",
      description: "Paket sembako lengkap untuk kebutuhan bulanan",
      pricePerWeek: 50000,
      tenor: 24,
      photo: "/packages/food.jpg",
      isEligibleBonus: false,
      packageTypeId: foodPackageType.id,
    },
  })

  // Create payment methods
  const paymentMethods = [
    {
      name: "BCA",
      accountNumber: "1234567890",
      accountHolder: "PT Paket Cicilan",
      logo: "/banks/bca.svg",
      type: "bank",
    },
    {
      name: "BNI",
      accountNumber: "0987654321",
      accountHolder: "PT Paket Cicilan",
      logo: "/banks/bni.svg",
      type: "bank",
    },
    {
      name: "Mandiri",
      accountNumber: "1122334455",
      accountHolder: "PT Paket Cicilan",
      logo: "/banks/mandiri.svg",
      type: "bank",
    },
    {
      name: "BRI",
      accountNumber: "5544332211",
      accountHolder: "PT Paket Cicilan",
      logo: "/banks/bri.svg",
      type: "bank",
    },
    {
      name: "CIMB Niaga",
      accountNumber: "9876543210",
      accountHolder: "PT Paket Cicilan",
      logo: "/banks/cimb.svg",
      type: "bank",
    },
    {
      name: "Tunai",
      type: "cash",
      logo: "/icons/cash.svg",
    },
  ]

  for (const method of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { id: `payment-method-${method.name}` },
      update: {},
      create: {
        id: `payment-method-${method.name}`,
        ...method,
      },
    })
  }

  console.log("Seed data created successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

