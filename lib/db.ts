import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const getPrisma = () => {
  // Frequently, Next.js statically replaces process.env variables at build time. 
  // If it was undefined at build time, it becomes the string "undefined".
  let connectionString = process.env.DATABASE_URL
  if (connectionString === "undefined") {
    connectionString = ''
  }

  if (!connectionString) {
    throw new Error("DATABASE_URL must be set and valid in your .env file")
  }

  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool)

  const client = new PrismaClient({
    adapter,
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ],
  })

  client.$on('query', (e: any) => {
    console.log(`[Prisma Exec] \x1b[32m${e.duration}ms\x1b[0m`)
  })

  return client
}

export const db = globalForPrisma.prisma ?? getPrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
