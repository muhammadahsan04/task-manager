/**
 * Create time_entries table
 * Columns:
 * - id (pk)
 * - task_id (fk -> tasks.id)
 * - user_id (fk -> users.id)
 * - start_time (timestamp with time zone, not null)
 * - end_time (timestamp with time zone, nullable while running)
 * - duration_minutes (integer, nullable; computed on stop/manual)
 * - description (text, nullable)
 * - created_at (timestamp, default now)
 */

exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('time_entries')
  if (exists) return

  await knex.schema.createTable('time_entries', (table) => {
    table.increments('id').primary()
    table.integer('task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE')
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.timestamp('start_time', { useTz: true }).notNullable()
    table.timestamp('end_time', { useTz: true }).nullable()
    table.integer('duration_minutes').nullable()
    table.text('description').nullable()
    table.timestamp('created_at').defaultTo(knex.fn.now())

    table.index(['task_id'])
    table.index(['user_id'])
    table.index(['task_id', 'user_id'])
  })
}

exports.down = async function(knex) {
  const exists = await knex.schema.hasTable('time_entries')
  if (!exists) return
  await knex.schema.dropTable('time_entries')
}


