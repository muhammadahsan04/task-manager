/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('notifications', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('type').notNullable(); // task_assigned, task_updated, comment_added, team_invite, mention, etc.
    table.string('title').notNullable();
    table.text('message').notNullable();
    table.integer('related_task_id').unsigned()
      .references('id').inTable('tasks').onDelete('CASCADE');
    table.integer('related_team_id').unsigned()
      .references('id').inTable('teams').onDelete('CASCADE');
    table.integer('related_comment_id').unsigned(); // Will reference comments table
    table.integer('triggered_by').unsigned()
      .references('id').inTable('users').onDelete('CASCADE');
    table.boolean('is_read').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('user_id');
    table.index('is_read');
    table.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('notifications');
};
