import { Router } from 'express'
import { getUser, listUsers } from '../controllers/users.js'

export const usersRouter = Router()

usersRouter.get('/', listUsers)
usersRouter.get('/:id', getUser)
