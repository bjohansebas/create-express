import { Router } from 'express'
import { usersRouter } from './users.js'

export const router = Router()

router.get('/', (_req, res) => {
  res.render('index', { title: 'Express' })
})

router.use('/users', usersRouter)
