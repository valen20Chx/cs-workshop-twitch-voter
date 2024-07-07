import { createSignal, onCleanup } from 'solid-js';

const createInterval = (callback: () => void, intervalDuration: number) => {
	const [intervalId, setIntervalId] = createSignal<number | undefined>(undefined);

	const start = () => {
		if (intervalId()) return; // Prevent multiple intervals
		callback(); // Run the callback immediately on start
		const id = setInterval(callback, intervalDuration);
		setIntervalId(id);
	};

	const stop = () => {
		clearInterval(intervalId());
		setIntervalId(undefined);
	};

	onCleanup(() => clearInterval(intervalId()));

	return { start, stop };
};

export default createInterval;

