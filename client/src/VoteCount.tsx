import { createMemo, type Component } from "solid-js";
import { Qualities, type Quality, type QualityKey } from "./Qualities";

const Bar: Component<{ quality: Quality; votes: number; maxVote: number }> = (props) => {
	const lineWidth = createMemo(() => Math.max(0, props.votes / props.maxVote) * 100);

	return <div class="flex items-center gap-1">
		<div class="h-2 w-2 rounded-full" style={{
			background: props.quality.color,
		}} />
		<div>
			<p class="w-max">{props.quality.label} : <span class="font-bold">{props.votes}</span></p>
		</div>
		<div class="h-2 min-w-2 rounded-full" style={{
			background: props.quality.color,
			width: props.maxVote
				? `${lineWidth()}%`
				: "0%"
		}} />
	</div>;
}

const VoteCount: Component<{ votes: Record<QualityKey, number>; maxVote: number }> = (props) => {
	return <div class="w-full flex flex-col gap-1">
		{[...Object.entries(Qualities)].map(([key, quality]) => {
			return <Bar quality={quality} maxVote={props.maxVote} votes={props.votes[key as QualityKey]} />
		})}
	</div>;
}

export default VoteCount;
