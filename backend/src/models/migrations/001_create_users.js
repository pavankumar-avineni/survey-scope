exports.up = async function(knex) {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('name', 100).notNullable();
    table.timestamp('verified_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('email');
  });
};

exports.down = async function(knex) {
  return knex.schema.dropTable('users');
};