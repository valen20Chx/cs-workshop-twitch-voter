import { createSignal, Match, Switch, type Component } from "solid-js";

import tmi from "tmi.js";

import List from "./List";
import { isDef } from "./helpers";

enum State {
	new = 0,
	ready = 1,
};

const App: Component = () => {
	const [channelName, setChannelName] = createSignal("");
	const [state, setState] = createSignal(State.new);
	const [twitchClient, setTwitchClient] = createSignal<tmi.Client | undefined>();

	const loginToChat = () => {
		if (!channelName()) {
			return;
		}

		const client = new tmi.Client({
			connection: {
				reconnect: true,
				secure: true,
			},
			channels: [channelName()]
		});

		client.connect().then(() => {
			setTwitchClient(client);
			setState(State.ready);
		}).catch(err => {
			console.error(err);
			setTwitchClient(undefined);
			setState(State.new);
		});
	}

	return (
		<div class="h-screen w-screen bg-blue-950 text-white aspect-video">
			<Switch fallback={"Dev is shiet. Should not happen"}>
				<Match when={state() === State.ready}>
					{isDef(twitchClient) && <List client={twitchClient()} />}
				</Match>
				<Match when={state() === State.new}>
					<div class="h-full flex flex-col justify-center items-center center">
						<p class="font-bold">Twich channel</p>
						<input type="text" class="text-black p-1" autofocus onchange={(text) => setChannelName(text.target.value)} />
						<button onclick={() => loginToChat()} type="button" class="mt-2 bg-blue-400 text-blue-950 p-1 font-bold rounded hover:bg-blue-500">Start</button>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default App;
