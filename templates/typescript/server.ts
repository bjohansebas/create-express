import { existsSync } from 'node:fs'
import { loadEnvFile } from 'node:process'
import { app } from './app.ts'

// Load variables from a local .env file when present.
if (existsSync('.env')) {
  loadEnvFile()
}

const PORT = Number(process.env.PORT) || 3000

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
