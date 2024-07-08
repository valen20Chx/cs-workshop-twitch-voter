import {
	createMemo,
	type Component,
} from "solid-js";

import { InitVotes, type QualityKey, type Qualities } from "./Qualities";
import type { WorkshopItem } from "./Scraper";

type ItemAndVotes = {
	votes: Record<keyof typeof Qualities, number>;
	item: WorkshopItem
};

const sortItemAndVotes = (itemAndVotesList: ItemAndVotes[]): ItemAndVotes[] => {
	const keys: QualityKey[] = [...Object.keys(InitVotes)].toReversed() as unknown as QualityKey[];

	// TODO : Rework this sorting function
	return itemAndVotesList.toSorted((itemA, itemB) => {
		for (const key of keys) {
			if (itemA.votes[key] > itemB.votes[key]) {
				return -1;
			}
			if (itemA.votes[key] < itemB.votes[key]) {
				return 1;
			}
		}
		return 0;
	});
}

const Summary: Component<{
	items: WorkshopItem[],
	votes: Array<Record<keyof typeof Qualities, number>>
}> = (props) => {
	const mergedItemsVotes = createMemo<ItemAndVotes[]>(() => {
		return sortItemAndVotes(props.items.map((item, index) => ({ item, votes: props.votes[index] })));
	});

	return (<div class="bg-blue-950 text-white">
		<p class="text-2xl text-center font-bold p-8">Summary</p>
		<div class="flex flex-wrap gap-4 justify-around">
			{mergedItemsVotes().map(({ item }) => {
				return <a href={item.link} target="_blank" rel="noreferrer" class="max-w-96">
					<img src={item.imagesSrcs.at(0) ?? ""} alt={item.title} />
					<p>
						{item.title} by {item.authors.at(0)?.name ?? "??"}
					</p>
				</a>;
			})}
		</div>
	</div>);
};

export default Summary;
