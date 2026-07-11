-- AlterTable
ALTER TABLE "gifts" ADD COLUMN     "external_links" JSONB NOT NULL DEFAULT '[]';
