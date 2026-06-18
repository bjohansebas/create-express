import { fileURLToPath } from 'node:url'

export function setupViews(app) {
  app.set('view engine', 'ejs')
  app.set('views', fileURLToPath(new URL('./views', import.meta.url)))
}
