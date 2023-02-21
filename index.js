import { launchBrowser } from "./utils.js";
import * as fs from "fs";

const browser = await launchBrowser();

async function scrapeLamudi({ query, detailed = false }) {
  const page = await browser.newPage();
  const url = "https://www.lamudi.co.id/buy/" + query;
  await page.goto(url, { waitUntil: "networkidle" });

  const items = page.locator("div.ListingCell-wrapper");

  const allItems = await items.all();

  let data = [];
  for (const item of allItems) {
    const res = await scrapeGeneralData(item);
    if (!detailed) data.push(res);

    if (detailed) {
      const link = await item
        .locator(".ListingCell-MainImage > a")
        .getAttribute("href");
      console.log(link);

      const details = await scrapeDetails(link);
      data.push({ ...res, details });
    }
  }

  return data;
}

async function scrapeGeneralData(item) {
  const title = await item.locator(".ListingCell-KeyInfo-title").innerText();
  const address = await item
    .locator(".ListingCell-KeyInfo-address-text")
    .innerText();
  const description = await item
    .locator(".ListingCell-shortDescription")
    .innerText();
  const price = await item.locator(".PriceSection-FirstPrice").innerText();
  const thumbnail = await item.locator("img").first().getAttribute("src");
  const imageCount = await item.locator(".ListingCell-ImageCount").innerText();

  const informationContainer = item.locator(".KeyInformation-attribute_v2");
  const allInformation = await informationContainer.all();
  const information = await Promise.all(
    allInformation.map(async (information) => {
      const label = await information
        .locator(".KeyInformation-label_v2")
        .innerText();
      const value = await information
        .locator(".KeyInformation-value_v2")
        .innerText();
      return { label, value };
    })
  );

  const mainData = {
    title,
    address,
    description,
    price,
    information,
    thumbnail,
    imageCount,
  };

  return { ...mainData };
}

async function scrapeDetails(url) {
  // TO DO: implement scraping details
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle", timeout: 0 });

  const title = await page.locator("h1.Title-pdp-title").innerText();
  const address = await page.locator("h3.Title-pdp-address").innerText();
  const price = await page.locator("div.Title-pdp-price").innerText();
  const description = await page
    .locator("div.ViewMore-text-description")
    .first()
    .allInnerTexts();
  const vendor = await page
    .locator("div.AgentInfoV2-agent-name")
    .first()
    .innerText();
  const vendorImage = await page
    .locator("img.AgentInfoV2-agent-portrait")
    .first()
    .getAttribute("src");

  const showNumber =
    "a.AgentInfoV2-requestPhoneSection-showNumber.js-phoneLeadShowNumber";

  await page.locator(showNumber).first().click();

  await page.waitForTimeout(2000);

  const vendorPhone = await page
    .locator("div.LeadSuccess-phone")
    .allInnerTexts();

  await page.keyboard.press("Escape");

  await page.locator("div.Banner-Images").first().click();

  const banner = page.locator("div.Banner-Wrapper");

  await page.waitForTimeout(2000);

  const images = banner.locator("img");
  const sliderImages = page.locator("img.Header-pdp-inner-image");
  const allImages = [...(await images.all()), ...(await sliderImages.all())];

  const imageUrls = await Promise.all(
    allImages.map(async (image) => {
      return await image.getAttribute("src");
    })
  );

  await page.keyboard.press("Escape");

  const listings = page.locator("div.listing-section.listing-details");
  const allListings = await listings.locator("div.columns-2").all();

  const listingData = await Promise.all(
    allListings.map(async (listing) => {
      const label = await listing.locator("div.ellipsis").innerText();
      const value = await listing.locator("div.last").innerText();
      return { label, value };
    })
  );

  await page.close();

  return {
    title,
    images: imageUrls.filter((url) => Boolean(url)),
    address,
    price,
    description,
    vendor: {
      name: vendor,
      image: vendorImage,
      phones: vendorPhone.join("").split("\n"),
    },
    listingData,
  };
}

const data = await scrapeLamudi({ query: "?q=bogor", detailed: true });

fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
console.log("done");
process.exit(0);
