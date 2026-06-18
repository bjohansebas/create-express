import type { Request, Response } from 'express'
import { findAllUsers } from '../services/users.ts'

export function listUsers(_req: Request, res: Response): void {
  res.render('users', { users: findAllUsers() })
}
