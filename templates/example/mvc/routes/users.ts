import { Router } from 'express'
import { listUsers } from '../controllers/users.ts'

export const usersRouter = Router()

usersRouter.get('/', listUsers)
