import { PrismaClient } from '@prisma/client'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

neonConfig.webSocketConstructor = ws

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaNeon(pool)

const getPrisma = () => {
  const client = new PrismaClient({
    adapter,
    log: [
      { emit: 'event', level: 'query' },
      { emit: 'stdout', level: 'error' },
      { emit: 'stdout', level: 'warn' },
    ],
  })

  client.$on('query', (e: any) => {
    console.log(`[Prisma] query executed in ${e.duration}ms`)
    console.log(`Query: ${e.query}`)
  })

  return client
}

export const db = globalForPrisma.prisma ?? getPrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
