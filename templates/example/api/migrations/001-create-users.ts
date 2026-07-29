import type { DatabaseSync } from 'node:sqlite'

export async function up({ context: db }: { context: DatabaseSync }) {
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL
    )
  `)
  const insertUser = db.prepare('INSERT INTO users (name) VALUES (?)')
  insertUser.run('Ada Lovelace')
  insertUser.run('Alan Turing')
}

export async function down({ context: db }: { context: DatabaseSync }) {
  db.exec('DROP TABLE users')
}
