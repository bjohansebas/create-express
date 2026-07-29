import { DatabaseSync } from 'node:sqlite'

// In-memory by default so the starter runs anywhere; set DB_PATH to a file
// (e.g. ./data.db) to persist between restarts.
export const db = new DatabaseSync(process.env.DB_PATH ?? ':memory:')
