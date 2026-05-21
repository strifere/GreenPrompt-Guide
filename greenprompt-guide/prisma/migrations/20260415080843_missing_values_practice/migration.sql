-- AlterTable
ALTER TABLE "practices" ADD COLUMN     "greenScore" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "tactic" "TacticType" NOT NULL DEFAULT 'GREEN_PRACTICE';
