import { defineConfig } from '@prisma/config'

export default defineConfig({
  earlyAccess: true, // @ts-ignore
  migrate: {
    url: process.env.DATABASE_URL,
  },
})
