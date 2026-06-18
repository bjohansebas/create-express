import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'

interface User {
  id: number
  name: string
}

export const usersRouter = Router()

const users: User[] = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Alan Turing' },
]

usersRouter.get('/', (_req: Request, res: Response) => {
  res.json(users)
})

usersRouter.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  const user = users.find((entry) => entry.id === Number(req.params.id))
  if (!user) {
    next()
    return
  }
  res.json(user)
})
