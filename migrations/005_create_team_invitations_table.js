/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('team_invitations', function(table) {
    table.increments('id').primary();
    table.integer('team_id').unsigned().notNullable();
    table.string('email', 255).notNullable();
    table.string('token', 64).notNullable();
    table.enum('status', ['pending', 'accepted', 'revoked']).defaultTo('pending');
    table.integer('invited_by').unsigned().notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.foreign('team_id').references('id').inTable('teams').onDelete('CASCADE');
    table.foreign('invited_by').references('id').inTable('users').onDelete('CASCADE');
    table.index(['team_id', 'email']);
    table.unique(['team_id', 'email', 'status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('team_invitations');
};