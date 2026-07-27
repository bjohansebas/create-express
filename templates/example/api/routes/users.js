import { Router } from 'express'
import { db } from '../db.js'

export const usersRouter = Router()

usersRouter.get('/', (_req, res) => {
  res.json(db.prepare('SELECT id, name FROM users ORDER BY id').all())
})

usersRouter.get('/:id', (req, res, next) => {
  const user = db.prepare('SELECT id, name FROM users WHERE id = ?').get(Number(req.params.id))
  if (!user) {
    next()
    return
  }
  res.json(user)
})
