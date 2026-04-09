-- CreateTable
CREATE TABLE "daily_puzzle_entries" (
    "id" TEXT NOT NULL,
    "puzzle_date" DATE NOT NULL,
    "display_name" TEXT NOT NULL,
    "move_count" INTEGER NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_puzzle_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_puzzle_entries_puzzle_date_display_name_key" ON "daily_puzzle_entries"("puzzle_date", "display_name");

-- CreateIndex
CREATE INDEX "daily_puzzle_entries_puzzle_date_move_count_duration_ms_idx" ON "daily_puzzle_entries"("puzzle_date", "move_count", "duration_ms");
