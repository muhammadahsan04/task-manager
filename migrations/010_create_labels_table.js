/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('labels', (table) => {
    table.increments('id').primary();
    table.integer('team_id').unsigned().notNullable()
      .references('id').inTable('teams').onDelete('CASCADE');
    table.string('name').notNullable();
    table.string('color').notNullable().defaultTo('#64748b'); // default slate-500
    table.integer('created_by').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.unique(['team_id', 'name']);
    table.index('team_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('labels');
};


