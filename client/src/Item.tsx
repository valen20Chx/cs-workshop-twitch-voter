import {
	createEffect,
	createMemo,
	createSignal,
	onCleanup,
	type Component,
} from "solid-js";

import { format } from "date-fns";

import type { Qualities } from "./Qualities";
import VoteCount from "./VoteCount";
import type { WorkshopItem } from "./Scraper";

const formatDate = (date: Date): string => {
	return format(date, "yyyy-MM-dd");
};

const Item: Component<{ item: WorkshopItem, votes: Record<keyof typeof Qualities, number> }> = (props) => {
	const [lastLink, setLastLink] = createSignal<string | undefined>(undefined);
	const [currentImageDisplayed, setCurrentImageDisplayed] = createSignal(1);

	const maxVote = createMemo(() => {
		return Math.max(...Object.values(props.votes))
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
			<main
				class="flex flex-row items-center flex-1"
				style={{
					height: "calc(100% - 80px)"
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
							{props.item.authors.map(author => <a class="flex mt-4 gap-2 items-center hover:bg-blue-900" href={author.link} target="_blank" rel="noreferrer" >
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
						<VoteCount votes={props.votes} maxVote={maxVote()} />
					</div>
				</div>
			</main>
		</div>
	);
};

export default Item;
