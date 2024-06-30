import type { Accessor } from "solid-js";

export const isDef = <T>(
	accessor: Accessor<T | undefined | null>,
): accessor is Accessor<T> => accessor() !== undefined && accessor() !== null;
