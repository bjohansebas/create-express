import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { app } from './app.ts'

// Load variables from a local .env file when present.
if (existsSync('.env')) {
  loadEnvFile()
}

const PORT = Number(process.env.PORT) || 3000

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})

// Graceful shutdown: stop accepting connections and let in-flight requests finish.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    console.log(`${signal} received: closing server`)
    server.close(() => {
      console.log('Server closed')
    })
  })
}
