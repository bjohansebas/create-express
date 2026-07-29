import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'

export const usersRouter = Router()

const createUserSchema = z.object({
  name: z.string().trim().min(1),
})

usersRouter.get('/', (_req, res) => {
  res.json(db.prepare('SELECT id, name FROM users ORDER BY id').all())
})

usersRouter.post('/', (req, res) => {
  const result = createUserSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues })
    return
  }

  const { name } = result.data
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
