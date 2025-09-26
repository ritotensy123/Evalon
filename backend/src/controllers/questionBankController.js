const QuestionBank = require('../models/QuestionBank');
const Question = require('../models/Question');
const Exam = require('../models/Exam');

// Create a new question bank
const createQuestionBank = async (req, res) => {
  try {
    const {
      name,
      description,
      subject,
      class: className,
      tags
    } = req.body;

    // Get the current user
    const userId = req.user.id;

    const questionBank = new QuestionBank({
      name,
      description,
      subject,
      class: className,
      tags,
      organizationId: req.user.organizationId,
      createdBy: userId
    });

    await questionBank.save();

    res.status(201).json({
      success: true,
      message: 'Question bank created successfully',
      data: { questionBank }
    });
  } catch (error) {
    console.error('Error creating question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create question bank',
      error: error.message
    });
  }
};

// Get all question banks
const getQuestionBanks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      subject,
      class: className,
      status,
      search
    } = req.query;

    const filter = { organizationId: req.user.organizationId };
    
    if (subject) filter.subject = subject;
    if (className) filter.class = className;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const questionBanks = await QuestionBank.find(filter)
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await QuestionBank.countDocuments(filter);

    res.json({
      success: true,
      data: {
        questionBanks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalQuestionBanks: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching question banks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question banks',
      error: error.message
    });
  }
};

// Get question bank by ID
const getQuestionBankById = async (req, res) => {
  try {
    const { questionBankId } = req.params;

    const questionBank = await QuestionBank.findById(questionBankId)
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .populate({
        path: 'questions',
        populate: {
          path: 'createdBy',
          select: 'profile.firstName profile.lastName email'
        }
      });

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }

    res.json({
      success: true,
      data: { questionBank }
    });
  } catch (error) {
    console.error('Error fetching question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question bank',
      error: error.message
    });
  }
};

// Update question bank
const updateQuestionBank = async (req, res) => {
  try {
    const { questionBankId } = req.params;
    const updateData = req.body;

    const questionBank = await QuestionBank.findByIdAndUpdate(
      questionBankId,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'profile.firstName profile.lastName email');

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }

    res.json({
      success: true,
      message: 'Question bank updated successfully',
      data: { questionBank }
    });
  } catch (error) {
    console.error('Error updating question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update question bank',
      error: error.message
    });
  }
};

// Delete question bank
const deleteQuestionBank = async (req, res) => {
  try {
    const { questionBankId } = req.params;

    // Check if question bank is used in any exams
    const examsUsingBank = await Exam.find({ questionBankId });
    if (examsUsingBank.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete question bank as it is being used in exams'
      });
    }

    const questionBank = await QuestionBank.findByIdAndDelete(questionBankId);

    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }

    // Also delete all questions in this bank
    await Question.deleteMany({ questionBankId });

    res.json({
      success: true,
      message: 'Question bank deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete question bank',
      error: error.message
    });
  }
};

// Add questions to question bank
const addQuestionsToBank = async (req, res) => {
  try {
    const { questionBankId } = req.params;
    const { questions } = req.body; // Array of question data

    const questionBank = await QuestionBank.findById(questionBankId);
    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }

    // Create questions and associate them with the question bank
    const createdQuestions = [];
    for (const questionData of questions) {
      const question = new Question({
        ...questionData,
        questionBankId,
        organizationId: questionBank.organizationId,
        createdBy: req.user.id
      });
      await question.save();
      createdQuestions.push(question);
      questionBank.questions.push(question._id);
    }

    // Update question bank statistics
    await updateQuestionBankStatistics(questionBankId);

    res.json({
      success: true,
      message: 'Questions added to question bank successfully',
      data: { questions: createdQuestions }
    });
  } catch (error) {
    console.error('Error adding questions to question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add questions to question bank',
      error: error.message
    });
  }
};

// Get questions in a question bank
const getQuestionsInBank = async (req, res) => {
  try {
    const { questionBankId } = req.params;

    const questions = await Question.find({ questionBankId })
      .populate('createdBy', 'profile.firstName profile.lastName email')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: { questions }
    });
  } catch (error) {
    console.error('Error fetching questions in bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch questions in bank',
      error: error.message
    });
  }
};

// Remove question from question bank
const removeQuestionFromBank = async (req, res) => {
  try {
    const { questionBankId, questionId } = req.params;

    const question = await Question.findOneAndDelete({
      _id: questionId,
      questionBankId
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found in this question bank'
      });
    }

    // Update question bank
    await QuestionBank.findByIdAndUpdate(
      questionBankId,
      { $pull: { questions: questionId } }
    );

    // Update question bank statistics
    await updateQuestionBankStatistics(questionBankId);

    res.json({
      success: true,
      message: 'Question removed from question bank successfully'
    });
  } catch (error) {
    console.error('Error removing question from question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove question from question bank',
      error: error.message
    });
  }
};

// Update question bank statistics
const updateQuestionBankStatistics = async (questionBankId) => {
  try {
    const questions = await Question.find({ questionBankId });
    
    const stats = {
      totalQuestions: questions.length,
      questionsByType: {},
      questionsByDifficulty: {},
      totalMarks: 0
    };

    // Initialize counters
    ['multiple_choice', 'subjective', 'true_false', 'numeric'].forEach(type => {
      stats.questionsByType[type] = 0;
    });
    ['easy', 'medium', 'hard'].forEach(difficulty => {
      stats.questionsByDifficulty[difficulty] = 0;
    });

    // Calculate statistics
    questions.forEach(question => {
      stats.questionsByType[question.questionType] = 
        (stats.questionsByType[question.questionType] || 0) + 1;
      stats.questionsByDifficulty[question.difficulty] = 
        (stats.questionsByDifficulty[question.difficulty] || 0) + 1;
      stats.totalMarks += question.marks || 0;
    });

    // Update question bank
    await QuestionBank.findByIdAndUpdate(questionBankId, stats);
  } catch (error) {
    console.error('Error updating question bank statistics:', error);
  }
};

// Get question bank statistics
const getQuestionBankStatistics = async (req, res) => {
  try {
    const { questionBankId } = req.params;

    const questionBank = await QuestionBank.findById(questionBankId);
    if (!questionBank) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }

    res.json({
      success: true,
      data: { statistics: questionBank }
    });
  } catch (error) {
    console.error('Error fetching question bank statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch question bank statistics',
      error: error.message
    });
  }
};

// Duplicate question bank
const duplicateQuestionBank = async (req, res) => {
  try {
    const { questionBankId } = req.params;

    const originalBank = await QuestionBank.findById(questionBankId);
    if (!originalBank) {
      return res.status(404).json({
        success: false,
        message: 'Question bank not found'
      });
    }

    // Create duplicate question bank
    const duplicateBank = new QuestionBank({
      ...originalBank.toObject(),
      _id: undefined,
      name: `${originalBank.name} (Copy)`,
      questions: [],
      totalQuestions: 0,
      questionsByType: {},
      questionsByDifficulty: {},
      totalMarks: 0,
      usageCount: 0,
      lastUsed: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await duplicateBank.save();

    // Duplicate questions
    const originalQuestions = await Question.find({ questionBankId });
    for (const question of originalQuestions) {
      const duplicateQuestion = new Question({
        ...question.toObject(),
        _id: undefined,
        questionBankId: duplicateBank._id,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      await duplicateQuestion.save();
      duplicateBank.questions.push(duplicateQuestion._id);
    }

    // Update statistics
    await updateQuestionBankStatistics(duplicateBank._id);

    res.json({
      success: true,
      message: 'Question bank duplicated successfully',
      data: { questionBank: duplicateBank }
    });
  } catch (error) {
    console.error('Error duplicating question bank:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to duplicate question bank',
      error: error.message
    });
  }
};

module.exports = {
  createQuestionBank,
  getQuestionBanks,
  getQuestionBankById,
  updateQuestionBank,
  deleteQuestionBank,
  addQuestionsToBank,
  getQuestionsInBank,
  removeQuestionFromBank,
  updateQuestionBankStatistics,
  getQuestionBankStatistics,
  duplicateQuestionBank
};

