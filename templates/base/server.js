import cluster from 'node:cluster'
import { existsSync } from 'node:fs'
import { availableParallelism } from 'node:os'
import { loadEnvFile } from 'node:process'

// Load variables from a local .env file when present.
if (existsSync('.env')) {
  loadEnvFile()
}

if (cluster.isPrimary) {
  // One worker per core by default; set WEB_CONCURRENCY to override.
  const workers = Number(process.env.WEB_CONCURRENCY) || availableParallelism()
  for (let i = 0; i < workers; i++) {
    cluster.fork()
  }

  // Replace workers that crash; workers that exited cleanly stay down.
  cluster.on('exit', (worker, code) => {
    if (code !== 0 && !worker.exitedAfterDisconnect) {
      console.log(`Worker ${worker.process.pid} died: starting a new one`)
      cluster.fork()
    }
  })

  // Graceful shutdown: forward the signal to every worker.
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      console.log(`${signal} received: closing workers`)
      for (const worker of Object.values(cluster.workers ?? {})) {
        worker?.process.kill(signal)
      }
    })
  }
} else {
  const { app } = await import('./app.js')

  const PORT = process.env.PORT || 3000

  const server = app.listen(PORT, () => {
    console.log(`Worker ${process.pid} is running on http://localhost:${PORT}`)
  })

  // Graceful shutdown: stop accepting connections and let in-flight requests
  // finish. The guard keeps a repeated signal from closing twice.
  let closing = false
  for (const signal of ['SIGTERM', 'SIGINT']) {
    process.on(signal, () => {
      if (closing) {
        return
      }
      closing = true
      server.close(() => {
        console.log(`Worker ${process.pid} closed`)
        // Drop the IPC channel to the primary so the process can exit.
        cluster.worker?.disconnect()
      })
    })
  }
}
