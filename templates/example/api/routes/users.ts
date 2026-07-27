import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { db } from '../db.ts'

interface User {
  id: number
  name: string
}

export const usersRouter = Router()

usersRouter.get('/', (_req: Request, res: Response) => {
  const users = db.prepare('SELECT id, name FROM users ORDER BY id').all() as unknown as User[]
  res.json(users)
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
