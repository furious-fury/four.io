-- CreateIndex
CREATE INDEX "leaderboard_entries_difficulty_total_score_idx" ON "leaderboard_entries"("difficulty", "total_score" DESC);
