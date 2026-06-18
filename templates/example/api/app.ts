import type { NextFunction, Request, Response } from 'express'
import express from 'express'
import logger from 'morgan'
import { errorHandler } from './middleware/error-handler.ts'
import { usersRouter } from './routes/users.ts'

export const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Hello, World!' })
})

app.use('/api/users', usersRouter)

// Forward any unmatched route to the error handler as a 404.
app.use((_req: Request, _res: Response, next: NextFunction) => {
  const error = Object.assign(new Error('Not Found'), { status: 404 })
  next(error)
})

app.use(errorHandler)
