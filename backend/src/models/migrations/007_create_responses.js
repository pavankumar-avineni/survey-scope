exports.up = async function(knex) {
  return knex.schema.createTable('responses', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('survey_id').notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    table.string('session_token', 255).nullable();
    table.timestamp('submitted_at').notNullable().defaultTo(knex.fn.now());
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index('survey_id');
    table.index('session_token');
    table.index('submitted_at');
  });
};

exports.down = async function(knex) {
  return knex.schema.dropTable('responses');
};