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
