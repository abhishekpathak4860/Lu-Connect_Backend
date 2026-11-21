# LU Connect – Backend

LU Connect is a career development platform built for students of the **University of Lucknow**. It aims to democratize access to career opportunities and professional development through curated job and internship listings, resume analysis, and AI-powered job compatibility insights.

This repository contains the **backend application** of LU Connect, responsible for REST APIs, authentication, database operations, file uploads, and AI-powered services.

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL (Neon)
- **ORM:** Prisma
- **Authentication:** Clerk JWT verification (Students), JWT (TPC/Admin)
- **File Storage:** Supabase Storage
- **AI Integration:** Google Gemini API
- **Email Services:** SMTP / Resend

## Project Architecture

LU Connect is maintained in two separate repositories:

| Repository | Responsibility |
|---|---|
| Frontend | Next.js application, UI, student dashboard, and API integration |
| Backend (this repository) | NestJS REST APIs, authentication, database operations, and application logic |

**Frontend Repository:** [LU Connect – Frontend](https://github.com/abhishekpathak4860/LU-Connect-Frontend.git)

The frontend communicates with this backend through REST APIs.

## Features

- Student authentication and profile management
- Admin/TPC authentication and management
- Job postings and applications
- Internship postings and applications
- Resume uploads and management
- AI-powered resume analysis
- AI-powered job compatibility analysis using Google Gemini
- Application status management
- Email-related services and notifications

## Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS recommended)
- npm
- [Git](https://git-scm.com/)
- PostgreSQL database (Neon or another PostgreSQL provider)

### 1. Clone the Repository

```bash
git clone https://github.com/abhishekpathak4860/Lu-Connect_Backend.git
cd lu-connect
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory of the backend project.

Add the following environment variables:

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DATABASE?sslmode=require"

# Supabase Storage
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key"
SUPABASE_ANON_KEY="your_supabase_anon_key"

# Admin / TPC
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change_this_password"

# Google Gemini
GEMINI_API_KEY="your_gemini_api_key"

# Frontend
FRONTEND_URL="http://localhost:3000"

# Application
NODE_ENV="development"

# JWT Authentication
JWT_SECRET="replace_with_a_long_random_secret"

# Clerk Student Authentication
CLERK_JWT_KEY="your_clerk_jwt_public_key_or_pem_value"

# SMTP Configuration
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your_email@example.com"
SMTP_PASSWORD="your_smtp_password"

SMTP_FROM_NAME="LU Connect"
SMTP_FROM_EMAIL="your_email@example.com"

# Resend Email Service
RESEND_API_KEY="your_resend_api_key"
RESEND_FROM_EMAIL="noreply@yourdomain.com"
RESEND_FROM_NAME="LU Connect"
```

**Important:**
- Replace all example values with your actual credentials.
- Use your Neon PostgreSQL connection string for `DATABASE_URL`.
- Configure Supabase credentials for file storage.
- Obtain your Gemini API key from [Google AI Studio](https://aistudio.google.com/).
- Configure Clerk JWT verification using your Clerk application.
- Configure SMTP or Resend with valid email service credentials.
- Never commit your `.env` file or expose secret keys publicly.

### 4. Generate Prisma Client

```bash
npx prisma generate
```

### 5. Apply Database Migrations

If you are setting up the project for the first time and the repository contains existing Prisma migrations, run:

```bash
npx prisma migrate deploy
```

For development, when creating new migrations after modifying the Prisma schema, use:

```bash
npx prisma migrate dev --name migration_name
```

### 6. Start the Backend Server

Development mode:

```bash
npm run start:dev
```

The backend will start using the configured application port.

## Running the Application

```bash
# Development
npm run start

# Watch mode
npm run start:dev

# Production build
npm run build

# Production mode
npm run start:prod
```

## Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Deployment

The backend is deployed independently of the frontend.

For production deployment:

1. Configure all required environment variables on your hosting platform.
2. Set `NODE_ENV` to `production`.
3. Configure the production PostgreSQL database.
4. Run Prisma migrations using `npx prisma migrate deploy`.
5. Build the application using `npm run build`.
6. Start the application using `npm run start:prod`.
7. Configure the frontend to use the deployed backend API URL.

For more information, refer to the [NestJS Deployment Documentation](https://docs.nestjs.com/deployment).

## Useful Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Clerk Documentation](https://clerk.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [Resend Documentation](https://resend.com/docs)

## License

This project is developed as a career platform for University of Lucknow students.