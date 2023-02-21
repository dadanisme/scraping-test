import { launchBrowser } from "./utils.js";
import * as fs from "fs";

const browser = await launchBrowser();

async function scrapeLamudi({ query, detailed = false }) {
  const page = await browser.newPage();
  const url = "https://www.lamudi.co.id/buy/" + query;
  await page.goto(url, { waitUntil: "networkidle" });

  const items = page.locator("div.ListingCell-wrapper");

  const allItems = await items.all();

  const data = await Promise.all(
    allItems.map(async (item) => {
      const title = await item.locator(".ListingCell-KeyInfo-title").innerText(); // prettier-ignore
      const address = await item.locator(".ListingCell-KeyInfo-address-text").innerText(); // prettier-ignore
      const description = await item.locator(".ListingCell-shortDescription").innerText(); // prettier-ignore
      const price = await item.locator(".PriceSection-FirstPrice").innerText();

      const informationContainer = item.locator(".KeyInformation-attribute_v2"); // prettier-ignore
      const allInformation = await informationContainer.all();
      const information = await Promise.all(
        allInformation.map(async (information) => {
          const label = await information.locator(".KeyInformation-label_v2").innerText(); // prettier-ignore
          const value = await information.locator(".KeyInformation-value_v2").innerText(); // prettier-ignore
          return { label, value };
        })
      );

      if (!detailed) return { title, address, description, price, information };

      const link = await item
        .locator(".ListingCell-MainImage > a")
        .getAttribute("href");
      console.log(link);

      const details = await scrapeDetails(link);

      return { title, address, description, price, information, details, link };
    })
  );

  return data;
}

async function scrapeDetails(url) {
  // TO DO: implement scraping details
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 0 });

  const title = await page
    .locator("h1.Title-pdp-title", { timeout: 0 })
    .innerText();

  await page.close();

  return { title };
}

const data = await scrapeLamudi({ query: "?q=jakarta", detailed: true });

fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
process.exit(0);
