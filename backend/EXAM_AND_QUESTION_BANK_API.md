# Exam and Question Bank API Documentation

## Overview
This document describes the API endpoints for the Exam and Question Bank management system. The system follows a separation of concerns approach:

- **Question Bank**: Independent question management where questions are created, stored, and managed separately
- **Exam Management**: Exam scheduling and management that references questions from the question bank

This design allows questions to be reused across multiple exams and provides better organization of educational content.

## Base URL
```
http://localhost:5001/api
```

## Authentication
All endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Exam Management API

### 1. Create Exam
**POST** `/exams`

Creates a new exam with basic information.

**Request Body:**
```json
{
  "title": "Mathematics Mid-term Exam",
  "subject": "Mathematics",
  "class": "Grade 10A",
  "examType": "mcq",
  "totalQuestions": 25,
  "marksPerQuestion": 2,
  "totalMarks": 50,
  "scheduledDate": "2024-02-15",
  "startTime": "09:00",
  "duration": 120
}
```

**Response:**
```json
{
  "success": true,
  "message": "Exam created successfully",
  "data": {
    "exam": {
      "_id": "exam_id",
      "title": "Mathematics Mid-term Exam",
      "subject": "Mathematics",
      "class": "Grade 10A",
      "examType": "mcq",
      "totalQuestions": 25,
      "marksPerQuestion": 2,
      "totalMarks": 50,
      "scheduledDate": "2024-02-15T00:00:00.000Z",
      "startTime": "09:00",
      "duration": 120,
      "status": "scheduled",
      "questionsAdded": 0,
      "organizationId": "org_id",
      "createdBy": "user_id",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 2. Get All Exams
**GET** `/exams`

Retrieves all exams with optional filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (scheduled, active, paused, completed)
- `subject` (optional): Filter by subject
- `examType` (optional): Filter by exam type (mcq, subjective)

**Response:**
```json
{
  "success": true,
  "data": {
    "exams": [
      {
        "_id": "exam_id",
        "title": "Mathematics Mid-term Exam",
        "subject": "Mathematics",
        "class": "Grade 10A",
        "examType": "mcq",
        "status": "scheduled",
        "questionsAdded": 25,
        "totalQuestions": 25,
        "totalMarks": 50,
        "scheduledDate": "2024-02-15T00:00:00.000Z",
        "startTime": "09:00",
        "duration": 120,
        "createdBy": {
          "_id": "user_id",
          "profile": {
            "firstName": "John",
            "lastName": "Doe"
          },
          "email": "john@example.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalExams": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 3. Get Exam by ID
**GET** `/exams/:examId`

Retrieves a specific exam with its details and questions.

**Response:**
```json
{
  "success": true,
  "data": {
    "exam": {
      "_id": "exam_id",
      "title": "Mathematics Mid-term Exam",
      "subject": "Mathematics",
      "class": "Grade 10A",
      "examType": "mcq",
      "status": "scheduled",
      "questionsAdded": 25,
      "totalQuestions": 25,
      "totalMarks": 50,
      "scheduledDate": "2024-02-15T00:00:00.000Z",
      "startTime": "09:00",
      "duration": 120,
      "questions": [
        {
          "_id": "question_id",
          "questionText": "What is 2 + 2?",
          "questionType": "multiple_choice",
          "options": [
            { "text": "3", "isCorrect": false },
            { "text": "4", "isCorrect": true },
            { "text": "5", "isCorrect": false },
            { "text": "6", "isCorrect": false }
          ],
          "marks": 2,
          "difficulty": "easy",
          "questionNumber": 1
        }
      ],
      "createdBy": {
        "_id": "user_id",
        "profile": {
          "firstName": "John",
          "lastName": "Doe"
        }
      }
    }
  }
}
```

### 4. Update Exam
**PUT** `/exams/:examId`

Updates an existing exam.

**Request Body:**
```json
{
  "title": "Updated Mathematics Mid-term Exam",
  "totalQuestions": 30,
  "marksPerQuestion": 2,
  "totalMarks": 60
}
```

### 5. Delete Exam
**DELETE** `/exams/:examId`

Deletes an exam and all its associated questions.

**Response:**
```json
{
  "success": true,
  "message": "Exam deleted successfully"
}
```

### 6. Update Exam Status
**PATCH** `/exams/:examId/status`

Updates the status of an exam.

**Request Body:**
```json
{
  "status": "active"
}
```

**Valid Status Values:**
- `scheduled`: Exam is created but not yet active
- `active`: Exam is currently running
- `paused`: Exam is temporarily stopped
- `completed`: Exam has finished

### 7. Add Questions to Exam
**POST** `/exams/:examId/questions`

Adds existing questions from the question bank to an exam.

**Request Body:**
```json
{
  "questions": [
    {
      "questionId": "question_id_from_question_bank",
      "questionNumber": 1,
      "marks": 2
    },
    {
      "questionId": "another_question_id_from_question_bank",
      "questionNumber": 2,
      "marks": 2
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Questions added to exam successfully",
  "data": {
    "questions": [
      {
        "_id": "question_id",
        "questionText": "What is the capital of France?",
        "questionType": "multiple_choice",
        "options": [
          { "text": "London", "isCorrect": false },
          { "text": "Paris", "isCorrect": true },
          { "text": "Berlin", "isCorrect": false },
          { "text": "Madrid", "isCorrect": false }
        ],
        "marks": 2,
        "difficulty": "easy",
        "questionNumber": 1,
        "examId": "exam_id",
        "organizationId": "org_id",
        "createdBy": "user_id"
      }
    ]
  }
}
```

### 8. Get Exam Questions
**GET** `/exams/:examId/questions`

Retrieves all questions for a specific exam.

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "_id": "question_id",
        "questionText": "What is the capital of France?",
        "questionType": "multiple_choice",
        "options": [
          { "text": "London", "isCorrect": false },
          { "text": "Paris", "isCorrect": true },
          { "text": "Berlin", "isCorrect": false },
          { "text": "Madrid", "isCorrect": false }
        ],
        "marks": 2,
        "difficulty": "easy",
        "questionNumber": 1,
        "createdBy": {
          "_id": "user_id",
          "profile": {
            "firstName": "John",
            "lastName": "Doe"
          }
        }
      }
    ]
  }
}
```

### 9. Remove Question from Exam
**DELETE** `/exams/:examId/questions/:questionId`

Removes a specific question from an exam.

**Response:**
```json
{
  "success": true,
  "message": "Question removed from exam successfully"
}
```

### 10. Get Exam Statistics
**GET** `/exams/:examId/statistics`

Retrieves statistics for a specific exam.

**Response:**
```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalQuestions": 25,
      "questionsByType": {
        "multiple_choice": 20,
        "subjective": 5
      },
      "questionsByDifficulty": {
        "easy": 10,
        "medium": 10,
        "hard": 5
      },
      "totalMarks": 50,
      "averageMarks": 2,
      "completionRate": 100
    }
  }
}
```

### 11. Duplicate Exam
**POST** `/exams/:examId/duplicate`

Creates a copy of an existing exam with all its questions.

**Response:**
```json
{
  "success": true,
  "message": "Exam duplicated successfully",
  "data": {
    "exam": {
      "_id": "new_exam_id",
      "title": "Mathematics Mid-term Exam (Copy)",
      "subject": "Mathematics",
      "class": "Grade 10A",
      "examType": "mcq",
      "status": "scheduled",
      "questionsAdded": 25,
      "totalQuestions": 25,
      "totalMarks": 50
    }
  }
}
```

### 12. Schedule Exam
**POST** `/exams/:examId/schedule`

Updates the schedule of an exam.

**Request Body:**
```json
{
  "scheduledDate": "2024-02-20",
  "startTime": "10:00",
  "duration": 90
}
```

### 13. Get Exam Results
**GET** `/exams/:examId/results`

Retrieves results for a specific exam (placeholder for future implementation).

## Question Bank API

### 1. Create Question
**POST** `/questions`

Creates a new question in the question bank.

**Request Body:**
```json
{
  "title": "Basic Math Question",
  "questionText": "What is 2 + 2?",
  "questionType": "multiple_choice",
  "subject": "Mathematics",
  "category": "Arithmetic",
  "marks": 2,
  "difficulty": "easy",
  "options": [
    { "text": "3", "isCorrect": false },
    { "text": "4", "isCorrect": true },
    { "text": "5", "isCorrect": false },
    { "text": "6", "isCorrect": false }
  ],
  "correctAnswer": "4",
  "explanation": "2 + 2 equals 4",
  "tags": ["math", "addition", "basic"]
}
```

### 2. Get Questions
**GET** `/questions`

Retrieves questions with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `subject` (optional): Filter by subject
- `difficulty` (optional): Filter by difficulty
- `questionType` (optional): Filter by question type
- `searchText` (optional): Search in question text

### 3. Get Question by ID
**GET** `/questions/:questionId`

Retrieves a specific question.

### 4. Update Question
**PUT** `/questions/:questionId`

Updates an existing question.

### 5. Delete Question
**DELETE** `/questions/:questionId`

Deletes a question.

### 6. Duplicate Question
**POST** `/questions/:questionId/duplicate`

Creates a copy of an existing question.

### 7. Validate Question
**POST** `/questions/:questionId/validate`

Validates a question for completeness and correctness.

### 8. Bulk Import Questions
**POST** `/questions/bulk-import`

Imports multiple questions at once.

**Request Body:**
```json
{
  "questions": [
    {
      "questionText": "Question 1",
      "questionType": "multiple_choice",
      "options": [...],
      "marks": 2,
      "difficulty": "easy"
    },
    {
      "questionText": "Question 2",
      "questionType": "subjective",
      "marks": 5,
      "difficulty": "medium"
    }
  ]
}
```

### 9. Get Available Questions for Exam
**GET** `/questions/available-for-exam`

Gets questions from the question bank that can be added to an exam.

**Query Parameters:**
- `subject` (optional): Filter by subject
- `questionType` (optional): Filter by question type
- `difficulty` (optional): Filter by difficulty
- `examId` (optional): Exclude questions already in this exam
- `limit` (optional): Number of questions to return (default: 50)
- `page` (optional): Page number (default: 1)

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "_id": "question_id",
        "questionText": "What is 2 + 2?",
        "questionType": "multiple_choice",
        "subject": "Mathematics",
        "difficulty": "easy",
        "marks": 2,
        "options": [
          { "text": "3", "isCorrect": false },
          { "text": "4", "isCorrect": true },
          { "text": "5", "isCorrect": false },
          { "text": "6", "isCorrect": false }
        ],
        "createdBy": {
          "_id": "user_id",
          "profile": {
            "firstName": "John",
            "lastName": "Doe"
          }
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalQuestions": 100,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 10. Export Questions
**GET** `/questions/export`

Exports questions in various formats.

**Query Parameters:**
- `format` (optional): Export format (json, csv) - default: json
- `subject` (optional): Filter by subject
- `difficulty` (optional): Filter by difficulty

### 10. Get Question Statistics
**GET** `/questions/statistics`

Retrieves overall statistics for the question bank.

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalQuestions": 150,
      "activeQuestions": 140,
      "draftQuestions": 10,
      "averageSuccessRate": 75.5
    },
    "bySubject": {
      "Mathematics": 50,
      "Science": 40,
      "English": 30,
      "History": 30
    },
    "byDifficulty": {
      "easy": 60,
      "medium": 70,
      "hard": 20
    },
    "byType": {
      "multiple_choice": 100,
      "subjective": 30,
      "numeric": 20
    }
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request data",
  "error": "Detailed error message"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message"
}
```

## Data Models

### Exam Model
```javascript
{
  _id: ObjectId,
  title: String,
  subject: String,
  class: String,
  examType: String, // 'mcq' or 'subjective'
  totalQuestions: Number,
  marksPerQuestion: Number,
  totalMarks: Number,
  scheduledDate: Date,
  startTime: String,
  duration: Number, // in minutes
  status: String, // 'scheduled', 'active', 'paused', 'completed'
  questionsAdded: Number,
  organizationId: ObjectId,
  createdBy: ObjectId,
  questions: [{
    questionId: ObjectId, // Reference to Question document
    questionNumber: Number,
    marks: Number
  }], // References to questions from question bank
  createdAt: Date,
  updatedAt: Date
}
```

### Question Model
```javascript
{
  _id: ObjectId,
  title: String,
  questionText: String,
  questionType: String, // 'multiple_choice', 'subjective', 'numeric', 'true_false'
  subject: String,
  category: String,
  marks: Number,
  difficulty: String, // 'easy', 'medium', 'hard'
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: String,
  explanation: String,
  tags: [String],
  organizationId: ObjectId,
  createdBy: ObjectId,
  analytics: {
    totalAttempts: Number,
    correctAttempts: Number,
    successRate: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Examples

### Creating a Complete Exam Workflow

1. **Create Exam:**
```bash
curl -X POST http://localhost:5001/api/exams \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mathematics Quiz",
    "subject": "Mathematics",
    "class": "Grade 10A",
    "examType": "mcq",
    "totalQuestions": 10,
    "marksPerQuestion": 2,
    "totalMarks": 20,
    "scheduledDate": "2024-02-15",
    "startTime": "09:00",
    "duration": 60
  }'
```

2. **Add Questions to Exam:**
```bash
curl -X POST http://localhost:5001/api/exams/<exam_id>/questions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      {
        "questionText": "What is 2 + 2?",
        "questionType": "multiple_choice",
        "options": [
          {"text": "3", "isCorrect": false},
          {"text": "4", "isCorrect": true},
          {"text": "5", "isCorrect": false},
          {"text": "6", "isCorrect": false}
        ],
        "marks": 2,
        "difficulty": "easy",
        "questionNumber": 1,
        "explanation": "2 + 2 equals 4"
      }
    ]
  }'
```

3. **Activate Exam:**
```bash
curl -X PATCH http://localhost:5001/api/exams/<exam_id>/status \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

This API provides a complete solution for exam and question bank management, allowing organizations to create, manage, and conduct exams efficiently.