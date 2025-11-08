/**
 * Create sub_tasks table
 * - id (pk)
 * - parent_task_id (fk tasks.id)
 * - title (string, not null)
 * - is_completed (boolean, default false)
 * - created_by (user id)
 * - created_at, updated_at
 */

exports.up = async function(knex) {
  const exists = await knex.schema.hasTable('sub_tasks')
  if (exists) return

  await knex.schema.createTable('sub_tasks', (table) => {
    table.increments('id').primary()
    table.integer('parent_task_id').notNullable().references('id').inTable('tasks').onDelete('CASCADE')
    table.string('title', 255).notNullable()
    table.boolean('is_completed').notNullable().defaultTo(false)
    table.integer('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.timestamp('created_at').defaultTo(knex.fn.now())
    table.timestamp('updated_at').defaultTo(knex.fn.now())
    table.index(['parent_task_id'])
  })
}

exports.down = async function(knex) {
  const exists = await knex.schema.hasTable('sub_tasks')
  if (!exists) return
  await knex.schema.dropTable('sub_tasks')
}



