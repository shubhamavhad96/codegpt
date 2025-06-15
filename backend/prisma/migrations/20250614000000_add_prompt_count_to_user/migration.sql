-- Add promptCount column to User table
ALTER TABLE "User" ADD COLUMN "promptCount" INTEGER NOT NULL DEFAULT 0; 