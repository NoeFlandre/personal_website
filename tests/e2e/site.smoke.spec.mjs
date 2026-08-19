import { expect, test } from "@playwright/test";

const mobileViewport = { width: 390, height: 844 };

async function assertNoHorizontalOverflow(page) {
  const fitsViewport = await page.evaluate(() => {
    const root = document.documentElement;
    return root.scrollWidth <= root.clientWidth + 1;
  });

  expect(fitsViewport).toBe(true);
}

test("the mobile homepage menu navigates to the posts archive without overflow", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/");

  await expect(page).toHaveTitle(/Noé Flandre/);
  await expect(page.locator("#main-content")).toBeVisible();
  await assertNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Open Menu" }).click();
  await expect(page.getByRole("button", { name: "Close Menu" })).toBeVisible();
  await page.getByRole("link", { name: "Posts", exact: true }).click();

  await expect(page).toHaveURL(/\/posts$/);
  await expect(page.getByRole("heading", { name: "All Posts" })).toBeVisible();
  await assertNoHorizontalOverflow(page);
});

test("a post route mounts its browser enhancements and supports copy feedback", async ({
  page,
}) => {
  await page.goto("/posts/georeasoner");

  await expect(page.locator("#article")).toBeVisible();
  await expect(page.locator(".progress-container[data-post-progress]")).toBeAttached();

  const copyButton = page.locator("#article .copy-code").first();
  await expect(copyButton).toHaveText("Copy");
  await copyButton.click();
  await expect(copyButton).toHaveText("Copied");
});

test("article headings receive in-page anchor links", async ({ page }) => {
  await page.goto("/posts/2026/attention-pooling");

  await expect(page.locator("#article .heading-link").first()).toBeAttached();
});

test("the mobile article stays inside the viewport and the theme control toggles", async ({
  page,
}) => {
  await page.setViewportSize(mobileViewport);
  await page.goto("/posts/georeasoner");

  await assertNoHorizontalOverflow(page);

  await page.goto("/");
  await page.getByRole("button", { name: "Open Menu" }).click();
  const themeButton = page.locator("#theme-btn");
  await expect(themeButton).toHaveAttribute("aria-label", "dark");
  await themeButton.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
