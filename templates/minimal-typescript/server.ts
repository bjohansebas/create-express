import type { Request, Response } from 'express'
import express from 'express'

const app = express()
const PORT: number = Number(process.env.PORT || 3000)

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello, World!')
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
