/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user_email_preferences', (table) => {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE').unique();
    table.boolean('instant_task_assigned').notNullable().defaultTo(true);
    table.boolean('instant_comment').notNullable().defaultTo(true);
    table.boolean('instant_team_invite').notNullable().defaultTo(true);
    table.boolean('deadline_reminders').notNullable().defaultTo(true);
    table.enum('digest_frequency', ['off', 'daily', 'weekly']).notNullable().defaultTo('weekly');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user_email_preferences');
};



