import { launchBrowser } from "./utils.js";
import * as fs from "fs";

const browser = await launchBrowser();

const page = await browser.newPage();
const url =
  "https://www.lamudi.co.id/banten/tangerang-selatan/pamulang/buy/?q=pamulang%20estate&fbclid=IwAR0opVl5uGhZKh3-ef06eOzLep5b69DSajn2WK9SWjWHbfVY30OIGBswye4";
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

    // TO DO: implement scraping details scrapeDetails(...)
    // const details = await scrapeDetails(item);

    return { title, address, description, price, information };
  })
);

fs.writeFileSync("data.json", JSON.stringify(data, null, 2));

console.log("done");

process.exit(0);
