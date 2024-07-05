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
		url.searchParams.set("childpublishedfileid", "0");
		url.searchParams.set("excludedtags%5B%5D", "Sticker");
		url.searchParams.set("excludedtags%5B%5D", "Spray");
		url.searchParams.set("excludedtags%5B%5D", "Tournament+Submission");

		return url.toString();
	}
}

const parsePage = async <T>(url: string, fn: (document: Document) => T): Promise<T> => {
	// WARN : This proxy might stop working anytime.
	const proxiedUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url.toString())}`;

	const htmlText = await fetch(proxiedUrl).then(res => res.text());

	const parser = new DOMParser();
	const doc = parser.parseFromString(htmlText, "text/html");

	return fn(doc);
}

export async function scrapeWorkshopList(): Promise<WorkshopItemShort[]> {
	const url = new WorkshopPageUrl({ appid: "730", page: 1 });

	return parsePage(url.toString(), (document): WorkshopItemShort[] => {
		return [...document.querySelectorAll("div.workshopItem")].map(item => {
			const titleElement = item.querySelector("div.workshopItemTitle");
			const linkElement = item.querySelector("a");
			const thumbnailElement = item.querySelector("img");

			if (
				!titleElement ||
				!linkElement ||
				!thumbnailElement
			) {
				throw new Error("Nothing found for item");
			}

			const title = titleElement.textContent;
			const link = linkElement.href;
			const thumbnail = thumbnailElement.src;

			if (!title) {
				throw new Error("Title not found");
			}

			return ({
				title,
				link,
				thumbnail,
			});
		});
	});
}

export async function scrapeWorkshopItem(
	shortItem: WorkshopItemShort,
): Promise<WorkshopItem> {
	try {

		const itemRaw = await parsePage<WorkshopItemRaw>(shortItem.link, (document) => {
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

			const authors = [...document.querySelectorAll("div.creatorsBlock > div").values()].map<Author>(authorBlockEle => {
				const imgSrc = authorBlockEle.querySelector(
					"div.creatorsBlock div.playerAvatar img",
				)?.getAttribute("src");
				const name = authorBlockEle.querySelector("div.creatorsBlock > div > div:nth-child(3)")?.textContent?.trim().split("\n")[0];
				const link = authorBlockEle.querySelector("a")?.href;

				if (!imgSrc || !name || !link) {
					throw new Error("Could not form author");
				}

				return { name, link, imgSrc };
			});

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

			return {
				...shortItem,
				imagesSrcs: imagesSrcs,
				authorImgSrc,
				postedOnStr,
				updatedOnStr,
				authors,
			};
		});

		return {
			..._.omit(itemRaw, ["postedOnStr", "updatedOnStr", "imagesSrcs"]),
			postedOn: parseWorkshopDate(itemRaw.postedOnStr),
			updatedOn: itemRaw.updatedOnStr ? parseWorkshopDate(itemRaw.updatedOnStr) : undefined,
			imagesSrcs: itemRaw.imagesSrcs.map((src) => {
				const url = new URL(src);

				// We receive a low res thumbnail. Here we resize it.
				url.searchParams.set("imw", "1920");
				url.searchParams.set("imh", "1080");

				return url.href;
			}),
		};
	} catch (e) {
		console.error(`Error while scraping ${shortItem.link}`);
		throw e;
	}
}

const parseWorkshopDate = (dateStr: string): Date => {
	return parse(dateStr, "d MMM @ h:mmaaa", new Date());
};

interface Author {
	name: string;
	link: string;
	imgSrc: string;
}

export interface WorkshopItemShort {
	title: string;
	link: string;
	thumbnail: string;
}

export type WorkshopItemRaw = WorkshopItemShort & {
	imagesSrcs: string[];
	authors: Author[];
	postedOnStr: string;
	updatedOnStr: string;
};

export type WorkshopItem = Omit<
	WorkshopItemRaw,
	"postedOnStr" | "updatedOnStr"
> & {
	postedOn: Date;
	updatedOn?: Date;
};

