import {
	createEffect,
	createResource,
	createSignal,
	onCleanup,
	type Component,
} from "solid-js";

import type tmi from "tmi.js";

import Item from "./Item";
import { isDef } from "./helpers";
import { scrapeWorkshopItem, scrapeWorkshopList, type WorkshopItemShort, type WorkshopItem } from "./Scraper";
import Countdown from "./Countdown";

const SWAP_ITEM_INTERVAL = 20 * 1000;

const List: Component<{ client: tmi.Client }> = (props) => {
	const [completed, setCompleted] = createSignal<boolean>(false);
	const [pickedItem, setPickedItem] = createSignal<WorkshopItem | undefined>();
	const [items, setItems] = createSignal<WorkshopItem[]>([]);
	const [pickedItemStartTime, setPickedItemStartTime] = createSignal<Date | undefined>();
	const [countdownPercent, setCountdownPercent] = createSignal<number>(100);
	const [countdownSeconds, setCountdownSeconds] = createSignal<number>(SWAP_ITEM_INTERVAL);

	const [shortItems] = createResource<WorkshopItemShort[]>(async () => {
		const shortItems = await scrapeWorkshopList();
		if (shortItems) {
			const randomizedArray = new Array<WorkshopItemShort>(shortItems.length);

			while (shortItems.length) {
				const randomIndex = Math.floor(Math.random() * shortItems.length);
				const item = shortItems[randomIndex];
				randomizedArray[shortItems.length - 1] = item;
				shortItems.splice(randomIndex, 1)
			}

			// Preload first item
			const shortItem = randomizedArray.pop();
			if (shortItem) {
				const firstItem = await scrapeWorkshopItem(shortItem);
				setItems([firstItem]);
				setPickedItem(firstItem);
			}

			return randomizedArray;
		}

		console.error("Could not fetch workshop");
		return [];
	});

	createEffect(() => {
		if (isDef(pickedItem)) {
			setPickedItemStartTime(new Date());
		}
	});

	// Update the countdown percent
	createEffect(() => {
		let interval: number | undefined;

		if (isDef(pickedItemStartTime)) {
			const start = pickedItemStartTime();
			interval = setInterval(() => {
				const now = new Date();
				const ms = SWAP_ITEM_INTERVAL - (now.getTime() - start.getTime());
				const percent = Math.floor((ms / SWAP_ITEM_INTERVAL) * 100);
				setCountdownPercent(Math.max(0, Math.min(100, percent)));
				setCountdownSeconds(Math.max(0, Math.min(SWAP_ITEM_INTERVAL / 1000, Math.floor(ms / 1000))));
			}, 100);
		}

		onCleanup(() => {
			clearInterval(interval);
		});
	});

	// Load full items
	createEffect(() => {
		if (isDef(shortItems) && shortItems().length) {
			Promise.all(
				shortItems().map((shortItem) => scrapeWorkshopItem(shortItem))
			).then(items => {
				setItems(
					items
				);
			});
		}
	});

	// Swap items
	createEffect(() => {
		let interval: number | undefined;
		if (isDef(items) && items().length) {
			const itemsList = items();
			let index = 0;
			interval = setInterval(() => {
				if (index < itemsList.length) {
					setPickedItem(itemsList.at(index));
					index++;
				} else {
					setCompleted(true);
					clearInterval(interval);
				}
			}, SWAP_ITEM_INTERVAL);
		}
		onCleanup(() => {
			clearInterval(interval);
		});
	});

	return (
		<div class="w-full h-full flex flex-row items-center justify-center">
			{shortItems.loading && <p class="font-bold text-xl">Loading...</p>}

			{completed() && <p class="font-bold text-xl">Completed</p>}

			{isDef(pickedItem) && <div class="w-full h-full">
				<Item item={pickedItem()} client={props.client} />
				<Countdown percent={countdownPercent()} seconds={countdownSeconds()} class="absolute z-20 right-4 top-4" />
			</div>}
		</div>
	);
};

export default List;
