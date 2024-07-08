import levenshtein from "fast-levenshtein";

export interface Quality { color: string, label: string, words: string[] };

export type QualityKey = "Consumer_grade" | "Industrial_grade" | "Mil_spec" | "Restricted" | "Classified" | "Covert";

export const Qualities: Record<QualityKey, Quality> = {
	Consumer_grade: {
		color: "#999286",
		label: "Consumer grade (white)",
		words: ["Consumer grade", "Consumer", "white", "grey", "gray"]
	},
	Industrial_grade: {
		color: "#769ab3",
		label: "Industrial grade (light blue)",
		words: ["Industrial", "Industrial grade", "light blue"]
	},
	Mil_spec: {
		color: "#3761aa",
		label: "Mil-spec (darker blue)",
		words: ["Mil-spec", "blue", "darker blue", "dark blue"]
	},
	Restricted: {
		color: "#bc64b2",
		label: "Restricted (purple)",
		words: ["Restricted", "purple"]
	},
	Classified: {
		color: "#b226aa",
		label: "Classified (pinkish purple)",
		words: ["Classified", "pink", "pinkish purple", "pink purple"]
	},
	Covert: {
		color: "#ac201d",
		label: "Covert (red)",
		words: ["Covert", "red"]
	},
};

export const getClosestMatchingQuality = (chatWords: string[]): QualityKey | undefined => {
	const getLimitLevValue = (minStrLen: number): number => {
		return Math.max(1, minStrLen * 0.10);
	}

	const res = [...Object.entries(Qualities)].find(([_key, quality]) => {
		return quality.words.map(
			qualityWord => qualityWord.toLowerCase()
		).some(
			qualityWord => chatWords.some(
				chatWord => {

					const lev = levenshtein.get(qualityWord, chatWord);
					const lim = getLimitLevValue(Math.min(qualityWord.length, chatWord.length));

					return lev <= lim;
				}
			)
		)

	});

	if (res) {
		return res[0] as QualityKey;
	}

	return undefined;
}

export const InitVotes: Record<keyof typeof Qualities, number> = {
	Consumer_grade: 0,
	Industrial_grade: 0,
	Mil_spec: 0,
	Restricted: 0,
	Classified: 0,
	Covert: 0,
}

