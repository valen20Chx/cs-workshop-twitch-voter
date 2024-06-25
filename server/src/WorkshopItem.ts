import { parse } from "date-fns";
import type { Browser } from "puppeteer";
import { ScraperError } from "./ScraperError";
import _ from "lodash";

const parseWorkshopDate = (dateStr: string): Date => {
	return parse(dateStr, "d MMM @ h:mmaaa", new Date());
};

interface Author {
	name: string;
	link: string;
}

export interface WorkshopItemShort {
	title: string;
	link: string;
	thumbnail: string;
	author: Author;
}

export type WorkshopItemRaw = WorkshopItemShort & {
	imagesSrcs: string[];
	authorImgSrc: string;
	postedOnStr: string;
	updatedOnStr: string;
};

export type WorkshopItem = Omit<
	WorkshopItemRaw,
	"postedOnStr" | "updatedOnStr"
> & {
	postedOn: Date;
	updatedOn: Date;
};

export async function scrapeFullInfo(
	browser: Browser,
	shortItem: WorkshopItemShort,
): Promise<WorkshopItem> {
	const page = await browser.newPage();
	await page.goto(shortItem.link);

	try {
		const itemRaw = await page.evaluate((shortItem): WorkshopItemRaw => {
			const imagesSelector = 'div[id^="thumb_screenshot"] > img';
			const imagesElements = document.querySelectorAll(imagesSelector);
			const imagesSrcs = [...imagesElements.values()]
				.map((imageElement) => imageElement.getAttribute("src"))
				.reduce<string[]>((arr, curr) => {
					if (curr) {
						arr.push(curr);
					}
					return arr;
				}, []);

			if (!imagesSrcs.length) {
				throw new Error("No images found");
			}

			const authorImgElement = document.querySelector(
				"div.creatorsBlock div.playerAvatar img",
			);
			const authorImgSrc = authorImgElement?.getAttribute("src");

			if (!authorImgSrc) {
				throw new Error("No author img found");
			}

			const postedOnSelector =
				"div.detailsStatsContainerRight > div:nth-child(2)";

			const postedOnElement = document.querySelector(postedOnSelector);
			const postedOnStr = postedOnElement?.textContent;

			console.log({
				postedOnSelector,
				postedOnElement,
				postedOnTxt: postedOnStr,
			});
			if (!postedOnStr) {
				throw new Error("No postedOn found");
			}

			const updatedOnSelector =
				"div.detailsStatsContainerRight > div:nth-child(3)";
			const updatedOnElement = document.querySelector(updatedOnSelector);
			const updatedOnStr = updatedOnElement?.textContent;

			if (!updatedOnStr) {
				throw new Error("No updatedOn found");
			}

			return {
				...shortItem,
				imagesSrcs: imagesSrcs,
				authorImgSrc,
				postedOnStr,
				updatedOnStr,
			};
		}, shortItem);

		return {
			..._.omit(itemRaw, ["postedOnStr", "updatedOnStr", "imagesSrcs"]),
			postedOn: parseWorkshopDate(itemRaw.postedOnStr),
			updatedOn: parseWorkshopDate(itemRaw.updatedOnStr),
			imagesSrcs: itemRaw.imagesSrcs.map((src) => {
				const url = new URL(src);

				// We receive a low res thumbnail. Here we resize it.
				url.searchParams.set("imw", "1920");
				url.searchParams.set("imh", "1080");

				return url.href;
			}),
		};
	} catch (err) {
		if (err instanceof Error) {
			throw new ScraperError(err.message, page);
		}
		throw err;
	} finally {
		page.close();
	}
}
