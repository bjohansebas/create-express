import type { NextFunction, Request, Response } from 'express'

interface HttpError extends Error {
  status?: number
}

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err.status ?? 500
  res.status(status).render('error', {
    status,
    message: err.message || 'Internal Server Error',
  })
}
