/*
  Warnings:

  - A unique constraint covering the columns `[user_id,job_id]` on the table `Application` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_id` to the `Application` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Application_job_id_created_at_idx" ON "Application"("job_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "Application_user_id_created_at_idx" ON "Application"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Application_user_id_job_id_key" ON "Application"("user_id", "job_id");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
