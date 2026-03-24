exports.up = async function(knex) {
  return knex.schema.createTable('answers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('response_id').notNullable().references('id').inTable('responses').onDelete('CASCADE');
    table.uuid('question_id').notNullable().references('id').inTable('questions').onDelete('CASCADE');
    table.text('value').notNullable(); // Store all answers as text, app layer interprets
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Indexes for performance
    table.index('response_id');
    table.index('question_id');
    table.unique(['response_id', 'question_id']); // Prevent duplicate answers per response
  });
};

exports.down = async function(knex) {
  return knex.schema.dropTable('answers');
};