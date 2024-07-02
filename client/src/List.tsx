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

const SWAP_ITEM_INTERVAL = 20 * 1000;

const List: Component<{ client: tmi.Client }> = (props) => {
	const [completed, setCompleted] = createSignal<boolean>(false);
	const [pickedItem, setPickedItem] = createSignal<WorkshopItem | undefined>();
	const [items, setItems] = createSignal<WorkshopItem[]>([]);
	const [pickedItemStartTime, setPickedItemStartTime] = createSignal<Date>(new Date());

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

			console.log("ShortItems", randomizedArray);

			// Preload first item
			const item = randomizedArray.pop();
			if (item) {
				setItems([await scrapeWorkshopItem(item)]);
			}

			return randomizedArray;
		}
		console.error("Could not fetch workshop");
		return [];
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
			let index = 1;
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

	if (completed()) {
		return (
			<div class="w-full h-full flex justify-center items-center">
				<p class="font-bold text-xl">Completed</p>
			</div>
		);
	}

	return (
		<div class="w-full h-full">
			{shortItems.loading && (
				<div class="flex flex-row justify-center">
					<p class="text-center">Loading...</p>
				</div>
			)}
			{isDef(pickedItem) && <Item item={pickedItem()} client={props.client} />}
		</div>
	);
};

export default List;
