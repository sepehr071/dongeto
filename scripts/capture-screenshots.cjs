// Captures README screenshots from a running dev server with demo data.
// The LLM route (/api/g/*/chat) is mocked with canned drafts; everything else
// (group creation, confirm, split + settlement) runs through the real app and DB.
// Usage: npm run dev -- -p 4230 -H 127.0.0.1   then
//        node scripts/capture-screenshots.cjs [baseUrl]   (needs `playwright` resolvable)
/* eslint-disable @typescript-eslint/no-require-imports -- plain CommonJS script */
const { chromium } = require("playwright");
const path = require("path");

const BASE = process.argv[2] || "http://127.0.0.1:4230";
const OUT = path.join(__dirname, "..", "docs", "images");

const TURNS = [
  {
    text: "شام ۱ میلیون و ۲۰۰ هزار رو علی حساب کرد، بین علی، سارا، رضا و مریم",
    reply: "یه پیش‌نویس ساختم: شام، ۱٬۲۰۰٬۰۰۰ تومان، علی داده، مساوی بین چهار نفر.",
    draft: {
      title: "شام",
      amount: 1200000,
      splitType: "equal",
      payers: [{ name: "علی", amount: 1200000 }],
      shares: ["علی", "سارا", "رضا", "مریم"].map((name) => ({ name, weight: 1 })),
    },
  },
  {
    text: "بنزین ۸۰۰ هزار رو سارا داد، بین همه",
    reply: "بنزین ۸۰۰٬۰۰۰ تومان به حساب سارا، مساوی بین همه.",
    draft: {
      title: "بنزین",
      amount: 800000,
      splitType: "equal",
      payers: [{ name: "سارا", amount: 800000 }],
      shares: ["علی", "سارا", "رضا", "مریم"].map((name) => ({ name, weight: 1 })),
    },
  },
  {
    text: "ویلا ۴ میلیون رو رضا داد. مریم دو سهم حساب کن، دو شب بیشتر موند",
    reply: "ویلا ۴٬۰۰۰٬۰۰۰ تومان، رضا داده. تقسیم سهمی: مریم ۲ سهم، بقیه ۱ سهم.",
    draft: {
      title: "ویلا",
      amount: 4000000,
      splitType: "shares",
      payers: [{ name: "رضا", amount: 4000000 }],
      shares: [
        { name: "علی", weight: 1 },
        { name: "سارا", weight: 1 },
        { name: "رضا", weight: 1 },
        { name: "مریم", weight: 2 },
      ],
    },
  },
];

async function shot(page, name) {
  // hide the Next.js dev badge and focus rings
  await page.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  await page.evaluate(() => document.activeElement?.blur());
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, name) });
  console.log("saved", name);
}

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "light",
  });
  const page = await ctx.newPage();
  let turn = 0;
  await page.route("**/api/g/*/chat", (route) => {
    const t = TURNS[turn++];
    route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ text: t.reply, drafts: [t.draft] }),
    });
  });

  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.fill("textarea[name=names]", "علی، سارا، رضا، مریم");
  await page.fill("input[name=title]", "سفر شمال");
  await shot(page, "home.png");

  await page.click("button[type=submit]");
  await page.waitForURL("**/g/**");
  await page.waitForLoadState("networkidle");
  const groupUrl = page.url();
  await page.getByRole("button", { name: "علی" }).first().click();

  for (let i = 0; i < TURNS.length; i++) {
    await page.fill("#dong-chat", TURNS[i].text);
    await page.click("form button[type=submit]");
    await page.getByText("پیش‌نویس", { exact: true }).waitFor();
    // hero.png is a composed banner around chat-draft.png + mobile.png, not captured here
    // taller viewport so the fixed draft panel doesn't crowd out the transcript
    if (i === TURNS.length - 1) {
      await page.setViewportSize({ width: 1440, height: 1200 });
      await shot(page, "chat-draft.png");
      await page.setViewportSize({ width: 1440, height: 900 });
    }
    await page.getByRole("button", { name: "ثبت", exact: true }).click();
    await page.getByText("پیش‌نویس", { exact: true }).waitFor({ state: "detached" });
    await page.waitForLoadState("networkidle");
  }
  await page.fill("#dong-chat", "");
  await shot(page, "settlement.png");

  const dark = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "dark",
  });
  const dp = await dark.newPage();
  await dp.goto(groupUrl, { waitUntil: "networkidle" });
  await shot(dp, "settlement-dark.png");

  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    colorScheme: "light",
  });
  const mp = await mobile.newPage();
  await mp.goto(groupUrl, { waitUntil: "networkidle" });
  await shot(mp, "mobile.png");

  await browser.close();
})();
