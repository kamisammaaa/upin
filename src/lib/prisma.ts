import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const prismaClientSingleton = () => {
  const adapter = new PrismaBetterSqlite3({ url: process.env.DATABASE_URL || 'file:./dev.db' })
  const client = new PrismaClient({ adapter })
  // Aktifkan WAL mode: write & read bisa berjalan bersamaan (penting saat ujian berlangsung)
  // busy_timeout: tunggu 10 detik jika DB sedang terkunci sebelum throw error (mencegah SQLITE_BUSY)
  // synchronous=NORMAL: aman & jauh lebih cepat dari FULL
  // cache_size=-64000: alokasikan ~64 MB RAM untuk cache query SQLite
  // temp_store=MEMORY: simpan temporary table dan index di RAM
  client.$executeRawUnsafe('PRAGMA journal_mode=WAL').catch(() => {});
  client.$executeRawUnsafe('PRAGMA busy_timeout=10000').catch(() => {});
  client.$executeRawUnsafe('PRAGMA synchronous=NORMAL').catch(() => {});
  client.$executeRawUnsafe('PRAGMA cache_size=-64000').catch(() => {});
  client.$executeRawUnsafe('PRAGMA temp_store=MEMORY').catch(() => {});
  return client;
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

globalThis.prismaGlobal = prisma

