import { URL } from "node:url";
import puppeteer from "puppeteer";
import { scrapeFullInfo, type WorkshopItemShort } from "./WorkshopItem";

export class WorkshopPageUrl {
	private appid: string;
	private page: string;

	constructor({ appid, page }: { appid: string; page: number }) {
		this.appid = appid;
		if (page < 1 || !Number.isInteger(page)) {
			throw new Error("Workshop page number invalid");
		}
		this.page = page.toString();
	}

	toString() {
		const url = new URL("https://steamcommunity.com/workshop/browse/");

		url.searchParams.set("appid", this.appid);
		url.searchParams.set("p", this.page);

		url.searchParams.set("browsesort", "trend");
		url.searchParams.set("section", "mtxitems");
		url.searchParams.set("actualsort", "trend");
		url.searchParams.set("days", "1");

		return url.toString();
	}
}

export async function scrapeWorkshop(url: WorkshopPageUrl) {
	const browser = await puppeteer.launch({
		defaultViewport: {
			width: 1920,
			height: 1080,
			hasTouch: false,
			isMobile: false,
			isLandscape: false,
		},
	});
	const page = await browser.newPage();
	console.log("Scraping page:", url.toString());
	await page.goto(url.toString());

	const items = await page.evaluate(() => {
		const results: WorkshopItemShort[] = [];
		const itemElements = document.querySelectorAll("div.workshopItem");
		for (const item of itemElements) {
			const titleElement = item.querySelector("div.workshopItemTitle");
			const linkElement = item.querySelector("a");
			const thumbnailElement = item.querySelector("img");
			const authorElement = item.querySelector("a.workshop_author_link");

			if (
				!titleElement ||
				!linkElement ||
				!thumbnailElement ||
				!authorElement
			) {
				continue;
			}

			const title = titleElement.textContent;
			const link = linkElement.href;
			const thumbnail = thumbnailElement.src;
			const authorName = authorElement.textContent;
			const authorLink = authorElement.getAttribute("href");

			if (!title) {
				throw new Error("Title not found");
			}

			if (!authorName || !authorLink) {
				throw new Error("Author not found");
			}

			results.push({
				title,
				link,
				thumbnail,
				author: {
					name: authorName,
					link: authorLink,
				},
			});
		}
		return results;
	});

	const temp = await Promise.all(
		items.map((item) => scrapeFullInfo(browser, item)),
	);

	await browser.close();

	return temp;
}
