import {
	createEffect,
	createResource,
	createSignal,
	onCleanup,
	type Resource,
	type Setter,
	type Component,
} from "solid-js";

import type tmi from "tmi.js";

import Item, { type IItem } from "./Item";
import { isDef } from "./helpers";
import { scrapeWorkshop } from "./Scraper";

const randomSet = (props: {
	items: Resource<IItem[]>;
	setPickedItem: Setter<IItem | undefined>;
	mutate: Setter<IItem[] | undefined>;
	interval: number;
	setCompleted: () => void;
}) => {
	const currentItems = props.items();
	if (currentItems && currentItems.length > 0) {
		const randomIndex = Math.floor(Math.random() * currentItems.length);
		const item = currentItems[randomIndex];
		props.setPickedItem(item);

		props.mutate(currentItems.filter((_, index) => index !== randomIndex));
	} else {
		props.setCompleted();
		clearInterval(props.interval);
	}
};

const List: Component<{ client: tmi.Client }> = (props) => {
	const [completed, setCompleted] = createSignal(false);

	const [pickedItem, setPickedItem] = createSignal<IItem | undefined>();
	const [items, { mutate }] = createResource<IItem[]>(async () => {
		const itemsRes = JSON.parse(JSON.stringify(await scrapeWorkshop()));
		if (itemsRes) {
			const randomIndex = Math.floor(Math.random() * itemsRes.length);
			const item = itemsRes[randomIndex];
			setPickedItem(item);

			return itemsRes;
		}
		console.error("Could not fetch workshop");
		return [];
	});

	// Slideshow
	createEffect(() => {
		if (!items()) return;

		const interval = setInterval(
			() =>
				randomSet({
					mutate,
					setPickedItem,
					items,
					interval,
					setCompleted: () => setCompleted(true),
				}),
			1000 * 20,
		);

		onCleanup(() => clearInterval(interval));
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
			{items.loading && (
				<div class="flex flex-row justify-center">
					<p class="text-center">Loading...</p>
				</div>
			)}
			{isDef(pickedItem) && <Item item={pickedItem()} client={props.client} />}
		</div>
	);
};

export default List;
