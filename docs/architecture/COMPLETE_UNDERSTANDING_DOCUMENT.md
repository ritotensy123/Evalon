# EVALON EXAM MANAGEMENT SYSTEM - COMPLETE UNDERSTANDING DOCUMENT

**Generated:** $(date)  
**Project:** Evalon - AI-Powered Exam Proctoring Platform  
**Architecture:** Full-Stack (React + Node.js + Python + MongoDB)

---

## TABLE OF CONTENTS

1. [Project Summary](#1-project-summary)
2. [All Modules & Their Purpose](#2-all-modules--their-purpose)
3. [Complete Architecture Mapping](#3-complete-architecture-mapping)
4. [File Structure (Full Tree)](#4-file-structure-full-tree)
5. [Communication Flow](#5-communication-flow)
6. [Key Functionalities](#6-key-functionalities)
7. [Dependencies & External Services](#7-dependencies--external-services)
8. [Current Issues & Warnings](#8-current-issues--warnings)
9. [Logical Errors, Risks, Broken Patterns](#9-logical-errors-risks-broken-patterns)
10. [Port Usage & Conflicts](#10-port-usage--conflicts)
11. [Missing Files, Broken Imports, Unused Code](#11-missing-files-broken-imports-unused-code)
12. [UI/UX Inconsistencies](#12-uiux-inconsistencies)
13. [Refactoring Recommendations](#13-refactoring-recommendations)

---

## 1. PROJECT SUMMARY

### Overview
Evalon is a comprehensive **AI-powered online exam management and proctoring system** designed for educational institutions. It provides:

- **Multi-tenant organization management** with hierarchical user roles
- **Real-time exam monitoring** with WebSocket-based communication
- **AI-powered proctoring** using computer vision and machine learning
- **Question bank management** with bulk import/export
- **Comprehensive exam lifecycle** from creation to evaluation
- **Student and teacher dashboards** with role-based access control

### Technology Stack
- **Frontend:** React 19.1.1, Material-UI 7.3.0, Vite 5.0, TailwindCSS 3.4
- **Backend:** Node.js 18+, Express 4.18, Socket.IO 4.8
- **Database:** MongoDB (Mongoose 8.0)
- **AI Service:** Python 3.x, Flask 3.0, OpenCV 4.8, TensorFlow 2.15
- **Authentication:** JWT, Firebase Admin SDK, Google OAuth
- **Communication:** REST APIs, WebSocket (Socket.IO)

### Core Features
1. **Organization Registration & Management**
2. **User Management** (Organization Admin, Sub-Admin, Teacher, Student)
3. **Department & Subject Management**
4. **Question Bank System** with bulk operations
5. **Exam Creation & Scheduling**
6. **Real-time Exam Monitoring**
7. **AI Proctoring** (face detection, behavior analysis)
8. **Exam Session Management**
9. **Results & Analytics**

---

## 2. ALL MODULES & THEIR PURPOSE

### 2.1 Backend Modules (`/backend/src/`)

#### **Config (`/config/`)**
- **`database.js`**: MongoDB connection with health checks and auto-fix
- **`firebase.js`**: Firebase Admin SDK initialization
- **`server.js`**: Centralized server configuration (ports, CORS, URLs)

#### **Models (`/models/`)**
- **`User.js`**: Authentication & user account management (JWT, password hashing)
- **`Organization.js`**: Multi-tenant organization data
- **`Teacher.js`**: Teacher profile and professional details
- **`Student.js`**: Student profile and academic details
- **`Exam.js`**: Exam definitions, scheduling, results
- **`ExamSession.js`**: Active exam session tracking
- **`ExamActivityLog.js`**: Audit trail for exam activities (PII-free)
- **`Question.js`**: Individual question definitions
- **`QuestionBank.js`**: Question bank collections
- **`Department.js`**: Department hierarchy
- **`Subject.js`**: Subject/course definitions
- **`TeacherClass.js`**: Teacher-class assignments
- **`UserManagement.js`**: User management records
- **`Invitation.js`**: User invitation system
- **`OTP.js`**: OTP storage for email/SMS verification

#### **Controllers (`/controllers/`)**
- **`authController.js`**: Login, registration, Google OAuth
- **`organizationController.js`**: Organization CRUD, registration flow
- **`teacherController.js`**: Teacher management
- **`studentController.js`**: Student management
- **`examController.js`**: Exam CRUD, scheduling, enrollment
- **`questionController.js`**: Question CRUD, validation
- **`questionBankController.js`**: Question bank operations
- **`departmentController.js`**: Department management
- **`subjectController.js`**: Subject management
- **`teacherClassController.js`**: Teacher-class assignments
- **`userManagementController.js`**: User management, invitations, bulk operations
- **`userActivityController.js`**: Activity logging
- **`userPermissionController.js`**: Permission management
- **`bulkUploadController.js`**: CSV bulk upload processing
- **`otpController.js`**: OTP generation and verification
- **`healthController.js`**: Health check endpoints
- **`timeController.js`**: Server time sync, exam countdown

#### **Routes (`/routes/`)**
- **`authRoutes.js`**: `/api/v1/auth/*`
- **`organizationRoutes.js`**: `/api/v1/organizations/*`
- **`teacherRoutes.js`**: `/api/v1/teachers/*`
- **`studentRoutes.js`**: `/api/v1/students/*`
- **`examRoutes.js`**: `/api/v1/exams/*`
- **`questionRoutes.js`**: `/api/v1/questions/*`
- **`questionBankRoutes.js`**: `/api/v1/question-banks/*`
- **`departmentRoutes.js`**: `/api/v1/departments/*`
- **`subjectRoutes.js`**: `/api/v1/subjects/*`
- **`teacherClassRoutes.js`**: `/api/v1/teacher-classes/*`
- **`userManagementRoutes.js`**: `/api/v1/user-management/*`
- **`userActivityRoutes.js`**: `/api/v1/user-activity/*`
- **`userPermissionRoutes.js`**: `/api/v1/user-permissions/*`
- **`bulkUploadRoutes.js`**: `/api/v1/bulk-upload/*`
- **`locationRoutes.js`**: `/api/v1/locations/*`
- **`healthRoutes.js`**: `/api/v1/health`
- **`timeRoutes.js`**: `/api/v1/time/*`

#### **Middleware (`/middleware/`)**
- **`auth.js`**: JWT authentication, token verification, user population
- **`userManagementAuth.js`**: Specialized auth for user management routes

#### **Services (`/services/`)**
- **`questionBankService.js`**: Question bank business logic
- **`tempStorage.js`**: Temporary data storage utilities

#### **Utils (`/utils/`)**
- **`authUtils.js`**: Shared authentication utilities (token generation, verification)
- **`createUserFromRegistration.js`**: User creation helper
- **`databaseHealth.js`**: Database health checks and auto-fix
- **`tempStorage.js`**: Temporary storage utilities

#### **Real-time Server (`realtimeServer.js`)**
- **Purpose:** WebSocket server for real-time exam monitoring
- **Port:** 5004 (configurable via `REALTIME_PORT`)
- **Features:**
  - Student exam session management
  - Teacher monitoring dashboard
  - Real-time progress updates
  - AI proctoring event broadcasting
  - Security flag reporting
  - Video/audio stats monitoring
  - Heartbeat and connection management

### 2.2 Frontend Modules (`/frontend/src/`)

#### **Pages (`/pages/`)**
- **`LandingPage.js`**: Public landing page
- **`LoginPage.js`**: Authentication page
- **`OnboardingPage.js`**: Registration selection
- **`CompleteRegistration.js`**: Registration completion
- **`Dashboard.js`**: Main dashboard router
- **`AIModelTestPage.js`**: AI model testing interface
- **`onboarding/`**: Organization, Teacher, Student registration forms
- **`dashboard/`**: Role-specific dashboards (Organization, Teacher, Student, Sub-Admin)

#### **Components (`/components/`)**
- **`ProtectedRoute.js`**: Route protection wrapper
- **`FirstTimeLoginWizard.js`**: First-time user onboarding
- **`ErrorBoundary.js`**: Error boundary component
- **`exam/`**: Exam-related components (StudentExamInterface, RealtimeExamMonitor, etc.)
- **`department/`**: Department management components
- **`subject/`**: Subject management components
- **`userManagement/`**: User management components (bulk upload, invitations, etc.)
- **`registration/`**: Registration form components
- **`setup/`**: System setup wizard

#### **Services (`/services/`)**
- **`api.js`**: Centralized API client (axios)
- **`authService.js`**: Authentication service
- **`googleAuthService.js`**: Google OAuth integration
- **`realtimeSocketService.js`**: WebSocket client service
- **`aiProctoringService.js`**: AI proctoring API client
- **`studentAPI.js`**: Student-specific API calls
- **`teacherAPI.js`**: Teacher-specific API calls
- **`navigationService.js`**: Navigation utilities

#### **Contexts (`/contexts/`)**
- **`AuthContext.js`**: Global authentication state management

#### **Config (`/config/`)**
- **`apiConfig.js`**: API endpoint configuration

#### **Utils (`/utils/`)**
- Utility functions for common operations

### 2.3 Python AI Service (`/python/`)

#### **`face_detection_service.py`**
- **Purpose:** AI-powered face detection and behavior analysis
- **Port:** 5002 (configurable, with auto-port-finding)
- **Features:**
  - Single/multiple face detection
  - Face presence validation
  - Behavior classification (CNN model)
  - ML ensemble models (KNN, Naive Bayes, Decision Tree, SVM)
  - Comprehensive proctoring analysis
  - JWT authentication
  - CORS support

#### **`ML_MODELS_EXPLANATION.md`**
- Documentation for ML models used

#### **`requirements.txt`**
- Python dependencies (Flask, OpenCV, TensorFlow, scikit-learn)

---

## 3. COMPLETE ARCHITECTURE MAPPING

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND (React)                      │
│                    Port: 3001 (Vite Dev)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Pages      │  │  Components  │  │   Services   │    │
│  │  Dashboard   │  │  Exam UI     │  │   API Client │    │
│  │  Login       │  │  Forms       │  │   Socket.IO   │    │
│  │  Onboarding  │  │  Charts      │  │   Auth       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST + WebSocket
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ MAIN SERVER  │   │ REALTIME     │   │ AI SERVICE   │
│  (Express)   │   │ SERVER       │   │  (Flask)     │
│  Port: 5001  │   │ Port: 5004   │   │ Port: 5002   │
│              │   │              │   │              │
│ ┌──────────┐ │   │ ┌──────────┐ │   │ ┌──────────┐ │
│ │ Routes   │ │   │ │ Socket.IO│ │   │ │ Face     │ │
│ │ Controllers│   │ │ Events   │ │   │ │ Detection│ │
│ │ Models   │ │   │ │ DataStore│ │   │ │ ML Models│ │
│ └──────────┘ │   │ └──────────┘ │   │ └──────────┘ │
└──────────────┘   └──────────────┘   └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   MONGODB     │
                    │  (Database)   │
                    │              │
                    │ Collections: │
                    │ - Users      │
                    │ - Exams      │
                    │ - Sessions   │
                    │ - Questions  │
                    │ - Orgs       │
                    └──────────────┘
```

### 3.2 Data Flow

#### **Authentication Flow**
```
User → Frontend (LoginPage) 
  → authService.login() 
  → POST /api/v1/auth/login 
  → authController.login() 
  → User.findByEmailAndType() 
  → JWT Token Generation 
  → Response with User Data 
  → localStorage + AuthContext 
  → Redirect to Dashboard
```

#### **Exam Session Flow**
```
Student → Exam Interface 
  → Socket.IO Connect (realtimeServer) 
  → join_exam_session event 
  → ExamSession.create() 
  → AI Service: Face Detection 
  → Real-time Monitoring 
  → Progress Updates (WebSocket) 
  → Submit Answers 
  → ExamSession.update() 
  → Results Calculation
```

#### **AI Proctoring Flow**
```
Student Camera → Frontend (aiProctoringService) 
  → POST /api/comprehensive-proctoring 
  → Python Service (face_detection_service.py) 
  → OpenCV Face Detection 
  → ML Models (Behavior Classification) 
  → Risk Score Calculation 
  → Response to Frontend 
  → WebSocket Broadcast to Teachers 
  → ExamActivityLog.create()
```

### 3.3 Request Flow (REST API)

```
Client Request
  ↓
Express App (server.js)
  ↓
Middleware Stack:
  - Helmet (Security)
  - CORS
  - Compression
  - Rate Limiting
  - Request ID
  - Body Parser
  - Session
  ↓
Route Handler (routes/*.js)
  ↓
Auth Middleware (if protected)
  ↓
Controller (controllers/*.js)
  ↓
Model Operations (models/*.js)
  ↓
MongoDB Query
  ↓
Response
```

### 3.4 WebSocket Flow (Real-time)

```
Client Connect
  ↓
Socket.IO Handshake
  ↓
Authentication (JWT Token)
  ↓
Socket Event Handler (realtimeServer.js)
  ↓
DataStore Update (In-Memory)
  ↓
MongoDB Update (if needed)
  ↓
Broadcast to Monitoring Room
  ↓
Client Receives Update
```

---

## 4. FILE STRUCTURE (FULL TREE)

```
Evalon/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── firebase.js
│   │   │   └── server.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── organizationController.js
│   │   │   ├── teacherController.js
│   │   │   ├── studentController.js
│   │   │   ├── examController.js
│   │   │   ├── questionController.js
│   │   │   ├── questionBankController.js
│   │   │   ├── departmentController.js
│   │   │   ├── subjectController.js
│   │   │   ├── teacherClassController.js
│   │   │   ├── userManagementController.js
│   │   │   ├── userActivityController.js
│   │   │   ├── userPermissionController.js
│   │   │   ├── bulkUploadController.js
│   │   │   ├── otpController.js
│   │   │   ├── healthController.js
│   │   │   └── timeController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── userManagementAuth.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Organization.js
│   │   │   ├── Teacher.js
│   │   │   ├── Student.js
│   │   │   ├── Exam.js
│   │   │   ├── ExamSession.js
│   │   │   ├── ExamActivityLog.js
│   │   │   ├── Question.js
│   │   │   ├── QuestionBank.js
│   │   │   ├── Department.js
│   │   │   ├── Subject.js
│   │   │   ├── TeacherClass.js
│   │   │   ├── UserManagement.js
│   │   │   ├── Invitation.js
│   │   │   └── OTP.js
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── organizationRoutes.js
│   │   │   ├── teacherRoutes.js
│   │   │   ├── studentRoutes.js
│   │   │   ├── examRoutes.js
│   │   │   ├── questionRoutes.js
│   │   │   ├── questionBankRoutes.js
│   │   │   ├── departmentRoutes.js
│   │   │   ├── subjectRoutes.js
│   │   │   ├── teacherClassRoutes.js
│   │   │   ├── userManagementRoutes.js
│   │   │   ├── userActivityRoutes.js
│   │   │   ├── userPermissionRoutes.js
│   │   │   ├── bulkUploadRoutes.js
│   │   │   ├── locationRoutes.js
│   │   │   ├── healthRoutes.js
│   │   │   ├── timeRoutes.js
│   │   │   └── questionBank.js (legacy?)
│   │   ├── services/
│   │   │   ├── questionBankService.js
│   │   │   └── tempStorage.js
│   │   ├── utils/
│   │   │   ├── authUtils.js
│   │   │   ├── createUserFromRegistration.js
│   │   │   ├── databaseHealth.js
│   │   │   └── tempStorage.js
│   │   ├── server.js (Main Express Server)
│   │   └── realtimeServer.js (WebSocket Server)
│   ├── tests/
│   ├── uploads/
│   ├── coverage/
│   ├── scripts/
│   │   └── validate-startup.js
│   ├── package.json
│   ├── env.template
│   ├── start-all-servers.js
│   └── [various test/debug scripts]
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── OnboardingPage.js
│   │   │   ├── CompleteRegistration.js
│   │   │   ├── Dashboard.js
│   │   │   ├── AIModelTestPage.js
│   │   │   ├── onboarding/
│   │   │   │   ├── OrganisationRegistration.js
│   │   │   │   ├── TeacherRegistration.js
│   │   │   │   └── StudentRegistration.js
│   │   │   └── dashboard/
│   │   │       ├── OrganizationDashboard.js
│   │   │       ├── TeacherDashboard.js
│   │   │       ├── StudentDashboard.js
│   │   │       ├── SubAdminDashboard.js
│   │   │       ├── DepartmentDetailPage.js
│   │   │       ├── ExamManagement.js
│   │   │       ├── ExamMonitoring.js
│   │   │       ├── QuestionBankManagement.js
│   │   │       ├── StudentManagement.js
│   │   │       ├── TeacherManagement.js
│   │   │       ├── UserManagement.js
│   │   │       ├── SubjectManagement.js
│   │   │       ├── DepartmentManagement.js
│   │   │       ├── TeacherClassManagement.js
│   │   │       ├── ScheduleManagement.js
│   │   │       ├── QuestionBank.js
│   │   │       └── MonitoringTest.js
│   │   ├── components/
│   │   │   ├── ProtectedRoute.js
│   │   │   ├── FirstTimeLoginWizard.js
│   │   │   ├── ErrorBoundary.js
│   │   │   ├── exam/
│   │   │   ├── department/
│   │   │   ├── subject/
│   │   │   ├── userManagement/
│   │   │   ├── registration/
│   │   │   └── setup/
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── googleAuthService.js
│   │   │   ├── realtimeSocketService.js
│   │   │   ├── aiProctoringService.js
│   │   │   ├── studentAPI.js
│   │   │   ├── teacherAPI.js
│   │   │   └── navigationService.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   ├── config/
│   │   │   └── apiConfig.js
│   │   ├── utils/
│   │   ├── styles/
│   │   ├── theme/
│   │   ├── App.js
│   │   └── main.jsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── env.template
│
├── python/
│   ├── face_detection_service.py
│   ├── suspicious_activity_model.h5
│   ├── requirements.txt
│   ├── env.template
│   ├── start_service.sh
│   └── ML_MODELS_EXPLANATION.md
│
└── [root level files]
    ├── package.json
    └── [documentation files]
```

---

## 5. COMMUNICATION FLOW

### 5.1 React → Node.js → MongoDB

```
React Component
  ↓ (axios)
Frontend Service (api.js)
  ↓ (HTTP Request)
Express Route (routes/*.js)
  ↓
Auth Middleware (if protected)
  ↓
Controller (controllers/*.js)
  ↓
Model (models/*.js)
  ↓ (Mongoose)
MongoDB
  ↓ (Response)
Model → Controller → Route → Service → Component
```

### 5.2 React → Real-time Server (WebSocket)

```
React Component
  ↓
realtimeSocketService.js
  ↓ (Socket.IO Client)
WebSocket Connection
  ↓
realtimeServer.js (Socket.IO Server)
  ↓
Event Handler
  ↓
DataStore (In-Memory) + MongoDB
  ↓
Broadcast to Monitoring Room
  ↓
Frontend Receives Update
```

### 5.3 React → Python AI Service

```
React Component
  ↓
aiProctoringService.js
  ↓ (HTTP POST)
Flask App (face_detection_service.py)
  ↓
JWT Authentication
  ↓
Face Detection (OpenCV)
  ↓
ML Models (TensorFlow/scikit-learn)
  ↓
Response (JSON)
  ↓
Frontend Updates UI
```

### 5.4 Node.js → Python AI Service

```
Backend Controller
  ↓ (HTTP Request with JWT)
Python Flask Service
  ↓
Face Detection Processing
  ↓
Response
  ↓
Backend Stores Results
```

### 5.5 Real-time Server → MongoDB

```
WebSocket Event
  ↓
realtimeServer.js Handler
  ↓
ExamSession.update() / ExamActivityLog.create()
  ↓
MongoDB Write
  ↓
Acknowledgment
```

---

## 6. KEY FUNCTIONALITIES

### 6.1 Authentication & Authorization

**Features:**
- JWT-based authentication
- Multi-provider auth (Local, Google OAuth)
- Role-based access control (Organization Admin, Sub-Admin, Teacher, Student)
- Token versioning for revocation
- Session management
- First-time login wizard

**Flow:**
1. User submits credentials
2. Backend validates and generates JWT
3. Token stored in localStorage
4. AuthContext manages global state
5. Protected routes check authentication
6. API requests include token in Authorization header

### 6.2 Organization Management

**Features:**
- Multi-tenant architecture
- Organization registration (3-step process)
- Organization code system
- Logo upload
- Location management (Country, State, City)
- Setup wizard

**Models:**
- `Organization`: Main organization data
- `User`: Links to organization via `organizationId`

### 6.3 User Management

**Features:**
- Bulk user creation (CSV upload)
- Invitation system (email/SMS)
- Role assignment
- User status management (active/inactive)
- Department assignment
- Email verification
- Phone OTP verification

**User Types:**
- **Organization Admin**: Full organization control
- **Sub-Admin**: Limited admin privileges
- **Teacher**: Exam creation, monitoring
- **Student**: Exam taking

### 6.4 Exam Management

**Features:**
- Exam creation with scheduling
- Question bank integration
- Student enrollment
- Exam status management (draft, scheduled, active, completed)
- Results calculation
- Analytics (average score, completion rate)

**Models:**
- `Exam`: Exam definition
- `ExamSession`: Active session tracking
- `ExamActivityLog`: Audit trail

### 6.5 Real-time Exam Monitoring

**Features:**
- WebSocket-based real-time updates
- Teacher monitoring dashboard
- Student progress tracking
- Security flag reporting
- Video/audio stats monitoring
- AI risk score broadcasting
- Connection health monitoring

**Events:**
- `join_exam_session`: Student joins exam
- `start_monitoring`: Teacher starts monitoring
- `progress_update`: Student progress changes
- `security_flag`: Security violation detected
- `ai_detection`: AI proctoring results

### 6.6 AI Proctoring

**Features:**
- Face detection (single/multiple)
- Behavior classification (CNN model)
- ML ensemble models
- Risk score calculation
- Real-time flagging
- Comprehensive proctoring analysis

**Endpoints:**
- `/api/detect-faces`: Face detection
- `/api/validate-setup`: Pre-exam validation
- `/api/comprehensive-proctoring`: Full analysis
- `/api/classify-behavior`: Behavior classification

### 6.7 Question Bank System

**Features:**
- Question CRUD operations
- Question bank collections
- Bulk import/export (CSV)
- Question validation
- Question statistics
- Question selection (manual, random, weighted)

**Models:**
- `Question`: Individual question
- `QuestionBank`: Question collections

---

## 7. DEPENDENCIES & EXTERNAL SERVICES

### 7.1 Backend Dependencies

**Core:**
- `express`: 4.18.2 - Web framework
- `mongoose`: 8.0.3 - MongoDB ODM
- `socket.io`: 4.8.1 - WebSocket server
- `jsonwebtoken`: 9.0.2 - JWT handling
- `bcryptjs`: 2.4.3 - Password hashing

**Security:**
- `helmet`: 7.1.0 - Security headers
- `cors`: 2.8.5 - CORS handling
- `express-rate-limit`: 7.1.5 - Rate limiting

**Utilities:**
- `axios`: 1.12.2 - HTTP client
- `multer`: 1.4.5-lts.1 - File uploads
- `csv-parser`: 3.2.0 - CSV processing
- `nodemailer`: 6.9.7 - Email sending
- `twilio`: 5.9.0 - SMS service

**External Services:**
- `firebase-admin`: 13.5.0 - Firebase Admin SDK
- `google-auth-library`: 10.3.0 - Google OAuth

### 7.2 Frontend Dependencies

**Core:**
- `react`: 19.1.1
- `react-dom`: 19.1.1
- `react-router-dom`: 7.7.1

**UI:**
- `@mui/material`: 7.3.0
- `@mui/icons-material`: 7.3.0
- `@emotion/react`: 11.14.0
- `@emotion/styled`: 11.14.1
- `tailwindcss`: 3.4.17

**Communication:**
- `axios`: 1.11.0
- `socket.io-client`: 4.8.1
- `firebase`: 12.2.1

**Utilities:**
- `react-toastify`: 11.0.5
- `recharts`: 3.2.0
- `lucide-react`: 0.544.0

### 7.3 Python Dependencies

- `flask`: 3.0.0
- `flask-cors`: 4.0.0
- `opencv-python`: 4.8.1.78
- `numpy`: 1.24.3
- `pillow`: 10.1.0
- `tensorflow`: 2.15.0
- `scikit-learn`: 1.3.2
- `requests`: 2.31.0
- `werkzeug`: 3.0.1

### 7.4 External Services

1. **MongoDB**: Database (local or Atlas)
2. **Firebase**: Google OAuth, Admin SDK
3. **Gmail (Nodemailer)**: Email service
4. **Twilio**: SMS service (optional)
5. **Google OAuth**: Authentication

---

## 8. CURRENT ISSUES & WARNINGS

### 8.1 Critical Issues

#### **CRITICAL-1: Duplicate Code in `server.js`**
- **Location:** `backend/src/server.js` lines 435-503
- **Issue:** Entire graceful shutdown and server startup code is duplicated
- **Impact:** Code maintenance issues, potential confusion
- **Fix Required:** Remove duplicate code block (lines 435-503)

#### **CRITICAL-2: Duplicate Code in `User.js`**
- **Location:** `backend/src/models/User.js` lines 249-268
- **Issue:** `createFromRegistration` method is duplicated
- **Impact:** Potential runtime errors, confusion
- **Fix Required:** Remove duplicate code block (lines 249-268)

#### **CRITICAL-3: Duplicate Code in `realtimeServer.js`**
- **Location:** `backend/src/realtimeServer.js` - entire file appears duplicated
- **Issue:** File is 6753 lines, contains massive duplication
- **Impact:** Performance issues, maintenance nightmare, potential bugs
- **Fix Required:** Complete refactoring to remove duplicate code

#### **CRITICAL-4: Duplicate Code in `timeRoutes.js`**
- **Location:** `backend/src/routes/timeRoutes.js` lines 18-32
- **Issue:** Entire route definition is duplicated
- **Impact:** Route registration issues
- **Fix Required:** Remove duplicate code block (lines 18-32)

### 8.2 High Priority Issues

#### **HIGH-1: Large File Size**
- **File:** `backend/src/realtimeServer.js` (6753 lines)
- **Issue:** Extremely large file, difficult to maintain
- **Recommendation:** Split into multiple modules:
  - `realtimeServer.js` (main server setup)
  - `realtimeHandlers.js` (event handlers)
  - `realtimeDataStore.js` (data store)
  - `realtimeAIRules.js` (AI rule evaluation)

#### **HIGH-2: Missing Error Handling**
- **Location:** Various controllers
- **Issue:** Some async operations lack proper error handling
- **Impact:** Unhandled promise rejections

#### **HIGH-3: Hardcoded Values**
- **Location:** Multiple files
- **Issue:** Magic numbers and strings scattered throughout
- **Recommendation:** Extract to constants/config

#### **HIGH-4: Inconsistent Error Responses**
- **Location:** Controllers
- **Issue:** Error response formats vary
- **Recommendation:** Standardize error response format

### 8.3 Medium Priority Issues

#### **MEDIUM-1: TODO Comments**
- **Location:** `organizationController.js` line 235, `userManagementController.js` lines 1388, 2021
- **Issue:** Incomplete email/SMS sending implementations
- **Status:** Marked as TODO

#### **MEDIUM-2: Debug Logging in Production**
- **Location:** Multiple files
- **Issue:** Console.log statements not wrapped in environment checks
- **Recommendation:** Use proper logging library (winston, pino)

#### **MEDIUM-3: Missing Input Validation**
- **Location:** Some route handlers
- **Issue:** Not all endpoints validate input properly
- **Recommendation:** Use express-validator consistently

### 8.4 Low Priority Issues

#### **LOW-1: Inconsistent Naming**
- **Location:** Various files
- **Issue:** Some inconsistencies in variable naming conventions
- **Impact:** Minor, readability

#### **LOW-2: Missing JSDoc Comments**
- **Location:** Many functions
- **Issue:** Lack of documentation
- **Impact:** Developer experience

---

## 9. LOGICAL ERRORS, RISKS, BROKEN PATTERNS

### 9.1 Security Risks

#### **RISK-1: JWT Secret Validation**
- **Location:** `backend/src/config/server.js`
- **Issue:** JWT_SECRET not validated in server config (only in authUtils)
- **Risk:** Server may start without JWT_SECRET
- **Fix:** Add validation in server.js startup

#### **RISK-2: Session Secret Validation**
- **Location:** `backend/src/server.js` line 142
- **Status:** ✅ Properly validated (exits if missing)
- **Note:** Good practice

#### **RISK-3: CORS Configuration**
- **Location:** `backend/src/config/server.js`
- **Status:** ✅ Properly configured with environment variables
- **Note:** Good practice

#### **RISK-4: Password Hashing**
- **Location:** `backend/src/models/User.js`
- **Status:** ✅ Uses bcrypt with salt rounds 12
- **Note:** Good practice

### 9.2 Logical Errors

#### **ERROR-1: Duplicate Module Exports**
- **Location:** `backend/src/server.js` line 433 and 503
- **Issue:** Two `module.exports = app;` statements
- **Impact:** Second export is unreachable (dead code)

#### **ERROR-2: Duplicate Model Exports**
- **Location:** `backend/src/models/User.js` line 247 and 268
- **Issue:** Two `module.exports = mongoose.model('User', userSchema);`
- **Impact:** Second export is unreachable

#### **ERROR-3: Duplicate Route Exports**
- **Location:** `backend/src/routes/timeRoutes.js` line 16 and 32
- **Issue:** Two `module.exports = router;`
- **Impact:** Second export is unreachable

### 9.3 Broken Patterns

#### **PATTERN-1: Inconsistent API Response Format**
- **Issue:** Some endpoints return `{ success: true, data: ... }`, others return `{ success: true, ... }` directly
- **Recommendation:** Standardize response wrapper

#### **PATTERN-2: Mixed Error Handling**
- **Issue:** Some use try-catch, others use .catch(), inconsistent error formats
- **Recommendation:** Standardize error handling middleware

#### **PATTERN-3: Inconsistent Async/Await Usage**
- **Issue:** Mix of async/await and .then()/.catch()
- **Recommendation:** Standardize on async/await

### 9.4 Code Smells

#### **SMELL-1: God Object**
- **File:** `realtimeServer.js` (6753 lines)
- **Issue:** Single file doing too much
- **Fix:** Split into multiple modules

#### **SMELL-2: Long Functions**
- **Location:** Various controllers
- **Issue:** Some functions exceed 100 lines
- **Recommendation:** Extract helper functions

#### **SMELL-3: Magic Numbers**
- **Location:** Throughout codebase
- **Issue:** Hardcoded values (timeouts, limits, etc.)
- **Recommendation:** Extract to constants

---

## 10. PORT USAGE & CONFLICTS

### 10.1 Port Configuration

| Service | Default Port | Environment Variable | Config File |
|---------|-------------|---------------------|-------------|
| **Frontend (Vite)** | 3001 | N/A | `vite.config.js` |
| **Main Backend** | 5001 | `PORT` | `backend/env.template` |
| **Real-time Server** | 5004 | `REALTIME_PORT` | `backend/env.template` |
| **Python AI Service** | 5002 | `PORT` | `python/env.template` |

### 10.2 Port Conflicts

#### **CONFLICT-1: Frontend Port**
- **Issue:** Vite config hardcodes port 3001, but env.template mentions 3000
- **Location:** `frontend/vite.config.js` line 14 vs `backend/env.template` line 44
- **Impact:** Potential confusion
- **Fix:** Align configuration

#### **CONFLICT-2: Python Service Auto-Port-Finding**
- **Location:** `python/face_detection_service.py` lines 1435-1448
- **Feature:** Auto-finds free port if 5002 is occupied
- **Status:** ✅ Good feature, but may cause confusion if port changes
- **Recommendation:** Log the actual port used

### 10.3 Port Usage Summary

```
Port 3000: Frontend (mentioned in env.template, but not used)
Port 3001: Frontend (Vite dev server) ✅
Port 5001: Main Backend API ✅
Port 5002: Python AI Service ✅
Port 5004: Real-time WebSocket Server ✅
```

**No actual conflicts detected**, but configuration inconsistency exists.

---

## 11. MISSING FILES, BROKEN IMPORTS, UNUSED CODE

### 11.1 Missing Files

#### **MISSING-1: Environment Files**
- **Status:** ✅ Templates exist (`env.template` files)
- **Note:** Actual `.env` files should be created from templates (gitignored)

#### **MISSING-2: Firebase Service Account JSON**
- **Location:** `backend/` (referenced in config)
- **Status:** Should be provided via environment or file
- **Note:** File exists: `evalon-app-firebase-adminsdk-fbsvc-6160ee1433.json`

#### **MISSING-3: AI Model Files**
- **Location:** `python/models/` (referenced in face_detection_service.py)
- **Status:** Code has fallback to Haar Cascade if models don't exist
- **Note:** `suspicious_activity_model.h5` exists in root

### 11.2 Broken Imports

#### **IMPORT-1: Question Bank Route**
- **Location:** `backend/src/routes/questionBank.js`
- **Issue:** Legacy file? Both `questionBankRoutes.js` and `questionBank.js` exist
- **Status:** Need to verify which is used

#### **IMPORT-2: Time Routes Duplication**
- **Location:** `backend/src/routes/timeRoutes.js`
- **Issue:** Duplicate code may cause import issues
- **Status:** Needs cleanup

### 11.3 Unused Code

#### **UNUSED-1: Test/Debug Scripts**
- **Location:** `backend/` root directory
- **Files:** Multiple test-*.js, debug-*.js, check-*.js files
- **Status:** Development utilities, may be needed for debugging
- **Recommendation:** Move to `scripts/` directory or document purpose

#### **UNUSED-2: Coverage Directory**
- **Location:** `backend/coverage/`
- **Status:** Generated files, should be gitignored
- **Note:** Already in .gitignore likely

#### **UNUSED-3: Reference UI Images**
- **Location:** `reference ui/`
- **Status:** Reference images, may not be needed in production
- **Recommendation:** Move to docs or remove

### 11.4 Dead Code

#### **DEAD-1: Duplicate Exports**
- **Location:** Multiple files with duplicate `module.exports`
- **Status:** Second export is unreachable
- **Fix:** Remove duplicate exports

#### **DEAD-2: Unreachable Code Blocks**
- **Location:** Files with duplicate code sections
- **Status:** Second blocks are unreachable
- **Fix:** Remove duplicates

---

## 12. UI/UX INCONSISTENCIES

### 12.1 Design System

#### **INCONSISTENCY-1: Theme Usage**
- **Status:** ✅ Uses Material-UI theme system
- **Location:** `frontend/src/theme/`
- **Note:** Appears consistent

#### **INCONSISTENCY-2: Styling Approach**
- **Issue:** Mix of Material-UI, TailwindCSS, and inline styles
- **Location:** Various components
- **Impact:** Inconsistent look and feel
- **Recommendation:** Standardize on one approach (prefer Material-UI)

### 12.2 Navigation

#### **INCONSISTENCY-1: Route Management**
- **Location:** `frontend/src/App.js`
- **Issue:** Custom routing instead of React Router
- **Status:** Uses state-based page switching
- **Impact:** No URL-based navigation, browser back/forward doesn't work
- **Recommendation:** Migrate to React Router for proper SPA navigation

#### **INCONSISTENCY-2: Protected Routes**
- **Location:** `frontend/src/components/ProtectedRoute.js`
- **Status:** ✅ Exists and used
- **Note:** Good practice

### 12.3 Error Handling

#### **INCONSISTENCY-1: Error Display**
- **Issue:** Some errors shown via toast, others via modal, others inline
- **Recommendation:** Standardize error display method

#### **INCONSISTENCY-2: Loading States**
- **Issue:** Inconsistent loading indicators
- **Recommendation:** Create reusable loading component

### 12.4 Form Validation

#### **INCONSISTENCY-1: Validation Timing**
- **Issue:** Some forms validate on submit, others on blur, others on change
- **Recommendation:** Standardize validation approach

#### **INCONSISTENCY-2: Error Messages**
- **Issue:** Inconsistent error message formats
- **Recommendation:** Create standardized error message component

---

## 13. REFACTORING RECOMMENDATIONS

### 13.1 Immediate Actions (Critical)

1. **Remove Duplicate Code**
   - Fix `server.js` (remove lines 435-503)
   - Fix `User.js` (remove lines 249-268)
   - Fix `timeRoutes.js` (remove lines 18-32)
   - Refactor `realtimeServer.js` (split into modules)

2. **Fix Duplicate Exports**
   - Remove second `module.exports` in affected files

3. **Standardize Error Handling**
   - Create error handling middleware
   - Standardize error response format

### 13.2 High Priority Refactoring

1. **Split Large Files**
   - `realtimeServer.js` → Split into 4-5 modules
   - Large controllers → Extract helper functions

2. **Extract Constants**
   - Create `constants.js` files for magic numbers/strings
   - Move configuration to centralized config

3. **Improve Logging**
   - Replace console.log with proper logging library
   - Add structured logging

4. **Standardize API Responses**
   - Create response wrapper utility
   - Ensure all endpoints use consistent format

### 13.3 Medium Priority Refactoring

1. **Migrate to React Router**
   - Replace state-based routing with React Router
   - Enable proper URL navigation

2. **Standardize Styling**
   - Choose one styling approach (Material-UI recommended)
   - Remove TailwindCSS if not needed, or fully adopt it

3. **Improve Type Safety**
   - Consider TypeScript migration (long-term)
   - Add JSDoc comments for better IDE support

4. **Optimize Bundle Size**
   - Code splitting in frontend
   - Tree shaking optimization

### 13.4 Long-term Improvements

1. **Testing**
   - Add unit tests for utilities
   - Add integration tests for API endpoints
   - Add E2E tests for critical flows

2. **Documentation**
   - API documentation (Swagger/OpenAPI)
   - Component documentation (Storybook)
   - Architecture decision records

3. **Performance**
   - Database query optimization
   - Caching strategy
   - WebSocket connection pooling

4. **Security**
   - Security audit
   - Rate limiting improvements
   - Input validation hardening

---

## APPENDIX: QUICK REFERENCE

### Port Summary
- **Frontend:** 3001
- **Backend API:** 5001
- **Real-time Server:** 5004
- **AI Service:** 5002

### Key Environment Variables
- `MONGODB_URI`: Database connection
- `JWT_SECRET`: Token signing secret
- `SESSION_SECRET`: Session secret
- `FRONTEND_URL`: Frontend URL for CORS
- `ALLOWED_ORIGINS`: CORS origins
- `FIREBASE_SERVICE_ACCOUNT_PATH`: Firebase config
- `EMAIL_USER`, `EMAIL_PASS`: Email service
- `TWILIO_*`: SMS service (optional)

### API Base URLs
- **Main API:** `http://localhost:5001/api/v1`
- **Real-time:** `http://localhost:5004`
- **AI Service:** `http://localhost:5002`

### Key Models
- `User`: Authentication
- `Organization`: Multi-tenancy
- `Exam`: Exam definitions
- `ExamSession`: Active sessions
- `Question`: Questions
- `QuestionBank`: Question collections

---

**END OF DOCUMENT**


