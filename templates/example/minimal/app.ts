import type { Request, Response } from 'express'
import express from 'express'
import { z } from 'zod'

export const app = express()

app.use(express.json())

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello, World!')
})

const greetingSchema = z.object({
  name: z.string().trim().min(1),
})

app.post('/', (req: Request, res: Response) => {
  const result = greetingSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({ errors: result.error.issues })
    return
  }

  res.json({ message: `Hello, ${result.data.name}!` })
})
