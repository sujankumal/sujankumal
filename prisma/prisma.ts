// import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/../.prisma/app/generated/prisma/client'

const connectionString = process.env.POSTGRES_PRISMA_URL ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('POSTGRES_PRISMA_URL or DATABASE_URL must be set to initialize Prisma Client')
}

const adapter = new PrismaPg({ connectionString })

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
