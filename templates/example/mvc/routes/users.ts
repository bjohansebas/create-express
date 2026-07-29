import { Router } from 'express'
import { addUser, listUsers } from '../controllers/users.ts'

export const usersRouter = Router()

usersRouter.get('/', listUsers)
usersRouter.post('/', addUser)
