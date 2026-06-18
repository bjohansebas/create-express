import type { Express } from 'express'

export function setupViews(app: Express): void {
  app.set('view engine', 'pug')
  app.set('views', 'views')
}
