import {
	createEffect,
	createMemo,
	createSignal,
	onCleanup,
	type Component,
} from "solid-js";

import { format } from "date-fns";
import type tmi from "tmi.js";

import { getClosestMatchingQuality, type Qualities } from "./Qualities";
import VoteCount from "./VoteCount";
import type { WorkshopItem } from "./Scraper";

const formatDate = (date: Date): string => {
	return format(date, "yyyy-MM-dd");
};

const initVotes: Record<keyof typeof Qualities, number> = {
	Consumer_grade: 0,
	Industrial_grade: 0,
	Mil_spec: 0,
	Restricted: 0,
	Classified: 0,
	Covert: 0,
}

const Item: Component<{ item: WorkshopItem, client: tmi.Client }> = (props) => {
	const [lastLink, setLastLink] = createSignal<string | undefined>(undefined);
	const [currentImageDisplayed, setCurrentImageDisplayed] = createSignal(1);
	const [votes, setVotes] = createSignal<Record<keyof typeof Qualities, number>>(initVotes);

	const maxVote = createMemo(() => {
		return Math.max(...Object.values(votes()))
	});

	// Reset on skin change
	createEffect(() => {
		if (props.item.link) {
			setVotes(initVotes);

		}
	});

	// Chat
	createEffect(() => {
		props.client.on("message", (_channel, _userState, message, _client) => {
			const chatWords = message.toLowerCase().split(" ");

			const closestMatch = getClosestMatchingQuality(chatWords);

			if (closestMatch) {
				setVotes({
					...votes(),
					[closestMatch]: votes()[closestMatch] + 1,
				});
			}
		});
	});

	// Slide show
	createEffect(() => {
		const sliderEle = document.getElementById("slider");
		if (lastLink() === props.item.link) {
			let interval = -1;

			let index = 0;

			if (sliderEle) {
				interval = setInterval(() => {
					const imagesEles = document.querySelectorAll("#slider img");
					index = (index + 1) % imagesEles.length;
					setCurrentImageDisplayed(index + 1);
					sliderEle.style.transform = `translateX(-${index * 100}%)`;
				}, 1000 * 3);
			}

			onCleanup(() => clearInterval(interval));
		} else {
			setCurrentImageDisplayed(1);
			setLastLink(props.item.link);
			if (sliderEle) sliderEle.style.transform = "";
		}
	});
	const headerHeight = "60px";

	return (
		<div>
			<div
				style={{
					height: headerHeight
				}}
			>
				<p class="text-center font-bold text-lg">{props.item.title}</p>
				<a
					class="text-center underline text-yellow-100 block"
					href={props.item.link}
				>
					Visit
				</a>
			</div>

			<main
				class="flex flex-row items-center flex-1"
				style={{
					height: `calc(100% - ${headerHeight})`
				}}
			>

				<div
					class="flex overflow-x-hidden relative justify-center items-center"
				>
					<div
						id="slider"
						class="flex transition-transform duration-700 ease-in-out"
					>
						{props.item.imagesSrcs.map((src, index) => (
							<img
								src={src}
								class="flex-shrink-0 max-h-full max-w-full object-contain"
								alt={`image-${index + 1}`}
							/>
						))}
					</div>

					<div class="p-2 z-10 absolute bottom-0 right-0">
						<p>
							{currentImageDisplayed()} / {props.item.imagesSrcs.length}
						</p>
					</div>
				</div>

				<div class="p-2 flex flex-col gap-4 w-full">
					<div class="p-2 flex gap-4 w-full">
						<div class="w-64">
							<p class="font-bold">Authors</p>
							{props.item.authors.map(author => <a class="flex mt-4 gap-2 items-center hover:bg-blue-900" href={author.link}>
								<img src={author.imgSrc} alt={`author ${author.name}`} />
								<p>
									{author.name}
								</p>
							</a>)}
						</div>

						<div class="w-64">
							<p class="font-bold">Details</p>
							<p>
								Posted:{" "}
								<span class="font-bold">{formatDate(props.item.postedOn)}</span>
							</p>
							{props.item.updatedOn && <p>
								Updated:{" "}
								<span class="font-bold">{formatDate(props.item.updatedOn)}</span>
							</p>}
						</div>
					</div>

					<div class="w-full">
						<p class="font-bold">Votes (Write in chat to vote)</p>
						<VoteCount votes={votes()} maxVote={maxVote()} />
					</div>
				</div>
			</main>
		</div>
	);
};

export default Item;
