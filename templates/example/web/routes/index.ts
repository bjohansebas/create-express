import type { Request, Response } from 'express'
import { Router } from 'express'

export const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.render('index', { title: 'Express' })
})
