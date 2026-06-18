import type { Express } from 'express'

export function setupViews(app: Express): void {
  app.set('view engine', 'ejs')
  app.set('views', 'views')
}
