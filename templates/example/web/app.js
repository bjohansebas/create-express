import { fileURLToPath } from 'node:url'
import express from 'express'
import logger from 'morgan'
import { errorHandler } from './middleware/error-handler.js'
import { router } from './routes/index.js'
import { setupViews } from './views.js'

export const app = express()

setupViews(app)

app.use(logger('dev'))
app.use(express.urlencoded({ extended: false }))
app.use(express.static(fileURLToPath(new URL('./public', import.meta.url))))

app.use('/', router)

// Forward any unmatched route to the error handler as a 404.
app.use((_req, _res, next) => {
  const error = new Error('Not Found')
  error.status = 404
  next(error)
})

app.use(errorHandler)
