const Question = require('../models/Question');
const Exam = require('../models/Exam');

// Create a new question
const createQuestion = async (req, res) => {
  try {
    const {
      title,
      description,
      subject,
      category,
      questionType,
      questionText,
      options,
      correctAnswer,
      explanation,
      marks,
      timeLimit,
      difficulty,
      tags,
      keywords,
      allowPartialCredit,
      showHint,
      hint,
      attachments
    } = req.body;

    const organizationId = req.user.organizationId;
    const createdBy = req.user._id;

    // Validate required fields
    if (!title || !subject || !category || !questionType || !questionText || !marks) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate question type specific requirements
    if (questionType === 'multiple_choice' && (!options || options.length < 2)) {
      return res.status(400).json({
        success: false,
        message: 'Multiple choice questions must have at least 2 options'
      });
    }

    if (questionType !== 'multiple_choice' && !correctAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Correct answer is required for non-multiple choice questions'
      });
    }

    // Create question
    const question = new Question({
      title,
      description,
      organizationId,
      subject,
      category,
      questionType,
      questionText,
      options: options || [],
      correctAnswer,
      explanation,
      marks,
      timeLimit: timeLimit || 60,
      difficulty: difficulty || 'medium',
      tags: tags || [],
      keywords: keywords || [],
      createdBy,
      allowPartialCredit: allowPartialCredit || false,
      showHint: showHint || false,
      hint,
      attachments: attachments || []
    });

    await question.save();

    // Populate the question with creator details
    await question.populate('createdBy', 'profile firstName lastName');

    res.status(201).json({
      success: true,
      message: 'Question created successfully',
      data: question
    });

  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all questions for an organization
const getQuestions = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      subject,
      category,
      questionType,
      difficulty,
      status,
      tags,
      searchText,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const searchParams = {
      subject,
      category,
      questionType,
      difficulty,
      status,
      tags: tags ? tags.split(',') : undefined,
      searchText
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const questions = await Question.searchQuestions(organizationId, searchParams)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalQuestions = await Question.countDocuments({ organizationId, ...searchParams });

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalQuestions / parseInt(limit)),
          totalQuestions,
          hasNext: skip + questions.length < totalQuestions,
          hasPrev: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get a specific question by ID
const getQuestionById = async (req, res) => {
  try {
    const { questionId } = req.params;
    const organizationId = req.user.organizationId;

    const question = await Question.findOne({ _id: questionId, organizationId })
      .populate('createdBy', 'profile firstName lastName')
      .populate('validatedBy', 'profile firstName lastName');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      data: question
    });

  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update a question
const updateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const organizationId = req.user.organizationId;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.organizationId;
    delete updateData.createdBy;
    delete updateData.analytics;
    delete updateData.usageCount;

    const question = await Question.findOneAndUpdate(
      { _id: questionId, organizationId },
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('createdBy', 'profile firstName lastName');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      message: 'Question updated successfully',
      data: question
    });

  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete a question
const deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const organizationId = req.user.organizationId;

    // Check if question is used in any exams
    const examsUsingQuestion = await Exam.find({
      questions: questionId,
      organizationId
    });

    if (examsUsingQuestion.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete question as it is being used in exams',
        data: {
          usedInExams: examsUsingQuestion.length,
          examTitles: examsUsingQuestion.map(exam => exam.title)
        }
      });
    }

    const question = await Question.findOneAndDelete({ _id: questionId, organizationId });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Duplicate a question
const duplicateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const organizationId = req.user.organizationId;

    const originalQuestion = await Question.findOne({ _id: questionId, organizationId });
    if (!originalQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const duplicatedQuestion = await originalQuestion.createVersion({
      title: `${originalQuestion.title} (Copy)`,
      status: 'draft',
      usageCount: 0,
      analytics: {
        totalAttempts: 0,
        correctAttempts: 0,
        averageScore: 0,
        difficultyRating: originalQuestion.analytics.difficultyRating
      }
    });

    await duplicatedQuestion.populate('createdBy', 'profile firstName lastName');

    res.json({
      success: true,
      message: 'Question duplicated successfully',
      data: duplicatedQuestion
    });

  } catch (error) {
    console.error('Error duplicating question:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Validate a question
const validateQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const organizationId = req.user.organizationId;
    const validatorId = req.user._id;

    const question = await Question.findOne({ _id: questionId, organizationId });
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    await question.validateQuestion(validatorId);

    res.json({
      success: true,
      message: 'Question validated successfully',
      data: question
    });

  } catch (error) {
    console.error('Error validating question:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get question statistics
const getQuestionStatistics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const statistics = await Question.getQuestionStatistics(organizationId);
    const questionCounts = await Question.aggregate([
      { $match: { organizationId: require('mongoose').Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const subjectStats = await Question.aggregate([
      { $match: { organizationId: require('mongoose').Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: '$subject',
          count: { $sum: 1 },
          averageSuccessRate: { $avg: '$successRate' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const difficultyStats = await Question.aggregate([
      { $match: { organizationId: require('mongoose').Types.ObjectId(organizationId) } },
      {
        $group: {
          _id: '$difficulty',
          count: { $sum: 1 },
          averageScore: { $avg: '$analytics.averageScore' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        overview: statistics[0] || {
          totalQuestions: 0,
          activeQuestions: 0,
          draftQuestions: 0,
          averageDifficulty: 0,
          totalUsage: 0,
          averageSuccessRate: 0
        },
        statusBreakdown: questionCounts,
        subjectStats,
        difficultyStats
      }
    });

  } catch (error) {
    console.error('Error fetching question statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get questions by subject
const getQuestionsBySubject = async (req, res) => {
  try {
    const { subject } = req.params;
    const organizationId = req.user.organizationId;

    const questions = await Question.getQuestionsBySubject(organizationId, subject);

    res.json({
      success: true,
      data: questions
    });

  } catch (error) {
    console.error('Error fetching questions by subject:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get popular questions
const getPopularQuestions = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { limit = 10 } = req.query;

    const questions = await Question.getPopularQuestions(organizationId, parseInt(limit));

    res.json({
      success: true,
      data: questions
    });

  } catch (error) {
    console.error('Error fetching popular questions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Record question attempt (for analytics)
const recordQuestionAttempt = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { isCorrect, timeSpent } = req.body;
    const organizationId = req.user.organizationId;

    const question = await Question.findOne({ _id: questionId, organizationId });
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    await question.recordAttempt(isCorrect, timeSpent);

    res.json({
      success: true,
      message: 'Question attempt recorded successfully'
    });

  } catch (error) {
    console.error('Error recording question attempt:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Bulk import questions
const bulkImportQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    const organizationId = req.user.organizationId;
    const createdBy = req.user._id;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Questions array is required'
      });
    }

    const importResults = [];
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      try {
        const questionData = {
          ...questions[i],
          organizationId,
          createdBy
        };

        const question = new Question(questionData);
        await question.save();
        importResults.push({ index: i, success: true, questionId: question._id });
      } catch (error) {
        errors.push({ index: i, error: error.message });
        importResults.push({ index: i, success: false, error: error.message });
      }
    }

    res.json({
      success: true,
      message: `Imported ${importResults.filter(r => r.success).length} out of ${questions.length} questions`,
      data: {
        results: importResults,
        errors,
        successCount: importResults.filter(r => r.success).length,
        errorCount: errors.length
      }
    });

  } catch (error) {
    console.error('Error bulk importing questions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Export questions
const exportQuestions = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { format = 'json', subject, category, questionType } = req.query;

    const filters = { organizationId };
    if (subject) filters.subject = subject;
    if (category) filters.category = category;
    if (questionType) filters.questionType = questionType;

    const questions = await Question.find(filters)
      .populate('createdBy', 'profile firstName lastName')
      .select('-analytics -usageCount');

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = questions.map(q => ({
        title: q.title,
        subject: q.subject,
        category: q.category,
        questionType: q.questionType,
        difficulty: q.difficulty,
        marks: q.marks,
        tags: q.tags.join(',')
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=questions.csv');
      res.send(JSON.stringify(csvData));
    } else {
      res.json({
        success: true,
        data: questions
      });
    }

  } catch (error) {
    console.error('Error exporting questions:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get available questions for an exam (filtered by subject, type, etc.)
const getAvailableQuestionsForExam = async (req, res) => {
  try {
    const {
      subject,
      questionType,
      difficulty,
      examId,
      limit = 50,
      page = 1
    } = req.query;

    const organizationId = req.user.organizationId;
    const filter = { organizationId };

    // Apply filters
    if (subject) filter.subject = subject;
    if (questionType) filter.questionType = questionType;
    if (difficulty) filter.difficulty = difficulty;

    // If examId is provided, exclude questions already in that exam
    if (examId) {
      const exam = await Exam.findById(examId);
      if (exam && exam.questions.length > 0) {
        const usedQuestionIds = exam.questions.map(q => q.questionId);
        filter._id = { $nin: usedQuestionIds };
      }
    }

    const questions = await Question.find(filter)
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Question.countDocuments(filter);

    res.json({
      success: true,
      data: {
        questions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalQuestions: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching available questions for exam:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available questions',
      error: error.message
    });
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
  validateQuestion,
  getQuestionStatistics,
  getQuestionsBySubject,
  getPopularQuestions,
  recordQuestionAttempt,
  bulkImportQuestions,
  exportQuestions,
  getAvailableQuestionsForExam
};
