import { createSignal, createEffect, onCleanup, type Component, createResource, createMemo, Switch, Match } from "solid-js";

import type tmi from "tmi.js";
import { scrapeWorkshopItem, scrapeWorkshopList, type WorkshopItemShort, type WorkshopItem } from "./Scraper";
import { isDef } from "./helpers";
import Item from "./Item";
import Button from "./Button";
import Countdown from "./Countdown";
import { getClosestMatchingQuality, InitVotes, type Qualities } from "./Qualities";
import _ from "lodash";
import type { ChatUserstate } from "tmi.js";
import Summary from "./Summary";

const SWAP_ITEM_INTERVAL = 20 * 1000;

const loadList = async (): Promise<WorkshopItem[]> => {
	const shortItems = await scrapeWorkshopList();
	if (shortItems) {
		const randomizedArray = new Array<WorkshopItemShort>(shortItems.length);

		while (shortItems.length) {
			const randomIndex = Math.floor(Math.random() * shortItems.length);
			const item = shortItems[randomIndex];
			randomizedArray[shortItems.length - 1] = item;
			shortItems.splice(randomIndex, 1);
		}

		return Promise.all(
			randomizedArray.map((shortItem) => scrapeWorkshopItem(shortItem))
		);
	}

	console.error("Could not fetch workshop");
	return [];
};

const createInterval = (callback: () => void, intervalDuration: number) => {
	const [intervalId, setIntervalId] = createSignal<number | undefined>(undefined);

	const start = () => {
		if (intervalId()) return; // Prevent multiple intervals
		const id = setInterval(callback, intervalDuration);
		setIntervalId(id);
	};

	const stop = () => {
		const id = intervalId();
		if (id !== undefined) {
			clearInterval(id);
			setIntervalId(undefined);
		}
	};

	onCleanup(() => {
		const id = intervalId();
		if (id !== undefined) {
			clearInterval(id);
		}
	});

	return { start, stop };
};

const List: Component<{ client: tmi.Client }> = (props) => {
	const [pickedItemIndex, setPickedItemIndex] = createSignal<number>(0);

	const [pickedItemStartTime, setPickedItemStartTime] = createSignal<Date | undefined>();

	const [countdownPercent, setCountdownPercent] = createSignal<number>(100);
	const [countdownSeconds, setCountdownSeconds] = createSignal<number>(SWAP_ITEM_INTERVAL / 1000);

	const [state, setState] = createSignal<"initializing" | "paused" | "running" | "completed">("initializing");

	const [allVotes, setAllVotes] = createSignal<Array<Record<keyof typeof Qualities, number>>>(new Array());
	const [userVotes, setUserVotes] = createSignal<Map<string, keyof typeof Qualities>>(new Map());

	const votes = createMemo(() => {
		return [...(userVotes().values())].reduce((votesCount, vote) => {
			votesCount[vote] = votesCount[vote] + 1;
			return votesCount;
		}, _.clone(InitVotes))
	});

	const [items] = createResource<WorkshopItem[]>(loadList);

	const pickedItem = createMemo<WorkshopItem | undefined>(() => {
		if (isDef(pickedItemIndex) && isDef(items)) {
			return items().at(pickedItemIndex());
		}
		return undefined;
	});

	const previousItem = createMemo<WorkshopItem | undefined>(() => {
		if (isDef(pickedItemIndex) && isDef(items)) {
			return items().at(pickedItemIndex() - 1);
		}
		return undefined;
	});

	const nextItem = createMemo<WorkshopItem | undefined>(() => {
		if (isDef(pickedItemIndex) && isDef(items)) {
			return items().at(pickedItemIndex() + 1);
		}
		return undefined;
	});

	createEffect(() => {
		if (isDef(items)) {
			setAllVotes(new Array(items().length).fill(0).map(() => _.clone(InitVotes)));
		}
	});

	// Chat
	createEffect(() => {
		const fn = (_channel: unknown, user: ChatUserstate, message: string, _client: unknown) => {
			const userId = user["user-id"];

			if (!userId) {
				return;
			}

			const chatWords = message.toLowerCase().split(" ");

			const closestMatch = getClosestMatchingQuality(chatWords);


			if (closestMatch) {
				setUserVotes(userVotes => {
					userVotes.set(userId, closestMatch);
					return new Map(userVotes);
				});
				setAllVotes(allVotes => {
					allVotes[pickedItemIndex()][closestMatch] = allVotes[pickedItemIndex()][closestMatch] + 1;

					return _.clone(allVotes);
				});
			}
		};

		props.client.on("message", fn);

		onCleanup(() => {
			props.client.removeListener("message", fn);
		});
	});

	const updateCountdown = () => {
		if (isDef(pickedItemStartTime) && state() === "running") {
			const start = pickedItemStartTime();
			const now = new Date();
			const ms = SWAP_ITEM_INTERVAL - (now.getTime() - start.getTime());
			const percent = Math.floor((ms / SWAP_ITEM_INTERVAL) * 100);
			setCountdownPercent(Math.max(0, Math.min(100, percent)));
			setCountdownSeconds(
				Math.max(
					0,
					Math.min(
						SWAP_ITEM_INTERVAL / 1000,
						(ms / 1000)
					)
				)
			);
		}
	};

	const { start: startSwapItemInterval, stop: stopSwapItemInterval } = createInterval(() => {
		setPickedItemIndex((index) => {
			if (index !== undefined && isDef(items) && index < items().length - 1) {
				setPickedItemStartTime(new Date());
				return index + 1;
			}
			setState("completed");
			return index;
		});
	}, SWAP_ITEM_INTERVAL);

	let countdownInterval: number | undefined;

	createEffect(() => {
		if (state() === "running") {
			setPickedItemStartTime(new Date());
			countdownInterval = setInterval(updateCountdown, 100);
			startSwapItemInterval();
		} else {
			clearInterval(countdownInterval);
			stopSwapItemInterval();
		}
	});

	createEffect(() => {
		if (!items.loading && isDef(items) && items().length) {
			setState("running");
		}
	});

	createEffect(() => {
		if (state() === "completed") {
			stopSwapItemInterval();
		}

	});

	onCleanup(() => {
		clearInterval(countdownInterval);
		stopSwapItemInterval();
	});

	const pauseOrResume = () => {
		if (state() === "running") {
			setState("paused");
		} else if (state() === "paused") {
			setState("running");
		}
	};

	const setPreviousItem = () => {
		setPickedItemIndex((index) => {
			if (index !== undefined && index > 0) {
				return index - 1;
			}
			return index;
		});
	};

	const setNextItem = () => {
		if (isDef(items)) {
			const itemsList = items();
			setPickedItemIndex((index) => {
				if (index !== undefined && index < itemsList.length - 1) {
					return index + 1;
				}
				return index;
			});
		}
	};

	return (
		<Switch>
			<Match when={items.loading}>
				<div class="h-screen w-screen bg-blue-950 text-white aspect-video  flex flex-row items-center justify-center">
					<p class="font-bold text-xl">Loading...</p>
				</div>
			</Match>
			<Match when={state() === "completed"}>
				{isDef(items) && <Summary items={items()} votes={allVotes()} />}
			</Match>
			<Match when={isDef(pickedItem)}>
				<div class="h-screen w-screen bg-blue-950 text-white aspect-video flex flex-row items-center justify-center">
					{isDef(pickedItem) && (
						<div class="w-full h-full">
							<div
								class="flex items-center justify-between mx-60 h-20"
							>
								<Button class="flex flex-col justify-center items-center font-bold" onclick={setPreviousItem}>
									<p>{"< Previous"}</p>
									<p>{isDef(previousItem) ? previousItem().title : "-"}</p>
								</Button>
								<div>
									<p class="text-center font-bold text-lg">
										{pickedItem().title}
									</p>
									<a
										class="text-center underline text-yellow-100 block"
										href={pickedItem().link}
										target="_blank" rel="noreferrer"
									>
										Visit
									</a>
								</div>
								<Button class="flex flex-col justify-center items-center font-bold" onclick={setNextItem}>
									<p>{"Next >"}</p>
									<p>{isDef(nextItem) ? nextItem().title : "-"}</p>
								</Button>
							</div>
							<Item item={pickedItem()} votes={votes()} />
							<div class="absolute z-20 right-4 top-4 flex flex-row items-center">
								<div class="flex flex-col mr-2 items-end">
									<Button onclick={pauseOrResume} class="mr-2">{state() === "running" ? "Pause" : "Resume"}</Button>
								</div>
								<Countdown percent={countdownPercent()} seconds={countdownSeconds()} />
							</div>
						</div>
					)}
				</div>
			</Match>
		</Switch>
	);
};

export default List;

