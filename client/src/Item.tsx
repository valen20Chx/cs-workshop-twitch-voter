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

const formatDate = (dateStr: string): string => {
	return format(dateStr, "yyyy-MM-dd");
};

export interface IItem {
	title: string;
	link: string;
	thumbnail: string;
	author: {
		name: string;
		link: string;
	};
	authorImgSrc: string;
	postedOn: string;
	updatedOn: string;
	imagesSrcs: string[];
}

const initVotes: Record<keyof typeof Qualities, number> = {
	Consumer_grade: 0,
	Industrial_grade: 0,
	Mil_spec: 0,
	Restricted: 0,
	Classified: 0,
	Covert: 0,
}

const Item: Component<{ item: IItem, client: tmi.Client }> = (props) => {
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

	return (
		<div>
			<p class="text-center font-bold text-lg">{props.item.title}</p>
			<a
				class="text-center underline text-yellow-100 block"
				href={props.item.link}
			>
				Visit
			</a>

			<div class="flex overflow-x-hidden relative w-full">
				<div
					id="slider"
					class="flex transition-transform duration-700 ease-in-out"
				>
					{props.item.imagesSrcs.map((src, index) => (
						<img
							src={src}
							class="w-full flex-shrink-0"
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

			<div class="p-2 flex gap-4 w-full">
				<div>
					<p class="font-bold">Author</p>
					<p>
						<a class="underline text-yellow-100" href={props.item.author.link}>
							{props.item.author.name}
						</a>
					</p>
				</div>

				<div class="w-52">
					<p class="font-bold">Details</p>
					<p>
						Posted:{" "}
						<span class="font-bold">{formatDate(props.item.postedOn)}</span>
					</p>
					<p>
						Updated:{" "}
						<span class="font-bold">{formatDate(props.item.updatedOn)}</span>
					</p>
				</div>

				<div class="w-full">
					<p class="font-bold">Votes (Write in chat to vote)</p>
					<VoteCount votes={votes()} maxVote={maxVote()} />
				</div>
			</div>
		</div>
	);
};

export default Item;
