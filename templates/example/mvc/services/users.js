import { db } from '../db.js'

export function findAllUsers() {
  return db.prepare('SELECT id, name FROM users ORDER BY id').all()
}

export function findUserById(id) {
  return db.prepare('SELECT id, name FROM users WHERE id = ?').get(id)
}
