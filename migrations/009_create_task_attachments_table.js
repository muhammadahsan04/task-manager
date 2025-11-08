/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('task_attachments', (table) => {
    table.increments('id').primary();
    table.integer('task_id').unsigned().notNullable()
      .references('id').inTable('tasks').onDelete('CASCADE');
    table.integer('comment_id').unsigned(); // nullable, when tied to a comment
    table.integer('uploaded_by').unsigned().notNullable()
      .references('id').inTable('users').onDelete('CASCADE');
    table.string('file_name').notNullable();
    table.string('file_type');
    table.integer('file_size'); // bytes
    table.string('file_url').notNullable();
    table.string('public_id').notNullable(); // Cloudinary public_id for delete
    table.timestamp('created_at').defaultTo(knex.fn.now());

    table.index('task_id');
    table.index('comment_id');
    table.index('uploaded_by');
    table.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('task_attachments');
};







