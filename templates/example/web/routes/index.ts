import type { NextFunction, Request, Response } from 'express'
import { Router } from 'express'
import { z } from 'zod'

export const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.render('index', { title: 'Express' })
})

const greetingSchema = z.object({
  name: z.string().trim().min(1),
})

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  const result = greetingSchema.safeParse(req.body)
  if (!result.success) {
    next(Object.assign(new Error('A non-empty name is required'), { status: 400 }))
    return
  }

  res.render('index', { title: `Hello, ${result.data.name}!` })
})
