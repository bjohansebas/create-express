import { z } from 'zod'
import { createUser, findAllUsers } from '../services/users.js'

export function listUsers(_req, res) {
  res.render('users', { users: findAllUsers() })
}

const createUserSchema = z.object({
  name: z.string().trim().min(1),
})

export function addUser(req, res, next) {
  const result = createUserSchema.safeParse(req.body)
  if (!result.success) {
    next(Object.assign(new Error('A non-empty name is required'), { status: 400 }))
    return
  }

  createUser(result.data.name)
  res.redirect('/users')
}
