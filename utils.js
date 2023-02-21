import { chromium } from "playwright";

export const launchBrowser = (headless = false) =>
  chromium.launch({ headless });

export const executeStep = async (callback) => {
  try {
    const data = await callback();
    return data;
  } catch (error) {
    return null;
  }
};
