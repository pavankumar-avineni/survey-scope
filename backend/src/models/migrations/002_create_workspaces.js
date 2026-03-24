exports.up = async function(knex) {
  return knex.schema.createTable('workspaces', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 100).notNullable();
    table.string('slug', 100).notNullable().unique();
    table.string('plan', 50).defaultTo('free');
    table.uuid('owner_id').references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('deleted_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.index('slug');
    table.index('owner_id');
  });
};

exports.down = async function(knex) {
  return knex.schema.dropTable('workspaces');
};