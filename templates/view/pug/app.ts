import { fileURLToPath } from 'node:url'
import type { Request, Response } from 'express'
import express from 'express'

export const app = express()

app.set('view engine', 'pug')
app.set('views', fileURLToPath(new URL('./views', import.meta.url)))

app.get('/', (_req: Request, res: Response) => {
  res.render('index', { title: 'Express' })
})
