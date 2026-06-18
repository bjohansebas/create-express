import type { Request, Response } from 'express'
import express from 'express'

export const app = express()

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello, World!')
})
