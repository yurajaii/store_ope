/* global process */

import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

let pool

export function getDb() {
  if (!pool) {
    const dbUri = process.env.DB_URI

    if (!dbUri) {
      throw new Error('DB_URI is not defined in environment variables')
    }

    pool = new Pool({
      connectionString: dbUri,
    })

    pool
      .connect()
      .then((client) => {
        console.log('🟢 PostgreSQL connected')
        client.release()
      })
      .catch((err) => {
        console.error('🔴 PostgreSQL connection error', err)
      })
  }

  return pool
}
