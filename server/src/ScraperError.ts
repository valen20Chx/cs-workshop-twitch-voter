import type { Page } from "puppeteer";

export class ScraperError extends Error {
	constructor(message: string, page: Page) {
		const screenshotPath = `./tmp/${new Date().toISOString()}.png`;
		const takeScreenshot = page.screenshot({
			path: screenshotPath,
		});
		takeScreenshot
			.then((_buffer) => {
				console.log("Screenshot taken");
			})
			.catch((err) => {
				console.error("Could not take a screenshot.");
				console.error(err);
			});
		super(`${message}
Page screenshot saved at: ${screenshotPath}`);
	}
}
