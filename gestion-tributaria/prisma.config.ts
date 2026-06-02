import { defineConfig } from '@prisma/config'
import { config } from 'dotenv'
config({ path: '.env.local' })

export default defineConfig({
  migrations: {
    seed: "tsx prisma/seeds/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})