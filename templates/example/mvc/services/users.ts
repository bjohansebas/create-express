import { db } from '../db.ts'

export interface User {
  id: number
  name: string
}

export function findAllUsers(): User[] {
  return db.prepare('SELECT id, name FROM users ORDER BY id').all() as unknown as User[]
}

export function findUserById(id: number): User | undefined {
  return db.prepare('SELECT id, name FROM users WHERE id = ?').get(id) as User | undefined
}

export function createUser(name: string): User {
  const { lastInsertRowid } = db.prepare('INSERT INTO users (name) VALUES (?)').run(name)
  return { id: Number(lastInsertRowid), name }
}
