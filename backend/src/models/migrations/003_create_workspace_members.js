exports.up = async function(knex) {
  await knex.raw(`CREATE TYPE user_role AS ENUM ('owner', 'admin', 'viewer')`);
  
  return knex.schema.createTable('workspace_members', (table) => {
    table.uuid('workspace_id').references('id').inTable('workspaces').onDelete('CASCADE');
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.specificType('role', 'user_role').notNullable().defaultTo('viewer');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.primary(['workspace_id', 'user_id']);
    table.index(['workspace_id', 'user_id']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('workspace_members');
  await knex.raw('DROP TYPE IF EXISTS user_role');
};