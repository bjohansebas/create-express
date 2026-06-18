import type { NextFunction, Request, Response } from 'express'
import { findAllUsers, findUserById } from '../services/users.ts'

export function listUsers(_req: Request, res: Response): void {
  res.json(findAllUsers())
}

export function getUser(req: Request, res: Response, next: NextFunction): void {
  const user = findUserById(Number(req.params.id))
  if (!user) {
    next()
    return
  }
  res.json(user)
}
