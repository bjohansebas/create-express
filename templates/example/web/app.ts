import { fileURLToPath } from 'node:url'
import type { NextFunction, Request, Response } from 'express'
import express from 'express'
import logger from 'morgan'
import { errorHandler } from './middleware/error-handler.ts'
import { router } from './routes/index.ts'
import { setupViews } from './views.ts'

export const app = express()

setupViews(app)

app.use(logger('dev'))
app.use(express.urlencoded({ extended: false }))
app.use(express.static(fileURLToPath(new URL('./public', import.meta.url))))

app.use('/', router)

// Forward any unmatched route to the error handler as a 404.
app.use((_req: Request, _res: Response, next: NextFunction) => {
  const error = Object.assign(new Error('Not Found'), { status: 404 })
  next(error)
})

app.use(errorHandler)
