/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('team_members', function(table) {
    table.increments('id').primary();
    table.integer('team_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.enum('role', ['member', 'admin']).defaultTo('member');
    table.timestamp('joined_at').defaultTo(knex.fn.now());
    
    // Foreign key constraints
    table.foreign('team_id').references('id').inTable('teams').onDelete('CASCADE');
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
    
    // Unique constraint to prevent duplicate memberships
    table.unique(['team_id', 'user_id']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('team_members');
};





