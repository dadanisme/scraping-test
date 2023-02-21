import { chromium } from "playwright";

export const launchBrowser = (headless = false) =>
  chromium.launch({ headless });
