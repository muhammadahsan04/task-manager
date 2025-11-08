exports.up = function(knex) {
  return knex.schema.createTable('chat_messages', function(table) {
    table.increments('id').primary();
    table.integer('team_id').unsigned().notNullable()
      .references('id').inTable('teams').onDelete('CASCADE');
    table.integer('sender_id').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.text('message').notNullable();
    table.string('message_type').defaultTo('text'); // text, file, system
    table.json('metadata'); // for file attachments, mentions, etc.
    table.boolean('is_edited').defaultTo(false);
    table.timestamp('edited_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('team_id');
    table.index('sender_id');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('chat_messages');
};
