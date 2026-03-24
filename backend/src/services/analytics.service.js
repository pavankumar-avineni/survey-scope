const db = require('../models/db');

class AnalyticsService {
  async getAnalytics(surveyId, workspaceId, userId) {
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
    
    // Get all questions
    const questions = await db('questions')
      .where({ survey_id: surveyId })
      .orderBy('order_index', 'asc');
    
    // Parse question configs
    questions.forEach(q => {
      q.config = typeof q.config === 'string' ? JSON.parse(q.config) : q.config;
    });
    
    // Get total response count
    const totalResponsesResult = await db('responses')
      .where({ survey_id: surveyId })
      .count('id as count')
      .first();
    const totalResponses = parseInt(totalResponsesResult.count);
    
    // Get completion rate (responses with all required fields answered)
    const requiredQuestions = questions.filter(q => q.is_required);
    let completedResponses = totalResponses;
    
    if (requiredQuestions.length > 0) {
      // For each required question, count responses that have an answer
      let responsesWithAllRequired = await db('responses')
        .where({ survey_id: surveyId });
      
      // This is a simplified approach - in production, you'd do this in SQL
      for (const response of responsesWithAllRequired) {
        let hasAllRequired = true;
        for (const question of requiredQuestions) {
          const answer = await db('answers')
            .where({ response_id: response.id, question_id: question.id })
            .first();
          
          if (!answer || !answer.value) {
            hasAllRequired = false;
            break;
          }
        }
        if (!hasAllRequired) {
          completedResponses--;
        }
      }
    }
    
    const completionRate = totalResponses > 0 
      ? (completedResponses / totalResponses) * 100 
      : 0;
    
    // Get per-question analytics
    const questionsAnalytics = [];
    
    for (const question of questions) {
      const analytics = await this.getQuestionAnalytics(question, surveyId);
      questionsAnalytics.push({
        question_id: question.id,
        question_label: question.label,
        question_type: question.type,
        config: question.config,
        ...analytics,
      });
    }
    
    return {
      summary: {
        total_responses: totalResponses,
        completion_rate: Math.round(completionRate * 100) / 100,
        survey_status: survey.status,
        published_at: survey.published_at,
        closed_at: survey.closed_at,
      },
      questions: questionsAnalytics,
    };
  }
  
  async getQuestionAnalytics(question, surveyId) {
    const { type, config } = question;
    
    switch (type) {
      case 'single_choice':
      case 'dropdown':
        return await this.getChoiceAnalytics(question, surveyId);
      
      case 'multi_choice':
        return await this.getMultiChoiceAnalytics(question, surveyId);
      
      case 'rating':
        return await this.getRatingAnalytics(question, surveyId);
      
      case 'number':
        return await this.getNumberAnalytics(question, surveyId);
      
      case 'date':
        return await this.getDateAnalytics(question, surveyId);
      
      case 'short_text':
      case 'long_text':
      case 'email':
        return await this.getTextAnalytics(question, surveyId);
      
      case 'yes_no':
        return await this.getYesNoAnalytics(question, surveyId);
      
      default:
        return {
          response_count: await this.getResponseCount(question.id, surveyId),
          message: 'Analytics not available for this question type',
        };
    }
  }
  
  async getChoiceAnalytics(question, surveyId) {
    const options = question.config.options || [];
    const distribution = {};
    
    // Initialize distribution with zeros
    options.forEach(opt => {
      distribution[opt.label] = 0;
    });
    
    // Get all answers for this question
    const answers = await db('answers')
      .join('responses', 'answers.response_id', 'responses.id')
      .where({ question_id: question.id, 'responses.survey_id': surveyId })
      .select('answers.value');
    
    // Count distribution
    answers.forEach(answer => {
      const option = options.find(opt => opt.value === answer.value);
      if (option) {
        distribution[option.label]++;
      }
    });
    
    return {
      type: 'choice',
      distribution,
      total_responses: answers.length,
    };
  }
  
  async getMultiChoiceAnalytics(question, surveyId) {
    const options = question.config.options || [];
    const distribution = {};
    
    // Initialize distribution with zeros
    options.forEach(opt => {
      distribution[opt.label] = 0;
    });
    
    // Get all answers for this question
    const answers = await db('answers')
      .join('responses', 'answers.response_id', 'responses.id')
      .where({ question_id: question.id, 'responses.survey_id': surveyId })
      .select('answers.value');
    
    // Count distribution (each answer can have multiple values)
    answers.forEach(answer => {
      try {
        const values = JSON.parse(answer.value);
        values.forEach(value => {
          const option = options.find(opt => opt.value === value);
          if (option) {
            distribution[option.label]++;
          }
        });
      } catch (e) {
        // Handle as single value
        const option = options.find(opt => opt.value === answer.value);
        if (option) {
          distribution[option.label]++;
        }
      }
    });
    
    return {
      type: 'multi_choice',
      distribution,
      total_responses: answers.length,
    };
  }
  
  async getRatingAnalytics(question, surveyId) {
    const max = question.config.max || 5;
    const distribution = {};
    
    // Initialize distribution
    for (let i = 1; i <= max; i++) {
      distribution[i] = 0;
    }
    
    // Get all answers
    const answers = await db('answers')
      .join('responses', 'answers.response_id', 'responses.id')
      .where({ question_id: question.id, 'responses.survey_id': surveyId })
      .select('answers.value');
    
    let sum = 0;
    answers.forEach(answer => {
      const rating = parseInt(answer.value);
      if (!isNaN(rating) && rating >= 1 && rating <= max) {
        distribution[rating]++;
        sum += rating;
      }
    });
    
    const average = answers.length > 0 ? sum / answers.length : 0;
    
    return {
      type: 'rating',
      distribution,
      average: Math.round(average * 100) / 100,
      total_responses: answers.length,
    };
  }
  
  async getNumberAnalytics(question, surveyId) {
    const answers = await db('answers')
      .join('responses', 'answers.response_id', 'responses.id')
      .where({ question_id: question.id, 'responses.survey_id': surveyId })
      .select('answers.value');
    
    const numbers = [];
    answers.forEach(answer => {
      const num = parseFloat(answer.value);
      if (!isNaN(num)) {
        numbers.push(num);
      }
    });
    
    if (numbers.length === 0) {
      return {
        type: 'number',
        average: null,
        min: null,
        max: null,
        total_responses: 0,
      };
    }
    
    const sum = numbers.reduce((a, b) => a + b, 0);
    const average = sum / numbers.length;
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    
    return {
      type: 'number',
      average: Math.round(average * 100) / 100,
      min,
      max,
      total_responses: numbers.length,
    };
  }
  
  async getDateAnalytics(question, surveyId) {
    const answers = await db('answers')
      .join('responses', 'answers.response_id', 'responses.id')
      .where({ question_id: question.id, 'responses.survey_id': surveyId })
      .select('answers.value');
    
    const dates = [];
    answers.forEach(answer => {
      const date = new Date(answer.value);
      if (!isNaN(date.getTime())) {
        dates.push(date);
      }
    });
    
    if (dates.length === 0) {
      return {
        type: 'date',
        earliest: null,
        latest: null,
        total_responses: 0,
      };
    }
    
    const earliest = new Date(Math.min(...dates));
    const latest = new Date(Math.max(...dates));
    
    return {
      type: 'date',
      earliest: earliest.toISOString().split('T')[0],
      latest: latest.toISOString().split('T')[0],
      total_responses: dates.length,
    };
  }
  
  async getTextAnalytics(question, surveyId) {
    const answers = await db('answers')
      .join('responses', 'answers.response_id', 'responses.id')
      .where({ question_id: question.id, 'responses.survey_id': surveyId })
      .select('answers.value')
      .orderBy('responses.submitted_at', 'desc')
      .limit(100); // Limit to last 100 responses
    
    const responses = answers.map(a => a.value).filter(v => v && v.trim());
    
    return {
      type: 'text',
      responses: responses,
      total_responses: responses.length,
    };
  }
  
  async getYesNoAnalytics(question, surveyId) {
    const answers = await db('answers')
      .join('responses', 'answers.response_id', 'responses.id')
      .where({ question_id: question.id, 'responses.survey_id': surveyId })
      .select('answers.value');
    
    let yesCount = 0;
    let noCount = 0;
    
    answers.forEach(answer => {
      if (answer.value === 'yes') yesCount++;
      if (answer.value === 'no') noCount++;
    });
    
    return {
      type: 'yes_no',
      distribution: {
        yes: yesCount,
        no: noCount,
      },
      total_responses: answers.length,
    };
  }
  
  async getResponseCount(questionId, surveyId) {
    const result = await db('answers')
      .join('responses', 'answers.response_id', 'responses.id')
      .where({ question_id: questionId, 'responses.survey_id': surveyId })
      .count('answers.id as count')
      .first();
    
    return parseInt(result.count);
  }
}

module.exports = new AnalyticsService();