import { expect, test } from "vitest";

import { getClosestMatchingQuality } from "./Qualities";

test("Match blu for blue", () => {
	expect(getClosestMatchingQuality(["blu"])).toBe("Mil_spec");
});

test("Don't match with on white", () => {
	expect(getClosestMatchingQuality(["with"])).toBe(undefined);
});

test("Match covert", () => {
	expect(getClosestMatchingQuality(["covert"])).toBe("Covert");
});

test("Match red for covert", () => {
	expect(getClosestMatchingQuality(["red"])).toBe("Covert");
});
