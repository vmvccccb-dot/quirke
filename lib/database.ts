import { Pool } from 'pg'

const globalForPostgres = globalThis as typeof globalThis & {
  postgresPool?: Pool
}

function createPool() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('Falta DATABASE_URL en las variables de entorno.')
  }

  return new Pool({
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  })
}

export function getDatabase() {
  if (!globalForPostgres.postgresPool) {
    globalForPostgres.postgresPool = createPool()
  }
  return globalForPostgres.postgresPool
}