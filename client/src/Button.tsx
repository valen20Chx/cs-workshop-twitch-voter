import type { Component } from "solid-js";

const Button: Component<{ text: string, class?: string, onclick: () => void }> = (props) => {

	return (<button type="button" class={`text-left ${props.class ?? ""}`} onclick={props.onclick}>{props.text}</button>)
};

export default Button;
