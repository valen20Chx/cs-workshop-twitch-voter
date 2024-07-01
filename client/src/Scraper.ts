import { parse } from "date-fns";
import _ from "lodash";

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

const parsePage = async <T>(url: string, fn: (document: Document) => T): Promise<T> => {
	// WARN : This proxy might stop working anytime.
	const proxiedUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url.toString())}`;

	console.log(proxiedUrl);

	const htmlText = await fetch(proxiedUrl).then(res => res.text());

	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlText, "text/html");

	return fn(doc);
}

export async function scrapeWorkshop() {
	const url = new WorkshopPageUrl({ appid: "730", page: 1 });

	const items = await parsePage(url.toString(), (document): WorkshopItemShort[] => {
		return [...document.querySelectorAll("div.workshopItem")].map(item => {
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
				throw new Error("Nothing found for item");
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

			return ({
				title,
				link,
				thumbnail,
				author: {
					name: authorName,
					link: authorLink,
				},
			});
		});
	});


	const wholeItems = new Array<WorkshopItem>();
	for (const item of items) {
		console.log(`Scraping ${item.title}`);
		wholeItems.push(await scrapeFullInfo(item));
	}

	console.log(wholeItems);

	return wholeItems;
}

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
	shortItem: WorkshopItemShort,
): Promise<WorkshopItem> {
	const itemRaw = await parsePage(shortItem.link, (document) => {
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

		const singleImageSelector = "img#previewImage";
		const singleImageElement = document.querySelector(singleImageSelector);
		const singleImageSrc = singleImageElement?.getAttribute("src");

		if (!imagesSrcs.length && singleImageSrc) {
			imagesSrcs.push(singleImageSrc);
		}

		if (!imagesSrcs.length) {
			throw new Error(
				`No images found (${shortItem.title} : ${shortItem.link})`,
			);
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
	});

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
}
