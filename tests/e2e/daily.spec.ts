import { expect, test } from "@playwright/test";

test("daily page loads puzzle title and board", async ({ page }) => {
  await page.goto("/daily");
  await expect(page.getByRole("heading", { name: "Daily puzzle" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(/UTC \d{4}-\d{2}-\d{2}/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /Daily rankings \(UTC\)/ })).toBeVisible();
});
