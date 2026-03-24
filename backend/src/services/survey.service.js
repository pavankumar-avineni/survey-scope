const db = require('../models/db');
const slugify = require('../utils/slugify');

class SurveyService {
  async getSurveys(workspaceId, userId, options = {}) {
    const { page = 1, limit = 20, status = null } = options;
    const offset = (page - 1) * limit;
    
    // Verify user has access to workspace
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership) {
      throw new Error('ACCESS_DENIED');
    }
    
    // Build query
    let query = db('surveys')
      .where({ workspace_id: workspaceId })
      .whereNull('deleted_at');
    
    if (status) {
      query = query.where({ status });
    }
    
    // Get total count
    const countResult = await query.clone().count('id as count').first();
    const total = parseInt(countResult.count);
    
    // Get paginated surveys with response count
    const surveys = await query
      .select('surveys.*')
      .leftJoin('responses', 'surveys.id', 'responses.survey_id')
      .groupBy('surveys.id')
      .select(db.raw('COUNT(responses.id) as response_count'))
      .orderBy('surveys.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    return {
      data: surveys,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
  async createSurvey(workspaceId, userId, data) {
    // Verify user has permission (admin or owner)
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Generate unique slug
    let slug = slugify(data.title);
    let counter = 1;
    while (await db('surveys').where({ slug }).whereNull('deleted_at').first()) {
      slug = `${slugify(data.title)}-${counter}`;
      counter++;
    }
    
    // Prepare settings with defaults
    const settings = {
      allowMultipleResponses: true,
      thankYouMessage: 'Thank you for completing this survey!',
      closeDate: null,
      showResponseCount: false,
      ...data.settings,
    };
    
    // Create survey
    const [survey] = await db('surveys')
      .insert({
        workspace_id: workspaceId,
        title: data.title,
        description: data.description || null,
        slug,
        status: 'draft',
        settings: JSON.stringify(settings),
      })
      .returning('*');
    
    return survey;
  }
  
  async getSurveyById(surveyId, workspaceId, userId) {
    // Verify user has access to workspace
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership) {
      throw new Error('ACCESS_DENIED');
    }
    
    // Get survey
    const survey = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    // Get questions
    const questions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index', 'asc');
    
    // Parse JSONB fields
    survey.settings = typeof survey.settings === 'string' 
      ? JSON.parse(survey.settings) 
      : survey.settings;
    
    questions.forEach(q => {
      q.config = typeof q.config === 'string' ? JSON.parse(q.config) : q.config;
    });
    
    return { ...survey, questions };
  }
  
  async updateSurvey(surveyId, workspaceId, userId, updates) {
    // Verify user has permission
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Get current survey
    const currentSurvey = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!currentSurvey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    // Cannot change slug if published
    if (updates.title && currentSurvey.status !== 'draft') {
      throw new Error('CANNOT_CHANGE_PUBLISHED_SURVEY');
    }
    
    // Prepare update data
    const updateData = {};
    if (updates.title) {
      updateData.title = updates.title;
      // Only update slug if still draft
      if (currentSurvey.status === 'draft') {
        let slug = slugify(updates.title);
        let counter = 1;
        while (await db('surveys')
          .where({ slug })
          .whereNot({ id: surveyId })
          .whereNull('deleted_at')
          .first()) {
          slug = `${slugify(updates.title)}-${counter}`;
          counter++;
        }
        updateData.slug = slug;
      }
    }
    
    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }
    
    if (updates.settings) {
      const currentSettings = typeof currentSurvey.settings === 'string'
        ? JSON.parse(currentSurvey.settings)
        : currentSurvey.settings;
      
      updateData.settings = JSON.stringify({
        ...currentSettings,
        ...updates.settings,
      });
    }
    
    updateData.updated_at = db.fn.now();
    
    // Update survey
    const [updated] = await db('surveys')
      .where({ id: surveyId })
      .update(updateData)
      .returning('*');
    
    updated.settings = typeof updated.settings === 'string'
      ? JSON.parse(updated.settings)
      : updated.settings;
    
    return updated;
  }
  
  async deleteSurvey(surveyId, workspaceId, userId) {
    // Verify user has permission
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Soft delete
    const deleted = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .update({
        deleted_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
    
    if (!deleted) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    return { success: true };
  }
  
  async publishSurvey(surveyId, workspaceId, userId) {
    // Verify user has permission
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Get survey with questions
    const survey = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    // Check if survey has at least one question
    const questionCount = await db('questions')
      .where({ survey_id: surveyId })
      .count('id as count')
      .first();
    
    if (parseInt(questionCount.count) === 0) {
      throw new Error('SURVEY_MUST_HAVE_QUESTIONS');
    }
    
    // Publish survey
    const [published] = await db('surveys')
      .where({ id: surveyId })
      .update({
        status: 'active',
        published_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');
    
    published.settings = typeof published.settings === 'string'
      ? JSON.parse(published.settings)
      : published.settings;
    
    return published;
  }
  
  async closeSurvey(surveyId, workspaceId, userId) {
    // Verify user has permission
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    const [closed] = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .update({
        status: 'closed',
        closed_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('*');
    
    if (!closed) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    closed.settings = typeof closed.settings === 'string'
      ? JSON.parse(closed.settings)
      : closed.settings;
    
    return closed;
  }
  
  async duplicateSurvey(surveyId, workspaceId, userId) {
    // Verify user has permission
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Get original survey
    const original = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!original) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    // Get original questions
    const originalQuestions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index', 'asc');
    
    // Generate new slug
    let slug = slugify(`${original.title} copy`);
    let counter = 1;
    while (await db('surveys').where({ slug }).whereNull('deleted_at').first()) {
      slug = `${slugify(original.title)}-copy-${counter}`;
      counter++;
    }
    
    // Parse original settings
    const originalSettings = typeof original.settings === 'string'
      ? JSON.parse(original.settings)
      : original.settings;
    
    // Start transaction
    const trx = await db.transaction();
    
    try {
      // Create duplicate survey
      const [duplicate] = await trx('surveys')
        .insert({
          workspace_id: workspaceId,
          title: `${original.title} (Copy)`,
          description: original.description,
          slug,
          status: 'draft',
          settings: JSON.stringify(originalSettings),
        })
        .returning('*');
      
      // Duplicate questions
      for (const question of originalQuestions) {
        const config = typeof question.config === 'string'
          ? JSON.parse(question.config)
          : question.config;
        
        await trx('questions').insert({
          survey_id: duplicate.id,
          type: question.type,
          label: question.label,
          is_required: question.is_required,
          order_index: question.order_index,
          config: JSON.stringify(config),
        });
      }
      
      await trx.commit();
      
      duplicate.settings = originalSettings;
      return duplicate;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }
  
  async getPublicSurvey(slug) {
    const survey = await db('surveys')
      .where({ slug, status: 'active' })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      // Check if survey exists but is closed
      const closedSurvey = await db('surveys')
        .where({ slug })
        .whereNull('deleted_at')
        .first();
      
      if (closedSurvey && closedSurvey.status === 'closed') {
        throw new Error('SURVEY_CLOSED');
      }
      
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    // Get questions
    const questions = await db('questions')
      .where({ survey_id: survey.id })
      .orderBy('order_index', 'asc');
    
    // Parse JSONB fields
    survey.settings = typeof survey.settings === 'string'
      ? JSON.parse(survey.settings)
      : survey.settings;
    
    questions.forEach(q => {
      q.config = typeof q.config === 'string' ? JSON.parse(q.config) : q.config;
    });
    
    return { ...survey, questions };
  }
}

module.exports = new SurveyService();