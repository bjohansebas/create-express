import { Router } from 'express'
import { listUsers } from '../controllers/users.js'

export const usersRouter = Router()

usersRouter.get('/', listUsers)
