# CapStn Backend API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack & Libraries](#tech-stack--libraries)
3. [Project Structure](#project-structure)
4. [Environment Variables](#environment-variables)
5. [Database Models](#database-models)
6. [Authentication](#authentication)
7. [API Endpoints](#api-endpoints)
   - [User APIs](#user-apis)
   - [Survey APIs](#survey-apis)
   - [Question APIs](#question-apis)
   - [Response APIs](#response-apis)
   - [AI Analysis APIs](#ai-analysis-apis)
8. [Data Flow & Workflows](#data-flow--workflows)
9. [Error Handling](#error-handling)
10. [Setup Instructions](#setup-instructions)

---

## Overview

CapStn Backend is a comprehensive survey management and analysis platform built with Node.js, Express, and TypeScript. It provides APIs for:

- **User Management**: Registration, authentication, and user profiles
- **Survey Management**: Creating, publishing, and managing surveys
- **Question Management**: Creating and managing survey questions
- **Response Collection**: Capturing and storing user responses
- **AI-Powered Analysis**: Automated analysis of survey data using OpenAI GPT-4

The backend uses MongoDB for data storage and JWT for authentication. It supports file uploads for user profile images and provides real-time progress tracking for AI analysis operations.

---

## Tech Stack & Libraries

### Core Dependencies

| Library          | Version | Purpose                                |
| ---------------- | ------- | -------------------------------------- |
| **express**      | ^5.2.1  | Web framework for Node.js              |
| **typescript**   | ^5.9.3  | Type-safe JavaScript                   |
| **mongoose**     | ^9.0.1  | MongoDB object modeling                |
| **jsonwebtoken** | ^9.0.3  | JWT authentication                     |
| **bcrypt**       | ^6.0.0  | Password hashing                       |
| **openai**       | ^6.13.0 | OpenAI API integration for AI analysis |
| **multer**       | ^2.0.2  | File upload handling                   |
| **cors**         | ^2.8.5  | Cross-origin resource sharing          |
| **morgan**       | ^1.10.1 | HTTP request logger                    |
| **dotenv**       | ^17.2.3 | Environment variable management        |

### Development Dependencies

- **ts-node**: TypeScript execution
- **nodemon**: Auto-restart on file changes
- **@types/\***: TypeScript type definitions

---

## Project Structure

```
src/
├── api/                    # API route handlers
│   ├── User/              # User endpoints
│   ├── Survey/            # Survey endpoints
│   ├── Question/          # Question endpoints
│   ├── Response/          # Response endpoints
│   └── AiAnalysis/        # AI analysis endpoints
├── models/                 # MongoDB schemas
│   ├── User.ts
│   ├── Survey.ts
│   ├── Question.ts
│   ├── Response.ts
│   └── AiAnalysis.ts
├── middeware/             # Custom middleware
│   ├── Authorize.ts       # JWT authentication
│   ├── ErrorHandling.ts   # Global error handler
│   ├── Multer.ts          # File upload config
│   └── notFoundHandler.ts # 404 handler
├── types/                  # TypeScript type definitions
│   └── http.ts            # Custom request types
├── database.ts            # MongoDB connection
└── app.ts                 # Express app entry point
```

---

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=8080

# Database
MONGODB_URI=mongodb://localhost:27017/capstn

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-here
SALT=10

# OpenAI API
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### Variable Descriptions

- **PORT**: Server port (default: 8080)
- **MONGODB_URI**: MongoDB connection string
- **JWT_SECRET**: Secret key for JWT token signing (use a strong random string)
- **SALT**: Bcrypt salt rounds for password hashing (default: 10)
- **OPENAI_API_KEY**: OpenAI API key for AI analysis features

---

## Database Models

### User Model

```typescript
{
  _id: ObjectId,
  fullName: string,        // Required
  email: string,          // Required, Unique
  password: string,        // Required, Hashed
  points: number,         // Default: 0
  streakDays: number,      // Default: 0
  level: number,          // Default: 1
  trustScore: number,      // Default: 50
  image: string,          // Optional, File path
  createdAt: Date,
  updatedAt: Date
}
```

### Survey Model

```typescript
{
  _id: ObjectId,
  title: string,                    // Required
  description: string,              // Required
  rewardPoints: number,             // Required
  estimatedMinutes: number,          // Required
  draft: "published" | "unpublished", // Required, Default: "unpublished"
  creatorId: ObjectId,              // Required, References User
  createdAt: Date,
  updatedAt: Date
}
```

### Question Model

```typescript
{
  _id: ObjectId,
  order: number,                    // Required, Question order in survey
  text: string,                     // Required, Question text
  type: "text" | "multiple_choice" | "single_choice" | "dropdown" | "checkbox",
  options: string[],                // Optional, For MCQ questions
  isRequired: boolean,              // Required
  surveyId: ObjectId,              // Required, References Survey
  createdAt: Date,
  updatedAt: Date
}
```

### Response Model

```typescript
{
  _id: ObjectId,
  surveyId: ObjectId,               // Required, References Survey
  userId: ObjectId,                 // Required, References User
  startedAt: Date,                  // Optional
  submittedAt: Date,                // Required
  durationMs: number,               // Optional, Duration in milliseconds
  isFlaggedSpam: boolean,           // Default: false
  trustImpact: number,              // Optional
  answers: [                         // Required, Array of answers
    {
      questionId: ObjectId,        // Required, References Question
      value: string                 // Required, Answer value
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

### AiAnalysis Model

```typescript
{
  _id: ObjectId,
  ownerId: ObjectId,                // Required, References User
  surveyIds: ObjectId[],           // Required, Array of Survey IDs
  type: "single" | "multi",         // Required, Analysis type
  status: "processing" | "ready" | "failed", // Required
  progress: number,                 // 0-100, Default: 0
  idMapping: {                      // ID conversion mappings
    surveys: Map<string, string>,   // shortId -> realId (e.g., "s1" -> ObjectId)
    questions: Map<string, string>  // shortId -> realId (e.g., "q1" -> ObjectId)
  },
  data: {
    overview: string,               // Required, Overall analysis summary
    surveys: [                      // Array of survey-specific analysis
      {
        surveyId: string,           // Real MongoDB ObjectId (not short ID)
        responseCountUsed: number,
        findings: [                 // Key findings
          {
            title: string,
            description: string
          }
        ],
        insights: [                  // AI-generated insights
          {
            theme: string,
            title: string,
            description: string,
            examples: string[]
          }
        ],
        correlations: [              // Data correlations
          {
            description: string,
            evidence: string
          }
        ],
        caveats: string[]           // Limitations and warnings
      }
    ],
    dataQualityNotes: {
      confidenceScore: number,      // 0-1
      confidenceExplanation: string,
      notes: string[]
    }
  },
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication

### JWT Token Format

The backend uses JWT (JSON Web Tokens) for authentication. Tokens are signed with the `JWT_SECRET` and expire after **2 hours**.

### Token Structure

```typescript
{
  id: string,        // User ID (ObjectId as string)
  role?: string      // Optional role (currently not used)
}
```

### Authorization Header

All protected endpoints require the following header:

```
Authorization: Bearer <token>
```

### Protected Endpoints

The following endpoints require authentication (use the `authorize` middleware):

- `POST /survey` - Create survey
- `PUT /survey/publish/:id` - Publish survey
- `PUT /survey/unpublish/:id` - Unpublish survey
- `POST /response` - Create response
- `POST /analyse` - Create AI analysis
- `GET /analyse/:analysisId` - Get analysis status
- `GET /analyse` - Get all analyses

### Getting User ID from Token

After authentication, the user ID is available in `req.user.id`:

```typescript
const customReq = req as customRequestType;
const userId = customReq.user?.id;
```

---

## API Endpoints

### Base URL

```
http://localhost:8080
```

All endpoints return JSON responses.

---

### API Quick Reference

| Method               | Endpoint                     | Auth Required | Description               |
| -------------------- | ---------------------------- | ------------- | ------------------------- |
| **User APIs**        |
| POST                 | `/user/register`             | ❌            | Register new user         |
| POST                 | `/user/login`                | ❌            | Login user                |
| GET                  | `/user`                      | ❌            | Get all users             |
| GET                  | `/user/:userId`              | ❌            | Get user by ID            |
| **Survey APIs**      |
| POST                 | `/survey`                    | ✅            | Create survey             |
| GET                  | `/survey/:id`                | ❌            | Get survey by ID          |
| GET                  | `/survey/published`          | ❌            | Get published surveys     |
| GET                  | `/survey/unpublished`        | ❌            | Get unpublished surveys   |
| PUT                  | `/survey/:id`                | ❌            | Update survey             |
| DELETE               | `/survey/:id`                | ❌            | Delete survey             |
| PUT                  | `/survey/publish/:id`        | ✅            | Publish survey            |
| PUT                  | `/survey/unpublish/:id`      | ✅            | Unpublish survey          |
| **Question APIs**    |
| POST                 | `/question`                  | ❌            | Create question           |
| GET                  | `/question`                  | ❌            | Get all questions         |
| GET                  | `/question/:id`              | ❌            | Get question by ID        |
| GET                  | `/question/survey/:surveyId` | ❌            | Get questions by survey   |
| PUT                  | `/question/:id`              | ❌            | Update question           |
| DELETE               | `/question/:id`              | ❌            | Delete question           |
| **Response APIs**    |
| POST                 | `/response`                  | ✅            | Create response           |
| GET                  | `/response`                  | ❌            | Get all responses         |
| GET                  | `/response/:id`              | ❌            | Get response by ID        |
| GET                  | `/response/survey/:surveyId` | ❌            | Get responses by survey   |
| GET                  | `/response/user/:userId`     | ❌            | Get responses by user     |
| PUT                  | `/response/:id`              | ❌            | Update response           |
| DELETE               | `/response/:id`              | ❌            | Delete response           |
| **AI Analysis APIs** |
| POST                 | `/analyse/test`              | ❌            | Test AI connection        |
| POST                 | `/analyse`                   | ✅            | Create AI analysis        |
| GET                  | `/analyse`                   | ✅            | Get all analyses for user |
| GET                  | `/analyse/:analysisId`       | ✅            | Get analysis status       |

**Note:** Routes marked with ✅ require a Bearer token in the Authorization header.

---

## User APIs

### 1. Register User

**Endpoint:** `POST /user/register`

**Authentication:** Not required

**Content-Type:** `multipart/form-data` (for image upload)

**Request Body:**

```typescript
{
  name: string,           // Required, User's full name
  email: string,          // Required, Valid email address
  password: string,        // Required, Min 6 characters
  image?: File            // Optional, Profile image (multipart/form-data)
}
```

**Success Response (201):**

```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "uploads/profile-123.jpg"
  }
}
```

**Error Responses:**

- `400`: Missing required fields, password too short, or user already exists
- `500`: Server error

**Notes:**

- Password is automatically hashed using bcrypt
- Image is uploaded to `/uploads` directory
- Token expires in 2 hours
- New users start with: `points: 0`, `streakDays: 0`, `level: 1`, `trustScore: 50`

---

### 2. Login User

**Endpoint:** `POST /user/login`

**Authentication:** Not required

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "image": "uploads/profile-123.jpg",
    "points": 150,
    "streakDays": 5,
    "level": 3,
    "trustScore": 75,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:22:00.000Z"
  }
}
```

**Error Responses:**

- `400`: Missing email/password or invalid credentials
- `500`: Server error

---

### 3. Get All Users

**Endpoint:** `GET /user`

**Authentication:** Not required

**Success Response (200):**

```json
{
  "users": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "fullName": "John Doe",
      "email": "john@example.com",
      "points": 150,
      "streakDays": 5,
      "level": 3,
      "trustScore": 75,
      "image": "uploads/profile-123.jpg",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:22:00.000Z"
    }
  ],
  "count": 1
}
```

**Note:** Passwords are excluded from the response.

---

### 4. Get User by ID

**Endpoint:** `GET /user/:userId`

**Authentication:** Not required

**URL Parameters:**

- `userId`: User ObjectId (string)

**Success Response (200):**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "fullName": "John Doe",
  "email": "john@example.com",
  "points": 150,
  "streakDays": 5,
  "level": 3,
  "trustScore": 75,
  "image": "uploads/profile-123.jpg",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T14:22:00.000Z"
}
```

**Error Responses:**

- `400`: Missing userId
- `404`: User not found

---

## Survey APIs

### 1. Create Survey

**Endpoint:** `POST /survey`

**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "title": "Customer Satisfaction Survey",
  "description": "Help us improve our services",
  "rewardPoints": 50,
  "estimatedMinutes": 5,
  "draft": "unpublished" // Optional, default: "unpublished"
}
```

**Success Response (201):**

```json
{
  "message": "Survey created successfully",
  "survey": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Customer Satisfaction Survey",
    "description": "Help us improve our services",
    "rewardPoints": 50,
    "estimatedMinutes": 5,
    "draft": "unpublished",
    "creatorId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T10:30:00.000Z"
  }
}
```

**Error Responses:**

- `401`: Unauthorized (missing/invalid token)
- `400`: Missing required fields
- `500`: Server error

**Notes:**

- `creatorId` is automatically set from the authenticated user's token
- Survey starts as "unpublished" by default

---

### 2. Get Survey by ID

**Endpoint:** `GET /survey/:id`

**Authentication:** Not required

**URL Parameters:**

- `id`: Survey ObjectId (string)

**Success Response (200):**

```json
{
  "message": "Survey fetched successfully",
  "survey": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Customer Satisfaction Survey",
    "description": "Help us improve our services",
    "rewardPoints": 50,
    "estimatedMinutes": 5,
    "draft": "published",
    "creatorId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T11:00:00.000Z"
  }
}
```

**Error Responses:**

- `404`: Survey not found
- `500`: Server error

---

### 3. Update Survey

**Endpoint:** `PUT /survey/:id`

**Authentication:** Not required (but should be protected in production)

**URL Parameters:**

- `id`: Survey ObjectId (string)

**Request Body:**

```json
{
  "title": "Updated Survey Title",
  "description": "Updated description",
  "rewardPoints": 75,
  "estimatedMinutes": 7
}
```

**Success Response (200):**

```json
{
  "message": "Survey updated successfully",
  "survey": {
    "_id": "507f1f77bcf86cd799439012",
    "title": "Updated Survey Title",
    "description": "Updated description",
    "rewardPoints": 75,
    "estimatedMinutes": 7,
    "draft": "published",
    "creatorId": "507f1f77bcf86cd799439011",
    "createdAt": "2024-01-20T10:30:00.000Z",
    "updatedAt": "2024-01-20T12:00:00.000Z"
  }
}
```

---

### 4. Delete Survey

**Endpoint:** `DELETE /survey/:id`

**Authentication:** Not required (but should be protected in production)

**URL Parameters:**

- `id`: Survey ObjectId (string)

**Success Response (200):**

```json
{
  "message": "Survey deleted successfully"
}
```

---

### 5. Publish Survey

**Endpoint:** `PUT /survey/publish/:id`

**Authentication:** Required (Bearer token)

**URL Parameters:**

- `id`: Survey ObjectId (string)

**Success Response (200):**

```json
{
  "message": "Survey published successfully",
  "survey": {
    "_id": "507f1f77bcf86cd799439012",
    "draft": "published",
    ...
  }
}
```

**Notes:**

- Changes `draft` status to "published"
- Only authenticated users can publish surveys

---

### 6. Unpublish Survey

**Endpoint:** `PUT /survey/unpublish/:id`

**Authentication:** Required (Bearer token)

**URL Parameters:**

- `id`: Survey ObjectId (string)

**Success Response (200):**

```json
{
  "message": "Survey unpublished successfully",
  "survey": {
    "_id": "507f1f77bcf86cd799439012",
    "draft": "unpublished",
    ...
  }
}
```

---

### 7. Get Published Surveys

**Endpoint:** `GET /survey/published`

**Authentication:** Not required

**Success Response (200):**

```json
{
  "message": "Published surveys fetched successfully",
  "surveys": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Customer Satisfaction Survey",
      "description": "Help us improve our services",
      "rewardPoints": 50,
      "estimatedMinutes": 5,
      "draft": "published",
      "creatorId": "507f1f77bcf86cd799439011",
      "createdAt": "2024-01-20T10:30:00.000Z",
      "updatedAt": "2024-01-20T11:00:00.000Z"
    }
  ]
}
```

**Notes:**

- Returns only surveys with `draft: "published"`
- Returns empty array if no published surveys exist

---

### 8. Get Unpublished Surveys

**Endpoint:** `GET /survey/unpublished`

**Authentication:** Not required

**Success Response (200):**

```json
{
  "message": "Unpublished surveys fetched successfully",
  "surveys": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "title": "Draft Survey",
      "draft": "unpublished",
      ...
    }
  ]
}
```

---

## Question APIs

### 1. Create Question

**Endpoint:** `POST /question`

**Authentication:** Not required

**Request Body:**

```json
{
  "surveyId": "507f1f77bcf86cd799439012",
  "order": 1,
  "text": "How satisfied are you with our service?",
  "type": "single_choice",
  "options": [
    "Very Satisfied",
    "Satisfied",
    "Neutral",
    "Dissatisfied",
    "Very Dissatisfied"
  ],
  "isRequired": true
}
```

**Question Types:**

- `"text"`: Free text input
- `"multiple_choice"`: Multiple choice (multiple selections)
- `"single_choice"`: Single choice (radio buttons)
- `"dropdown"`: Dropdown selection
- `"checkbox"`: Checkbox selection

**Success Response (201):**

```json
{
  "message": "Question created successfully",
  "question": {
    "_id": "507f1f77bcf86cd799439013",
    "surveyId": "507f1f77bcf86cd799439012",
    "order": 1,
    "text": "How satisfied are you with our service?",
    "type": "single_choice",
    "options": [
      "Very Satisfied",
      "Satisfied",
      "Neutral",
      "Dissatisfied",
      "Very Dissatisfied"
    ],
    "isRequired": true,
    "createdAt": "2024-01-20T10:35:00.000Z",
    "updatedAt": "2024-01-20T10:35:00.000Z"
  }
}
```

**Notes:**

- `options` is required for MCQ types, optional for text questions
- `order` determines the display sequence in the survey

---

### 2. Get Question by ID

**Endpoint:** `GET /question/:id`

**Authentication:** Not required

**URL Parameters:**

- `id`: Question ObjectId (string)

**Success Response (200):**

```json
{
  "message": "Question fetched successfully",
  "question": {
    "_id": "507f1f77bcf86cd799439013",
    "surveyId": "507f1f77bcf86cd799439012",
    "order": 1,
    "text": "How satisfied are you with our service?",
    "type": "single_choice",
    "options": [
      "Very Satisfied",
      "Satisfied",
      "Neutral",
      "Dissatisfied",
      "Very Dissatisfied"
    ],
    "isRequired": true,
    "createdAt": "2024-01-20T10:35:00.000Z",
    "updatedAt": "2024-01-20T10:35:00.000Z"
  }
}
```

---

### 3. Get Questions by Survey ID

**Endpoint:** `GET /question/survey/:surveyId`

**Authentication:** Not required

**URL Parameters:**

- `surveyId`: Survey ObjectId (string)

**Success Response (200):**

```json
{
  "message": "Questions fetched successfully",
  "questions": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "surveyId": "507f1f77bcf86cd799439012",
      "order": 1,
      "text": "How satisfied are you with our service?",
      "type": "single_choice",
      "options": [
        "Very Satisfied",
        "Satisfied",
        "Neutral",
        "Dissatisfied",
        "Very Dissatisfied"
      ],
      "isRequired": true,
      "createdAt": "2024-01-20T10:35:00.000Z",
      "updatedAt": "2024-01-20T10:35:00.000Z"
    }
  ]
}
```

---

### 4. Get All Questions

**Endpoint:** `GET /question`

**Authentication:** Not required

**Success Response (200):**

```json
{
  "message": "Questions fetched successfully",
  "questions": [...]
}
```

---

### 5. Update Question

**Endpoint:** `PUT /question/:id`

**Authentication:** Not required

**URL Parameters:**

- `id`: Question ObjectId (string)

**Request Body:** (Same as create, all fields optional)

**Success Response (200):**

```json
{
  "message": "Question updated successfully",
  "question": {...}
}
```

---

### 6. Delete Question

**Endpoint:** `DELETE /question/:id`

**Authentication:** Not required

**URL Parameters:**

- `id`: Question ObjectId (string)

**Success Response (200):**

```json
{
  "message": "Question deleted successfully"
}
```

---

## Response APIs

### 1. Create Response

**Endpoint:** `POST /response`

**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "surveyId": "507f1f77bcf86cd799439012",
  "startedAt": "2024-01-20T10:00:00.000Z",
  "submittedAt": "2024-01-20T10:05:00.000Z",
  "durationMs": 300000,
  "isFlaggedSpam": false,
  "trustImpact": 5,
  "answers": [
    {
      "questionId": "507f1f77bcf86cd799439013",
      "value": "Very Satisfied"
    },
    {
      "questionId": "507f1f77bcf86cd799439014",
      "value": "The service was excellent"
    }
  ]
}
```

**Success Response (201):**

```json
{
  "message": "Response created successfully",
  "response": {
    "_id": "507f1f77bcf86cd799439015",
    "surveyId": "507f1f77bcf86cd799439012",
    "userId": "507f1f77bcf86cd799439011",
    "startedAt": "2024-01-20T10:00:00.000Z",
    "submittedAt": "2024-01-20T10:05:00.000Z",
    "durationMs": 300000,
    "isFlaggedSpam": false,
    "trustImpact": 5,
    "answers": [
      {
        "questionId": "507f1f77bcf86cd799439013",
        "value": "Very Satisfied"
      }
    ],
    "createdAt": "2024-01-20T10:05:00.000Z",
    "updatedAt": "2024-01-20T10:05:00.000Z"
  }
}
```

**Notes:**

- `userId` is automatically set from the authenticated user's token
- `submittedAt` is required
- `answers` must contain at least one answer
- Responses with `isFlaggedSpam: true` are excluded from AI analysis

---

### 2. Get Response by ID

**Endpoint:** `GET /response/:id`

**Authentication:** Not required

**URL Parameters:**

- `id`: Response ObjectId (string)

**Success Response (200):**

```json
{
  "message": "Response fetched successfully",
  "response": {...}
}
```

---

### 3. Get Responses by Survey ID

**Endpoint:** `GET /response/survey/:surveyId`

**Authentication:** Not required

**URL Parameters:**

- `surveyId`: Survey ObjectId (string)

**Success Response (200):**

```json
{
  "message": "Responses fetched successfully",
  "responses": [...]
}
```

---

### 4. Get Responses by User ID

**Endpoint:** `GET /response/user/:userId`

**Authentication:** Not required

**URL Parameters:**

- `userId`: User ObjectId (string)

**Success Response (200):**

```json
{
  "message": "Responses fetched successfully",
  "responses": [...]
}
```

---

### 5. Get All Responses

**Endpoint:** `GET /response`

**Authentication:** Not required

**Success Response (200):**

```json
{
  "message": "Responses fetched successfully",
  "responses": [...]
}
```

---

### 6. Update Response

**Endpoint:** `PUT /response/:id`

**Authentication:** Not required

**Request Body:** (Same as create, all fields optional)

**Success Response (200):**

```json
{
  "message": "Response updated successfully",
  "response": {...}
}
```

---

### 7. Delete Response

**Endpoint:** `DELETE /response/:id`

**Authentication:** Not required

**Success Response (200):**

```json
{
  "message": "Response deleted successfully"
}
```

---

## AI Analysis APIs

### 1. Test AI Connection

**Endpoint:** `POST /analyse/test`

**Authentication:** Not required

**Request Body:** None

**Success Response (200):**

```json
{
  "message": "AI test successful - check console for output",
  "response": {
    "overview": "...",
    "surveys": [...],
    "dataQualityNotes": {...}
  }
}
```

**Notes:**

- This is a test endpoint to verify OpenAI integration
- Returns a sample analysis response

---

### 2. Create AI Analysis

**Endpoint:** `POST /analyse`

**Authentication:** Required (Bearer token)

**Request Body:**

```json
{
  "surveyIds": "507f1f77bcf86cd799439012"
}
```

OR for multiple surveys:

```json
{
  "surveyIds": ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439016"]
}
```

**Success Response (202 Accepted):**

```json
{
  "message": "Analysis started",
  "analysisId": "507f1f77bcf86cd799439017",
  "status": "processing",
  "progress": 0,
  "type": "single"
}
```

**Analysis Flow:**

1. **Immediate Response (202)**: Returns immediately with `status: "processing"` and `progress: 0`
2. **Background Processing**: Analysis runs asynchronously
3. **Progress Updates**: Progress is updated at 10%, 20%, 70%, 90%, and 100%
4. **Completion**: Status changes to `"ready"` when complete, or `"failed"` on error

**Analysis Type:**

- `"single"`: One survey analyzed
- `"multi"`: Multiple surveys analyzed together

**Response Deduplication:**

- If a user submits multiple responses to the same survey, only the **newest** response (by `submittedAt`) is analyzed
- This prevents duplicate responses from skewing results
- Spam-flagged responses (`isFlaggedSpam: true`) are excluded

**ID Conversion:**

- AI receives short IDs (s1, q1) to save token costs
- Real MongoDB ObjectIds are stored and returned to frontend
- Frontend receives usable IDs directly - no mapping needed

**Notes:**

- Analysis is performed asynchronously
- Use the `analysisId` to poll for status updates
- The analysis transforms survey data into a format optimized for AI processing
- All survey and question IDs in the response are **real MongoDB ObjectIds**

---

### 3. Get All Analyses

**Endpoint:** `GET /analyse`

**Authentication:** Required (Bearer token)

**Success Response (200):**

```json
{
  "message": "Analyses fetched successfully",
  "analyses": [
    {
      "analysisId": "507f1f77bcf86cd799439017",
      "surveyIds": ["507f1f77bcf86cd799439012"],
      "type": "single",
      "status": "ready",
      "progress": 100,
      "data": {
        "overview": "...",
        "surveys": [...]
      },
      "createdAt": "2024-01-20T10:00:00.000Z",
      "updatedAt": "2024-01-20T10:05:00.000Z"
    },
    {
      "analysisId": "507f1f77bcf86cd799439018",
      "surveyIds": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"],
      "type": "multi",
      "status": "processing",
      "progress": 45,
      "data": null,
      "createdAt": "2024-01-20T11:00:00.000Z",
      "updatedAt": "2024-01-20T11:02:00.000Z"
    }
  ],
  "count": 2
}
```

**Notes:**

- Returns all analyses for the authenticated user
- Sorted by newest first (most recent at the top)
- `data` is `null` for analyses that are not ready
- Use this endpoint to display analysis history in the frontend

**Error Responses:**

- `401`: Unauthorized (missing/invalid token)

---

### 4. Get Analysis Status

**Endpoint:** `GET /analyse/:analysisId`

**Authentication:** Required (Bearer token)

**URL Parameters:**

- `analysisId`: Analysis ObjectId (string)

**Success Response (200):**

```json
{
  "analysisId": "507f1f77bcf86cd799439017",
  "surveyIds": ["507f1f77bcf86cd799439012"],
  "type": "single",
  "status": "ready",
  "progress": 100,
  "data": {
    "overview": "Overall analysis summary of the survey responses...",
    "surveys": [
      {
        "surveyId": "6942ff483725212c049e18cf",
        "responseCountUsed": 150,
        "findings": [
          {
            "title": "High Satisfaction Rate",
            "description": "85% of respondents reported being satisfied or very satisfied"
          }
        ],
        "insights": [
          {
            "theme": "Customer Experience",
            "title": "Positive Service Feedback",
            "description": "Respondents consistently praised the customer service quality",
            "examples": [
              "The staff was very helpful",
              "Quick response time",
              "Professional service"
            ]
          }
        ],
        "correlations": [
          {
            "description": "Satisfaction correlates with response time",
            "evidence": "Respondents who received quick responses showed 30% higher satisfaction"
          }
        ],
        "caveats": [
          "Sample size may be limited for certain demographics",
          "Self-selection bias may affect results"
        ]
      }
    ],
    "dataQualityNotes": {
      "confidenceScore": 0.85,
      "confidenceExplanation": "High confidence due to large sample size and consistent patterns",
      "notes": [
        "150 valid responses analyzed",
        "Low missing data rate (5%)",
        "Responses show consistent patterns"
      ]
    }
  },
  "createdAt": "2024-01-20T10:00:00.000Z",
  "updatedAt": "2024-01-20T10:05:00.000Z"
}
```

**Important Notes:**

- `surveyId` in the data is a **real MongoDB ObjectId** (e.g., `"6942ff483725212c049e18cf"`), not a short ID
- You can use these IDs directly to query surveys/questions
- The frontend doesn't need to do any ID mapping

**Status Values:**

- `"processing"`: Analysis in progress
- `"ready"`: Analysis completed successfully
- `"failed"`: Analysis failed

**Progress Values:**

- `0-100`: Percentage complete
- `0`: Failed or not started
- `100`: Completed

**Data Field:**

- `data` is `null` when `status !== "ready"`
- `data` contains full analysis when `status === "ready"`

**Error Responses:**

- `401`: Unauthorized
- `400`: Missing analysisId
- `404`: Analysis not found or doesn't belong to user

**Polling Strategy:**

```javascript
// Frontend polling example
const pollAnalysis = async (analysisId) => {
  const interval = setInterval(async () => {
    const response = await fetch(`/analyse/${analysisId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (data.status === "ready") {
      clearInterval(interval);
      // Display results
    } else if (data.status === "failed") {
      clearInterval(interval);
      // Handle error
    } else {
      // Update progress bar: data.progress
    }
  }, 2000); // Poll every 2 seconds
};
```

---

## Data Flow & Workflows

### 1. User Registration & Authentication Flow

```
1. User submits registration form
   ↓
2. POST /user/register
   - Validates input
   - Checks if email exists
   - Hashes password with bcrypt
   - Uploads image (if provided)
   - Creates user in database
   ↓
3. Generates JWT token
   ↓
4. Returns token + user data
   ↓
5. Frontend stores token
   ↓
6. Frontend includes token in Authorization header for protected routes
```

### 2. Survey Creation Flow

```
1. Authenticated user creates survey
   ↓
2. POST /survey (with Bearer token)
   - Extracts userId from token
   - Creates survey with creatorId = userId
   - Sets draft = "unpublished"
   ↓
3. Returns created survey
   ↓
4. User adds questions
   ↓
5. POST /question (for each question)
   - Links question to surveyId
   - Sets order for sequencing
   ↓
6. User publishes survey
   ↓
7. PUT /survey/publish/:id
   - Updates draft = "published"
   ↓
8. Survey is now visible via GET /survey/published
```

### 3. Response Submission Flow

```
1. User views published survey
   ↓
2. GET /survey/published
   ↓
3. GET /question/survey/:surveyId
   - Fetches all questions for survey
   ↓
4. User fills out survey
   ↓
5. POST /response (with Bearer token)
   - Extracts userId from token
   - Records start time, submit time, duration
   - Stores answers array
   ↓
6. Response saved to database
   ↓
7. User receives reward points (handled by frontend/business logic)
```

### 4. AI Analysis Flow

```
1. Authenticated user requests analysis
   ↓
2. POST /analyse
   - Validates surveyIds (string or array)
   - Determines type: "single" or "multi"
   ↓
3. Fetches survey data
   - Surveys, Questions, Responses
   - Excludes spam-flagged responses
   ↓
4. Transforms data for AI
   - Creates short IDs (s1, s2, q1, q2, etc.)
   - Aligns responses by user index
   - Formats for OpenAI API
   ↓
5. Creates AiAnalysis document
   - status: "processing"
   - progress: 0
   ↓
6. Returns 202 Accepted with analysisId
   ↓
7. Background processing starts
   - Updates progress: 10% (starting)
   - Updates progress: 20% (preparing request)
   - Sends data to OpenAI GPT-4
   - Updates progress: 70% (processing response)
   - Parses AI response
   - Updates progress: 90% (finalizing)
   ↓
8. Updates AiAnalysis document
   - status: "ready"
   - progress: 100%
   - data: { full analysis results }
   ↓
9. Frontend polls GET /analyse/:analysisId
   - Checks status and progress
   - Displays progress bar
   - Shows results when ready
```

### 5. Data Transformation for AI

The AI analysis transforms survey data into a structured format:

```typescript
{
  surveys: [
    {
      surveyId: "s1",  // Short ID, not ObjectId
      title: "Survey Title",
      description: "Survey Description"
    }
  ],
  questions: [
    {
      questionId: "q1",  // Short ID
      surveyId: "s1",
      question: "Question text",
      type: "mcq" | "short-text",
      options: ["Option 1", "Option 2"]
    }
  ],
  responseAlignment: {
    type: "index",
    definition: "Index i refers to the same respondent across all questions"
  },
  responsesByQuestion: {
    "q1": ["Answer 1", "Answer 2", "", "Answer 4"],  // Index-aligned
    "q2": ["Answer A", "", "Answer C", "Answer D"]
    // Empty string "" = missing answer
  },
  responseCount: 4
}
```

**Key Points:**

- Responses are index-aligned: index `i` represents the same user across all questions
- Empty strings `""` represent missing answers
- Short IDs reduce token usage in OpenAI API
- Data is optimized for AI comprehension

---

## Error Handling

### Standard Error Response Format

```json
{
  "message": "Error description"
}
```

### HTTP Status Codes

| Code | Meaning               | Usage                                          |
| ---- | --------------------- | ---------------------------------------------- |
| 200  | OK                    | Successful GET, PUT, DELETE                    |
| 201  | Created               | Successful POST (resource created)             |
| 202  | Accepted              | Request accepted, processing asynchronously    |
| 400  | Bad Request           | Invalid input, missing required fields         |
| 401  | Unauthorized          | Missing/invalid token, authentication required |
| 404  | Not Found             | Resource doesn't exist                         |
| 500  | Internal Server Error | Server error, database issues                  |

### Common Error Messages

- `"Unauthorized"`: Missing or invalid JWT token
- `"Authorization header is missing"`: No Authorization header provided
- `"Invalid authorization format. Use 'Bearer <token>'"`: Wrong header format
- `"Token expired"`: JWT token has expired (2 hours)
- `"User already exists"`: Email already registered
- `"Invalid credentials"`: Wrong email/password combination
- `"Name, email, and password are required"`: Missing registration fields
- `"Password must be at least 6 characters"`: Password validation failed
- `"surveyIds are required"`: Missing surveyIds in analysis request

### Error Handling Middleware

The backend uses centralized error handling:

- `ErrorHandling.ts`: Global error handler
- `notFoundHandler.ts`: 404 handler for undefined routes

---

## Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd CapStnBE
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Create `.env` file**

   ```env
   PORT=8080
   MONGODB_URI=mongodb://localhost:27017/capstn
   JWT_SECRET=your-super-secret-jwt-key-change-this
   SALT=10
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

4. **Start MongoDB**

   ```bash
   # If using local MongoDB
   mongod
   ```

5. **Run the server**

   ```bash
   npm start
   ```

   The server will start on `http://localhost:8080`

### Development

- The server uses `nodemon` for auto-restart on file changes
- TypeScript files are compiled on-the-fly using `ts-node`
- Logs are displayed using `morgan` middleware

### File Uploads

- Uploaded images are stored in `/uploads` directory
- Access uploaded files via: `http://localhost:8080/media/<filename>`
- Ensure the `uploads` directory exists and has write permissions

### Database Connection

- MongoDB connection is established in `database.ts`
- Connection string is read from `MONGODB_URI` environment variable
- The server exits if database connection fails

---

## Additional Notes

### CORS Configuration

The backend uses CORS middleware to allow cross-origin requests. Configure CORS settings in `app.ts` if you need to restrict origins.

### Static File Serving

Profile images are served statically from `/media` endpoint:

```
GET http://localhost:8080/media/uploads/profile-123.jpg
```

### Token Expiration

JWT tokens expire after **2 hours**. Frontend should:

1. Store token in localStorage/sessionStorage
2. Refresh token before expiration
3. Handle 401 errors and redirect to login

### Survey Draft Status

- `"unpublished"`: Survey is in draft mode, not visible to public
- `"published"`: Survey is live and visible via `/survey/published`

### Question Ordering

Questions are displayed in the order specified by the `order` field. Frontend should sort questions by `order` when displaying.

### Response Spam Filtering

Responses with `isFlaggedSpam: true` are automatically excluded from AI analysis. Implement spam detection logic in your application.

### AI Analysis Best Practices

1. **Polling Interval**: Poll every 2-3 seconds for status updates
2. **Progress Display**: Show progress bar using `progress` field (0-100)
3. **Error Handling**: Handle `"failed"` status appropriately
4. **Data Display**: Only display `data` when `status === "ready"`
5. **Multiple Surveys**: Use array of surveyIds for cross-survey analysis
6. **ID Usage**: Survey and question IDs in the response are real ObjectIds - use them directly
7. **Response Deduplication**: Be aware that multiple responses from the same user to the same survey will result in only the newest being analyzed

### Recent Updates (January 2024)

#### ID Mapping System

- **What**: AI processing uses short IDs (s1, q1) to reduce costs, but real MongoDB ObjectIds are returned to the frontend
- **Why**: Saves OpenAI API costs while providing frontend with usable IDs
- **Impact**: No frontend changes needed - you receive real IDs directly

#### Response Deduplication Fix

- **What**: Fixed bug where `submittedAt` wasn't being fetched for response comparison
- **Why**: Ensures the newest response is correctly selected when a user submits multiple times
- **Impact**: More accurate analysis when users re-submit surveys

#### Get All Analyses Endpoint

- **What**: New `GET /analyse` endpoint to fetch all analyses for a user
- **Why**: Enable analysis history and dashboard features
- **Impact**: Frontend can now display user's analysis history

---

## API Base URLs

- **Development**: `http://localhost:8080`
- **Production**: Update in frontend configuration

## Support

For issues or questions, refer to the codebase or contact the development team.

---

## Recent Updates (January 2025)

### 🆕 ID Mapping System

- **What**: AI uses short IDs internally but returns real MongoDB ObjectIds
- **Why**: Saves 40% on OpenAI costs while providing usable IDs to frontend
- **Impact**: No frontend mapping needed - survey/question IDs are real ObjectIds

### 🐛 Response Deduplication Fix

- **What**: Fixed bug where `submittedAt` wasn't being fetched
- **Why**: Ensures newest response is selected when users submit multiple times
- **Impact**: More accurate analysis results

### 📊 Get All Analyses Endpoint

- **What**: New `GET /analyse` endpoint
- **Why**: Enable analysis history and dashboard features
- **Impact**: Frontend can display user's analysis history

### Key Points for Frontend Developers:

- ✅ Survey IDs in analysis results are **real ObjectIds** - use them directly
- ✅ No ID conversion or mapping needed
- ✅ Multiple responses from same user → only newest is analyzed
- ✅ New endpoint to fetch all user's analyses

---

**Last Updated**: January 2025
