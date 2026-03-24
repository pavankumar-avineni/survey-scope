const db = require('../models/db');
const { Parser } = require('json2csv');

class ResponseService {
  async getResponses(surveyId, workspaceId, userId, options = {}) {
    const { page = 1, limit = 20, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    // Verify user has access to workspace
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership) {
      throw new Error('ACCESS_DENIED');
    }
    
    // Verify survey belongs to workspace
    const survey = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    // Build query
    let query = db('responses')
      .where({ survey_id: surveyId });
    
    if (startDate) {
      query = query.where('submitted_at', '>=', startDate);
    }
    
    if (endDate) {
      query = query.where('submitted_at', '<=', endDate);
    }
    
    // Get total count
    const countResult = await query.clone().count('id as count').first();
    const total = parseInt(countResult.count);
    
    // Get paginated responses
    const responses = await query
      .select('id', 'session_token', 'submitted_at', 'metadata')
      .orderBy('submitted_at', 'desc')
      .limit(limit)
      .offset(offset);
    
    // Get answer counts for each response
    for (const response of responses) {
      const answerCount = await db('answers')
        .where({ response_id: response.id })
        .count('id as count')
        .first();
      
      response.answer_count = parseInt(answerCount.count);
      
      // Parse metadata
      response.metadata = typeof response.metadata === 'string'
        ? JSON.parse(response.metadata)
        : response.metadata;
    }
    
    return {
      data: responses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
  async getResponseById(responseId, surveyId, workspaceId, userId) {
    // Verify user has access
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership) {
      throw new Error('ACCESS_DENIED');
    }
    
    // Verify survey belongs to workspace
    const survey = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    // Get response
    const response = await db('responses')
      .where({ id: responseId, survey_id: surveyId })
      .first();
    
    if (!response) {
      throw new Error('RESPONSE_NOT_FOUND');
    }
    
    // Get all questions for this survey
    const questions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index', 'asc');
    
    // Get answers for this response
    const answers = await db('answers')
      .where({ response_id: responseId });
    
    // Create answer lookup map
    const answerMap = {};
    answers.forEach(answer => {
      answerMap[answer.question_id] = answer.value;
    });
    
    // Combine questions with answers
    const responseData = {
      id: response.id,
      submitted_at: response.submitted_at,
      session_token: response.session_token,
      metadata: typeof response.metadata === 'string'
        ? JSON.parse(response.metadata)
        : response.metadata,
      answers: questions.map(question => {
        let answer = answerMap[question.id] || null;
        
        // Parse JSON answers if needed
        if (answer && (question.type === 'multi_choice')) {
          try {
            answer = JSON.parse(answer);
          } catch (e) {
            // Keep as string
          }
        }
        
        return {
          question_id: question.id,
          question_label: question.label,
          question_type: question.type,
          question_config: typeof question.config === 'string'
            ? JSON.parse(question.config)
            : question.config,
          is_required: question.is_required,
          answer: answer,
        };
      }),
    };
    
    return responseData;
  }
  
  async deleteResponse(responseId, surveyId, workspaceId, userId) {
    // Verify user has permission (admin or owner)
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Verify survey belongs to workspace
    const survey = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    // Hard delete response (GDPR)
    const deleted = await db('responses')
      .where({ id: responseId, survey_id: surveyId })
      .delete();
    
    if (!deleted) {
      throw new Error('RESPONSE_NOT_FOUND');
    }
    
    return { success: true };
  }
  
  async exportToCSV(surveyId, workspaceId, userId, options = {}) {
    // Verify user has permission
    const membership = await db('workspace_members')
      .where({ workspace_id: workspaceId, user_id: userId })
      .first();
    
    if (!membership || (membership.role !== 'owner' && membership.role !== 'admin')) {
      throw new Error('INSUFFICIENT_PERMISSIONS');
    }
    
    // Verify survey belongs to workspace
    const survey = await db('surveys')
      .where({ id: surveyId, workspace_id: workspaceId })
      .whereNull('deleted_at')
      .first();
    
    if (!survey) {
      throw new Error('SURVEY_NOT_FOUND');
    }
    
    // Get all questions
    const questions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index', 'asc');
    
    // Get all responses with answers
    let query = db('responses')
      .where({ survey_id: surveyId });
    
    if (options.startDate) {
      query = query.where('submitted_at', '>=', options.startDate);
    }
    
    if (options.endDate) {
      query = query.where('submitted_at', '<=', options.endDate);
    }
    
    const responses = await query
      .select('id', 'submitted_at', 'session_token')
      .orderBy('submitted_at', 'asc');
    
    // Get answers for all responses
    const responseIds = responses.map(r => r.id);
    const answers = await db('answers')
      .whereIn('response_id', responseIds);
    
    // Create answer lookup map
    const answerMap = {};
    answers.forEach(answer => {
      if (!answerMap[answer.response_id]) {
        answerMap[answer.response_id] = {};
      }
      answerMap[answer.response_id][answer.question_id] = answer.value;
    });
    
    // Prepare CSV data
    const csvData = responses.map(response => {
      const row = {
        response_id: response.id,
        submitted_at: response.submitted_at,
        session_token: response.session_token || 'N/A',
      };
      
      questions.forEach(question => {
        let answer = answerMap[response.id]?.[question.id] || '';
        
        // Parse JSON answers for multi-choice
        if (answer && question.type === 'multi_choice') {
          try {
            const parsed = JSON.parse(answer);
            answer = parsed.join(', ');
          } catch (e) {
            // Keep as string
          }
        }
        
        row[question.label] = answer;
      });
      
      return row;
    });
    
    // Convert to CSV
    const fields = ['response_id', 'submitted_at', 'session_token', ...questions.map(q => q.label)];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(csvData);
    
    return csv;
  }
}

module.exports = new ResponseService();