import { knex, Knex } from 'knex'
import { env } from './env'

export const config: Knex.Config = {
  client: env.DATABASE_CLIENT,
  connection:
    env.DATABASE_CLIENT === 'sqlite'
      ? {
          filename: env.DATABASE_URL,
        }
      : env.DATABASE_URL,
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './db/migrations',
  },
}

export const KnexDB = knex(config)

// command create migrate =>  migrate:make create-documents
// config tables and command use: migrate:lates
// remakes item on table command use: migrate:rollback
