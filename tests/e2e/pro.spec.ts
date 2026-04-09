import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 1280, height: 800 } });

test("pro sidebar visible on desktop play and difficulty change resets history", async ({ page }) => {
  await page.goto("/play");
  const pro = page.getByRole("complementary", { name: "Pro panel" });
  await page.getByRole("button", { name: "easy" }).click();
  await expect(pro.getByRole("heading", { name: "Pro" })).toBeVisible();
  await expect(pro.getByText("Live evaluation")).toBeVisible();
  await page.getByRole("button", { name: "Column 1" }).click();
  await expect(pro.getByText("#1")).toBeVisible();

  await pro.getByRole("button", { name: "hard" }).click();
  const dialog = page.getByRole("dialog", { name: "Change difficulty?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Switch to Hard" }).click();
  await expect(dialog).toBeHidden({ timeout: 10_000 });
  const proAfter = page.getByRole("complementary", { name: "Pro panel" });
  await expect(proAfter.getByText("No moves yet.")).toBeVisible({ timeout: 15_000 });
  await expect(proAfter.getByRole("list").getByText("#1")).toHaveCount(0);
});
