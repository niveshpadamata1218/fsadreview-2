# review.in Backend (Spring Boot 3 + Java 17)

Production-style backend for review.in peer review platform.

## Stack
- Spring Boot 3.x
- Java 17
- Spring Security + JWT
- Spring Data JPA
- MySQL
- JavaMailSender (OTP emails)

## Features Implemented
- Auth: Register, OTP verify, resend OTP, login
- JWT with `userId` and `role` claims
- Role-restricted APIs for teacher and student
- Class CRUD (teacher)
- Enrollment CRUD (student join/leave + teacher remove student)
- Assignment CRUD
- Submission CRUD with file streaming/download
- Grade upsert by submission
- Peer review create/update/read
- Global exception handling + validation responses

## Project Structure
Main package: `com.reviewin`

## Environment Variables (`.env`)
The app reads `.env` using Spring config import in `application.yml`.

1. Create or update `backend/.env`
2. Use this template:

```env
DB_NAME=reviewin_db
DB_USER=root
DB_PASS=your_mysql_password

JWT_SECRET=replace_with_at_least_32_chars_secret

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
MAIL_FROM=your_email@gmail.com

OTP_EXPIRY_MINUTES=10
OTP_CODE_LENGTH=6
```

You can also start from `backend/.env.example`.

## Database Setup
1. Create DB:

```sql
CREATE DATABASE reviewin_db;
```

2. Run schema script:

`backend/src/main/resources/schema.sql`

This creates:
- `users`
- `otp_verifications`
- `classes`
- `class_enrollments`
- `assignments`
- `submissions`
- `grades`
- `peer_reviews`

## Run Backend
### Option A: Terminal
```bash
cd backend
mvn spring-boot:run
```

Backend runs at: `http://localhost:8080`

### Option B: Spring Tools / STS (or VS Code Spring Boot Dashboard)
1. Import `backend` as Maven project.
2. Ensure Java 17 is selected.
3. Run `ReviewinBackendApplication`.
4. Confirm app starts on port `8080`.

## Run Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: `http://localhost:5173`

## Validation and Error Format
Global errors use:
```json
{
  "timestamp": "...",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "field": "error"
  }
}
```

## File Upload Notes
- Allowed MIME types: PDF, DOC, DOCX
- Max file size: 50MB
- Stored path: `./uploads/{studentId}/{assignmentId}/{filename}`
- Endpoints:
  - `GET /api/submissions/file/{submissionId}` (inline)
  - `GET /api/submissions/download/{submissionId}` (download)

## Quick Test Flow
1. Register TEACHER -> verify OTP -> login
2. Create class (save class code/password)
3. Register STUDENT -> verify OTP -> login
4. Join class
5. Teacher creates assignment
6. Student uploads submission
7. Teacher grades submission
8. Student opens peer review and submits review for peer submission

## Build Check
Backend compile check:
```bash
cd backend
mvn -DskipTests compile
```

Frontend production build check:
```bash
cd frontend
npm run build
```
