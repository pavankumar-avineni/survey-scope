exports.up = async function(knex) {
  // Create enum type for question types
  await knex.raw(`CREATE TYPE question_type AS ENUM (
    'short_text', 
    'long_text', 
    'single_choice', 
    'multi_choice', 
    'rating', 
    'date', 
    'email', 
    'number', 
    'dropdown', 
    'yes_no'
  )`);
  
  return knex.schema.createTable('questions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('survey_id').notNullable().references('id').inTable('surveys').onDelete('CASCADE');
    table.specificType('type', 'question_type').notNullable();
    table.string('label', 500).notNullable();
    table.boolean('is_required').defaultTo(false);
    table.integer('order_index').notNullable().defaultTo(0);
    table.jsonb('config').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index('survey_id');
    table.index('order_index');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('questions');
  await knex.raw('DROP TYPE IF EXISTS question_type');
};