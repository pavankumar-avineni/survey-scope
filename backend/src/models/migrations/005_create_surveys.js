exports.up = async function(knex) {
  // Create enum type for survey status
  await knex.raw(`CREATE TYPE survey_status AS ENUM ('draft', 'active', 'closed')`);
  
  return knex.schema.createTable('surveys', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('workspace_id').notNullable().references('id').inTable('workspaces').onDelete('CASCADE');
    table.string('title', 255).notNullable();
    table.text('description').nullable();
    table.string('slug', 255).notNullable().unique();
    table.specificType('status', 'survey_status').notNullable().defaultTo('draft');
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('deleted_at').nullable();
    table.timestamp('published_at').nullable();
    table.timestamp('closed_at').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index('workspace_id');
    table.index('slug');
    table.index('status');
    table.index('deleted_at');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('surveys');
  await knex.raw('DROP TYPE IF EXISTS survey_status');
};