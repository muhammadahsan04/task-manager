/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tasks', function(table) {
    table.increments('id').primary();
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table.enum('status', ['pending', 'in_progress', 'completed']).defaultTo('pending');
    table.enum('priority', ['low', 'medium', 'high']).defaultTo('medium');
    table.integer('team_id').unsigned().notNullable();
    table.integer('assigned_to').unsigned().nullable();
    table.integer('created_by').unsigned().notNullable();
    table.timestamp('due_date').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Foreign key constraints
    table.foreign('team_id').references('id').inTable('teams').onDelete('CASCADE');
    table.foreign('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.foreign('created_by').references('id').inTable('users').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('tasks');
};





