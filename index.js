import { launchBrowser, executeStep } from "./utils.js";
import * as fs from "fs";

const browser = await launchBrowser();

async function scrapeLamudi({ query = "", detailed = false, type = "buy" }) {
  const url = `https://www.lamudi.co.id/${type}/?q=${query}`;
  const page = await executeStep(async () => await browser.newPage());

  await executeStep(async () => {
    return await page.goto(url, { waitUntil: "networkidle" });
  });

  const items = await executeStep(async () =>
    page.locator("div.ListingCell-wrapper")
  );

  const allItems = await executeStep(async () => {
    return await items.all();
  });

  let data = [];
  for (const item of allItems) {
    const res = await executeStep(
      async () => await scrapeGeneralData(item, url)
    );

    if (!detailed) data.push(res);

    if (detailed) {
      const link = await executeStep(
        async () =>
          await item.locator(".ListingCell-MainImage > a").getAttribute("href")
      );
      console.log("scraping:", link);

      const details = await executeStep(async () => await scrapeDetails(link));

      data.push({ ...res, details, url: link });
    }
  }

  return data;
}

async function scrapeGeneralData(item, url) {
  const allData = await executeStep(async () => {
    return item.locator("div.ListingCell-AllInfo.ListingUnit");
  });

  const category = await executeStep(
    async () => await allData.getAttribute("data-category")
  );
  const subCategories = await executeStep(
    async () => await allData.getAttribute("data-subcategories")
  );
  const geoPoint = await executeStep(
    async () => await allData.getAttribute("data-geo-point")
  );
  const sku = await executeStep(
    async () => await allData.getAttribute("data-sku")
  );
  const yearBuilt = await executeStep(
    async () => await allData.getAttribute("data-year_built")
  );
  const carSpaces = await executeStep(
    async () => await allData.getAttribute("data-car_spaces")
  );
  const bedrooms = await executeStep(
    async () => await allData.getAttribute("data-bedrooms")
  );
  const bathrooms = await executeStep(
    async () => await allData.getAttribute("data-bathrooms")
  );
  const electricity = await executeStep(
    async () => await allData.getAttribute("data-electricity")
  );

  const price = await executeStep(
    async () => await item.locator(".PriceSection-FirstPrice").innerText()
  );
  const title = await executeStep(
    async () => await item.locator(".ListingCell-KeyInfo-title").innerText()
  );
  const address = await executeStep(
    async () =>
      await item.locator(".ListingCell-KeyInfo-address-text").innerText()
  );
  const description = await executeStep(
    async () => await item.locator(".ListingCell-shortDescription").innerText()
  );
  const thumbnail = await executeStep(
    async () => await item.locator("img").first().getAttribute("src")
  );
  const imageCount = await executeStep(
    async () => await item.locator(".ListingCell-ImageCount").innerText()
  );

  const informationContainer = await executeStep(async () =>
    item.locator(".KeyInformation-attribute_v2")
  );
  const allInformation = await executeStep(
    async () => await informationContainer.all()
  );
  const information = await executeStep(
    async () =>
      await Promise.all(
        allInformation.map(async (information) => {
          const label = await executeStep(
            async () =>
              await information.locator(".KeyInformation-label_v2").innerText()
          );
          const value = await executeStep(
            async () =>
              await information.locator(".KeyInformation-value_v2").innerText()
          );
          return { label, value };
        })
      )
  );

  const mainData = {
    title,
    address,
    short_description: description,
    price,
    information,
    thumbnail,
    imageCount,
    category,
    sub_categories: JSON.parse(subCategories) || null,
    coordinate: JSON.parse(geoPoint) || null,
    sku,
    year_built: yearBuilt || null,
    car_spaces: carSpaces || null,
    bedrooms: bedrooms || null,
    bathrooms: bathrooms || null,
    electricity: electricity || null,
    listing_type: url.includes("/rent/")
      ? "rent"
      : url.includes("/buy/")
      ? "buy"
      : null,
  };

  return { ...mainData };
}

async function scrapeDetails(url) {
  // TO DO: implement scraping details
  const page = await executeStep(async () => await browser.newPage());

  await executeStep(
    async () => await page.goto(url, { waitUntil: "networkidle", timeout: 0 })
  );

  const title = await executeStep(
    async () => await page.locator("h1.Title-pdp-title").innerText()
  );
  const address = await executeStep(
    async () => await page.locator("h3.Title-pdp-address").innerText()
  );
  const price = await executeStep(
    async () => await page.locator("div.Title-pdp-price").innerText()
  );

  const currency = await executeStep(async () => price.split(" ")[0]);

  const description = await executeStep(
    async () =>
      await page
        .locator("div.ViewMore-text-description")
        .first()
        .allInnerTexts()
  );

  const vendor = await executeStep(
    async () =>
      await page.locator("div.AgentInfoV2-agent-name").first().innerText()
  );
  const vendorImage = await executeStep(
    async () =>
      await page
        .locator("img.AgentInfoV2-agent-portrait")
        .first()
        .getAttribute("src")
  );

  const vendorAgency = await executeStep(
    async () =>
      await page.locator("div.AgentInfoV2-agent-agency").first().innerText()
  );

  const showNumber =
    "a.AgentInfoV2-requestPhoneSection-showNumber.js-phoneLeadShowNumber";

  await executeStep(async () => {
    await page.locator(showNumber).first().click();
    await page.waitForTimeout(2000);
  });

  const vendorPhone = await executeStep(
    async () => await page.locator("div.LeadSuccess-phone").allInnerTexts()
  );

  await executeStep(async () => {
    await page.keyboard.press("Escape");
    await page.locator("div.Banner-Images").first().click();
  });

  const banner = await executeStep(async () =>
    page.locator("div.Banner-Wrapper")
  );

  await executeStep(async () => await page.waitForTimeout(2000));

  const images = await executeStep(async () => banner.locator("img"));
  const sliderImages = await executeStep(async () =>
    page.locator("img.Header-pdp-inner-image")
  );
  const allImages = await executeStep(async () => [
    ...(await images.all()),
    ...(await sliderImages.all()),
  ]);

  const imageUrls = await executeStep(
    async () =>
      await Promise.all(
        allImages.map(async (image) => {
          return await image.getAttribute("src");
        })
      )
  );

  await executeStep(async () => await page.keyboard.press("Escape"));

  const listings = await executeStep(async () =>
    page.locator("div.listing-section.listing-details")
  );
  const allListings = await executeStep(
    async () => await listings.locator("div.columns-2").all()
  );

  const listingData = await executeStep(
    async () =>
      await Promise.all(
        allListings.map(async (listing) => {
          const label = await listing.locator("div.ellipsis").innerText();
          const value = await listing.locator("div.last").innerText();
          return { label, value };
        })
      )
  );

  const ammenities = await executeStep(async () =>
    page.locator("span.listing-amenities-name")
  );
  const allAmmenities = await executeStep(async () => await ammenities.all());

  const ammenitiesData = await executeStep(
    async () =>
      await Promise.all(
        allAmmenities.map(async (ammenity) => {
          return await ammenity.innerText();
        })
      )
  );

  const nearbies = await executeStep(
    async () => await page.locator("ul.landmark-left-link").allInnerTexts()
  );

  await executeStep(async () => await page.close());

  return {
    title,
    images: imageUrls.filter((url) => Boolean(url)),
    address,
    price,
    currency,
    description: description.join(""),
    vendor: {
      name: vendor,
      image: vendorImage,
      phones: vendorPhone.join("").split("\n"),
      agency: vendorAgency,
    },
    listings: listingData,
    ammenities: ammenitiesData,
    nearbies,
  };
}

const data = await scrapeLamudi({
  type: "rent",
  query: "bandung",
  detailed: true,
});

fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
console.log("done");
process.exit(0);
