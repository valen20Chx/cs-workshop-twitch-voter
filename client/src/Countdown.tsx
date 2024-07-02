import { createEffect, type Component } from "solid-js";

const Countdown: Component<{ percent: number; seconds: number; class?: string; }> = (props) => {
	createEffect(() => {
		const circleEle = document.getElementById("circle");

		if (circleEle) {
			circleEle.style.strokeDasharray = `${props.percent}, 100`;
		}
	});

	return (
		<div
			style={{
				width: "100px",
				height: "100px",
				border: "10px solid white",
				"box-sizing": "border-box",
				animation: "countdown 10s linear infinite",
			}}
			class={`bg-sky-400 rounded-full flex items-center justify-center ${props.class ?? ""}`}
		>
			<p class="text-blue-950 font-bold text-2xl">{props.seconds}</p>
			<svg id="countdown" viewBox="0 0 36 36" style={{
				position: "absolute",
				width: "100px",
				height: "100px",
				transform: "scaleX(-1)"
			}}>
				<title>Countdown</title>
				<path
					style={{
						fill: "none",
						stroke: "#eee",
						"stroke-width": "4"
					}}
					d="M18 2.0845
						a 15.9155 15.9155 0 0 1 0 31.831
						a 15.9155 15.9155 0 0 1 0 -31.831"
				/>
				<path id="circle"
					style={{
						fill: "none",
						stroke: "red",
						"stroke-width": "3",
						"stroke-linecap": "round",
						transition: "stroke-dasharray 0.5s",
						"stroke-dasharray": "100, 100"
					}}
					d="M18 2.0845
						a 15.9155 15.9155 0 0 1 0 31.831
						a 15.9155 15.9155 0 0 1 0 -31.831"
				/>
			</svg>
		</div>
	);
};

export default Countdown;
