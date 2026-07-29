import { Router } from 'express'
import { db } from '../db.js'

export const usersRouter = Router()

usersRouter.get('/', (_req, res) => {
  res.json(db.prepare('SELECT id, name FROM users ORDER BY id').all())
})

usersRouter.post('/', (req, res) => {
  const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
  if (!name) {
    res.status(400).json({ error: 'name is required' })
    return
  }

  const { lastInsertRowid } = db.prepare('INSERT INTO users (name) VALUES (?)').run(name)
  res.status(201).json({ id: Number(lastInsertRowid), name })
})

usersRouter.get('/:id', (req, res, next) => {
  const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(Number(req.params.id))
  if (!user) {
    next()
    return
  }
  res.json(user)
})
