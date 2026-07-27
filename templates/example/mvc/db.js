import { DatabaseSync } from 'node:sqlite'

// In-memory by default so the starter runs anywhere; set DB_PATH to a file
// (e.g. ./data.db) to persist between restarts.
export const db = new DatabaseSync(process.env.DB_PATH ?? ':memory:')

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  )
`)

// Seed the sample data once; a persistent database keeps its rows.
const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get()
if (count === 0) {
  const insertUser = db.prepare('INSERT INTO users (name) VALUES (?)')
  insertUser.run('Ada Lovelace')
  insertUser.run('Alan Turing')
}
