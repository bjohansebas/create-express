import { Umzug } from 'umzug'
import { db } from './db.js'

// Bookkeeping for the migration system itself (knex's `knex_migrations`,
// Prisma's `_prisma_migrations`): it is the one table that cannot be a
// migration, since Umzug reads it to know which migrations already ran.
db.exec('CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY)')

const storage = {
  async logMigration({ name }) {
    db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name)
  },
  async unlogMigration({ name }) {
    db.prepare('DELETE FROM migrations WHERE name = ?').run(name)
  },
  async executed() {
    return db
      .prepare('SELECT name FROM migrations ORDER BY name')
      .all()
      .map((row) => row.name)
  },
}

export const migrator = new Umzug({
  migrations: { glob: 'migrations/*.js' },
  context: db,
  storage,
  logger: undefined,
})

// `npm run db:migrate` applies pending migrations standalone; the server does
// the same on boot before it starts listening.
if (import.meta.main) {
  await migrator.up()
}
