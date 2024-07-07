import type { ParentComponent } from "solid-js";

const Button: ParentComponent<{ class?: string, onclick: () => void }> = (props) => {

	return (<button type="button" class={`text-left ${props.class ?? ""}`} onclick={props.onclick}>{props.children}</button>)
};

export default Button;
