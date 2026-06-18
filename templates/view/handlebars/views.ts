import { fileURLToPath } from 'node:url'
import type { Express } from 'express'

export function setupViews(app: Express): void {
  app.set('view engine', 'hbs')
  app.set('views', fileURLToPath(new URL('./views', import.meta.url)))
}
