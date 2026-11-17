-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateTable
CREATE TABLE "Internship" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "company_name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "work_mode" "WorkMode" NOT NULL,
    "stipend" TEXT NOT NULL,
    "duration" TEXT NOT NULL,
    "eligibility_criteria" TEXT NOT NULL,
    "required_skills" TEXT[],
    "description" TEXT NOT NULL,
    "application_deadline" TIMESTAMP(3) NOT NULL,
    "start_date" TIMESTAMP(3),

    CONSTRAINT "Internship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternshipApplication" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
    "internship_id" UUID NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "resume_url" TEXT NOT NULL,

    CONSTRAINT "InternshipApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Internship_created_at_idx" ON "Internship"("created_at" DESC);

-- CreateIndex
CREATE INDEX "InternshipApplication_internship_id_created_at_idx" ON "InternshipApplication"("internship_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "InternshipApplication_user_id_created_at_idx" ON "InternshipApplication"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "InternshipApplication_user_id_internship_id_key" ON "InternshipApplication"("user_id", "internship_id");

-- AddForeignKey
ALTER TABLE "InternshipApplication" ADD CONSTRAINT "InternshipApplication_internship_id_fkey" FOREIGN KEY ("internship_id") REFERENCES "Internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipApplication" ADD CONSTRAINT "InternshipApplication_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
