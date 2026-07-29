import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.ts'

interface User {
  id: number
  name: string
}

export const usersRouter = Router()

const createUserSchema = z.object({
  name: z.string().trim().min(1),
})

usersRouter.get('/', (_req: Request, res: Response) => {
  const users = db.prepare('SELECT id, name FROM users ORDER BY id').all() as unknown as User[]
  res.json(users)
})

usersRouter.post('/', (req: Request, res: Response) => {
  const result = createUserSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues })
    return
  }

  const { name } = result.data
  const { lastInsertRowid } = db.prepare('INSERT INTO users (name) VALUES (?)').run(name)
  res.status(201).json({ id: Number(lastInsertRowid), name })
})

usersRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const statement = db.prepare('SELECT id, name FROM users WHERE id = ?')
  const user = statement.get(Number(req.params.id)) as User | undefined
  if (!user) {
    next()
    return
  }
  res.json(user)
})
