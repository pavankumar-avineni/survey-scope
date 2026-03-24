const db = require('../models/db');

class QuestionService {
  async addQuestion(surveyId, workspaceId, userId, questionData) {
    // Verify user has permission
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Verify survey exists and is in draft
    const survey = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    if (survey.status !== 'draft') {
      throw new Error('CANNOT_MODIFY_PUBLISHED_SURVEY');
    }
    
    // Get max order index
    const maxOrder = await db('questions')
      .where({ survey_id: surveyId })
      .max('order_index as max')
      .first();
    
    const orderIndex = (maxOrder.max || -1) + 1;
    
    // Create question
    const [question] = await db('questions')
      .insert({
        survey_id: surveyId,
        type: questionData.type,
        label: questionData.label,
        is_required: questionData.is_required || false,
        order_index: orderIndex,
        config: JSON.stringify(questionData.config || {}),
      })
      .returning('*');
    
    // Parse config
    question.config = typeof question.config === 'string'
      ? JSON.parse(question.config)
      : question.config;
    
    return question;
  }
  
  async updateQuestion(questionId, surveyId, workspaceId, userId, updates) {
    // Verify user has permission
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Verify survey is draft
    const survey = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    if (survey.status !== 'draft') {
      throw new Error('CANNOT_MODIFY_PUBLISHED_SURVEY');
    }
    
    // Prepare update data
    const updateData = {};
    if (updates.label !== undefined) updateData.label = updates.label;
    if (updates.is_required !== undefined) updateData.is_required = updates.is_required;
    if (updates.config !== undefined) updateData.config = JSON.stringify(updates.config);
    
    updateData.updated_at = db.fn.now();
    
    // Update question
    const [updated] = await db('questions')
      .where({ id: questionId, survey_id: surveyId })
      .update(updateData)
      .returning('*');
    
    if (!updated) {
      throw new Error('QUESTION_NOT_FOUND');
    }
    
    updated.config = typeof updated.config === 'string'
      ? JSON.parse(updated.config)
      : updated.config;
    
    return updated;
  }
  
  async deleteQuestion(questionId, surveyId, workspaceId, userId) {
    // Verify user has permission
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Verify survey is draft
    const survey = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    if (survey.status !== 'draft') {
      throw new Error('CANNOT_MODIFY_PUBLISHED_SURVEY');
    }
    
    // Delete question
    const deleted = await db('questions')
      .where({ id: questionId, survey_id: surveyId })
      .delete();
    
    if (!deleted) {
      throw new Error('QUESTION_NOT_FOUND');
    }
    
    // Reorder remaining questions
    const remainingQuestions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index', 'asc');
    
    for (let i = 0; i < remainingQuestions.length; i++) {
      await db('questions')
        .where({ id: remainingQuestions[i].id })
        .update({ order_index: i });
    }
    
    return { success: true };
  }
  
  async reorderQuestions(surveyId, workspaceId, userId, questionIds) {
    // Verify user has permission
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Verify survey is draft
    const survey = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    if (survey.status !== 'draft') {
      throw new Error('CANNOT_MODIFY_PUBLISHED_SURVEY');
    }
    
    // Verify all questions belong to this survey
    const questions = await db('questions')
      .where({ survey_id: surveyId })
      .whereIn('id', questionIds);
    
    if (questions.length !== questionIds.length) {
      throw new Error('INVALID_QUESTION_IDS');
    }
    
    // Start transaction for atomic update
    const trx = await db.transaction();
    
    try {
      // Update order for each question
      for (let i = 0; i < questionIds.length; i++) {
        await trx('questions')
          .where({ id: questionIds[i] })
          .update({ order_index: i, updated_at: db.fn.now() });
      }
      
      await trx.commit();
    } catch (error) {
      await trx.rollback();
      throw error;
    }
    
    // Return updated questions
    const updatedQuestions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index', 'asc');
    
    updatedQuestions.forEach(q => {
      q.config = typeof q.config === 'string' ? JSON.parse(q.config) : q.config;
    });
    
    return updatedQuestions;
  }
}

module.exports = new QuestionService();