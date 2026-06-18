import { Router } from 'express'

export const usersRouter = Router()

const users = [
  { id: 1, name: 'Ada Lovelace' },
  { id: 2, name: 'Alan Turing' },
]

usersRouter.get('/', (_req, res) => {
  res.json(users)
})

usersRouter.get('/:id', (req, res, next) => {
  const user = users.find((entry) => entry.id === Number(req.params.id))
  if (!user) {
    next()
    return
  }
  res.json(user)
})
