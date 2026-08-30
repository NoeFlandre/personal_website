import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

const REPRESENTATIVE_ROUTES = [
  ["homepage", "/"],
  ["posts archive", "/posts"],
  ["about page", "/about"],
  ["attention pooling post", "/posts/2026/attention-pooling"],
];

const MOBILE_VIEWPORT = { width: 390, height: 844 };

function isMobileProject(testInfo) {
  return testInfo.project.name.includes("mobile");
}

async function prepareTheme(page, testInfo) {
  const theme = testInfo.project.use.colorScheme === "light" ? "light" : "dark";

  await page.addInitScript((selectedTheme) => {
    localStorage.setItem("theme", selectedTheme);
    localStorage.setItem("themeSetTimestamp", String(Date.now()));
  }, theme);
}

async function expectAccessible(page, label) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  const violationSummary = results.violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact ?? "unknown"}): ${violation.help}\n` +
        violation.nodes.map((node) => `  ${node.target.join(", ")}`).join("\n")
    )
    .join("\n");

  expect(results.violations.length, `${label}\n${violationSummary}`).toBe(0);
}

test.beforeEach(async ({ page }, testInfo) => {
  await prepareTheme(page, testInfo);
});

for (const [label, route] of REPRESENTATIVE_ROUTES) {
  test(`has no WCAG A/AA violations on the ${label}`, async ({ page }) => {
    await page.goto(route);
    await page.waitForLoadState("load");
    await page.evaluate(() => document.fonts?.ready);
    await expectAccessible(page, label);
  });
}

test("the mobile navigation is keyboard-operable and accessible when open", async ({
  page,
}, testInfo) => {
  test.skip(!isMobileProject(testInfo), "The menu button is mobile-only.");

  await page.setViewportSize(MOBILE_VIEWPORT);
  await page.goto("/");

  const menuButton = page.locator("#menu-btn");
  await menuButton.focus();
  await menuButton.press("Enter");

  await expect(menuButton).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("button", { name: "Close Menu" })).toBeFocused();
  await expect(page.getByRole("link", { name: "Posts", exact: true })).toBeVisible();
  await expectAccessible(page, "open mobile navigation");
});

test("the recommendations carousel responds to keyboard input and remains accessible", async ({
  page,
}) => {
  await page.goto("/about");

  const next = page.getByRole("button", { name: "Next recommendation" });
  await next.focus();
  await next.press("Enter");
  await expect(page.locator("[data-slide]").nth(1)).toHaveAttribute("aria-hidden", "false");

  const thirdDot = page.getByRole("button", { name: "Go to recommendation 3" });
  await thirdDot.focus();
  await thirdDot.press("Space");
  await expect(page.locator("[data-slide]").nth(2)).toHaveAttribute("aria-hidden", "false");
  await expectAccessible(page, "recommendations carousel after keyboard navigation");
});

test("the About introduction keeps its image and copy layout contract", async ({
  page,
}, testInfo) => {
  await page.goto("/about");

  const intro = page.locator("#about-intro");
  const image = intro.locator("img");
  const firstParagraph = intro.locator("p").first();

  await expect(image).toBeVisible();
  await expect(firstParagraph).toBeVisible();
  await expect(firstParagraph).toContainText("I am an AI Research Engineer");

  const layout = await firstParagraph.evaluate((paragraph) => {
    const textColumn = paragraph.parentElement;
    const imageColumn = textColumn?.parentElement?.firstElementChild;
    if (!textColumn || !imageColumn) {
      throw new Error("The About introduction columns are missing.");
    }

    return {
      paragraphMarginTop: getComputedStyle(paragraph).marginTop,
      imageTop: imageColumn.getBoundingClientRect().top,
      imageBottom: imageColumn.getBoundingClientRect().bottom,
      textTop: textColumn.getBoundingClientRect().top,
    };
  });

  expect(layout.paragraphMarginTop).toBe("0px");

  if (isMobileProject(testInfo)) {
    expect(layout.textTop).toBeGreaterThanOrEqual(layout.imageBottom - 1);
    return;
  }

  expect(Math.abs(layout.textTop - layout.imageTop)).toBeLessThanOrEqual(1);
});

test("the About map renders its current controls without legacy text blocks", async ({ page }) => {
  await page.goto("/about");

  const map = page.locator("[data-about-map-root]");

  await expect(map).toBeVisible();
  await expect(
    map.getByRole("heading", { name: "Where I worked, studied, and traveled" })
  ).toBeVisible();
  await expect(map.locator("[data-map-canvas]")).toHaveAttribute(
    "aria-label",
    "Interactive map with location markers"
  );
  await expect(map.locator(".about-map__eyebrow")).toHaveCount(0);
  await expect(map.locator(".about-map__subtitle")).toHaveCount(0);
});

test("the About map filters and cards respond to keyboard input", async ({ page }) => {
  await page.goto("/about");

  const workFilter = page.getByRole("button", { name: "Worked", exact: true });
  await workFilter.focus();
  await workFilter.press("Enter");
  await expect(workFilter).toHaveAttribute("data-active", "true");

  const firstCard = page.locator(".about-map__card").first();
  await firstCard.focus();
  await firstCard.press("Enter");
  await expect(firstCard).toHaveAttribute("data-active", "true");
  await expectAccessible(page, "About map after keyboard interaction");
});

test("the theme control toggles by keyboard without introducing violations", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  if (isMobileProject(testInfo)) {
    const menuButton = page.locator("#menu-btn");
    await menuButton.focus();
    await menuButton.press("Enter");
  }

  const themeButton = page.locator("#theme-btn");
  const initialTheme = await page.locator("html").getAttribute("data-theme");
  await themeButton.focus();
  await themeButton.press("Enter");

  await expect(page.locator("html")).toHaveAttribute(
    "data-theme",
    initialTheme === "light" ? "dark" : "light"
  );
  await expectAccessible(page, "homepage after keyboard theme toggle");
});
