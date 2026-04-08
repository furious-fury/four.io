-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "base_points" INTEGER NOT NULL,
    "bonus_points" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL,
    "move_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leaderboard_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leaderboard_entries_total_score_idx" ON "leaderboard_entries"("total_score" DESC);
