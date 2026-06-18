import express from 'express'
import logger from 'morgan'
import { errorHandler } from './middleware/error-handler.js'
import { usersRouter } from './routes/users.js'

export const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/', (_req, res) => {
  res.json({ message: 'Hello, World!' })
})

app.use('/api/users', usersRouter)

// Forward any unmatched route to the error handler as a 404.
app.use((_req, _res, next) => {
  const error = new Error('Not Found')
  error.status = 404
  next(error)
})

app.use(errorHandler)
