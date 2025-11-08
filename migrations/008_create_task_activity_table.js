/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('task_activity', (table) => {
    table.increments('id').primary();
    table.integer('task_id').unsigned().notNullable()
      .references('id').inTable('tasks').onDelete('CASCADE');
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('action_type').notNullable(); // created, updated_status, updated_priority, assigned, commented, etc.
    table.string('field_changed'); // status, priority, assigned_to, title, etc.
    table.text('old_value');
    table.text('new_value');
    table.text('description'); // Human-readable description
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('task_id');
    table.index('user_id');
    table.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('task_activity');
};
