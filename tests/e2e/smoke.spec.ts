import { expect, test } from "@playwright/test";

test("play: pick easy and drop in column 1 triggers CPU turn", async ({ page }) => {
  await page.goto("/play");
  await page.getByRole("button", { name: "easy" }).click();
  await page.getByRole("button", { name: "Column 1" }).click();
  await expect(page.getByText(/CPU is thinking/i)).toBeVisible({ timeout: 15_000 });
});

test("home loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/four\.io/i).first()).toBeVisible();
});
