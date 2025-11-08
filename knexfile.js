require('dotenv').config();

/**
 * Knex configuration
 * Usage:
 *   npx knex migrate:latest
 *   npx knex migrate:rollback
 *   npx knex migrate:status
 */

module.exports = {
  development: {
    client: 'pg',
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'ahsan123',
      database: process.env.DB_NAME || 'team-task-manager',
    },
    pool: { min: 2, max: 10 },
    migrations: {
      tableName: 'knex_migrations',
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  },
};