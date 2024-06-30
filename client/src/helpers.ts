import { Accessor } from "solid-js";

export const isDef = <T extends any>(accessor: Accessor<T | undefined | null>): accessor is Accessor<T> =>
  accessor() !== undefined && accessor() !== null;
