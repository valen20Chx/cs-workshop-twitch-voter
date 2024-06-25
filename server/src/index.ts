import express from "express";
import { scrapeWorkshop, WorkshopPageUrl } from "./scraper";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/scrape", async (_req, res) => {
	try {
		const items = await scrapeWorkshop(
			new WorkshopPageUrl({ appid: "730", page: 1 }),
		);
		res.json(items);
	} catch (error) {
		console.error(
			`${(error as unknown as Record<string, unknown>).toString()}`,
		);

		if (error instanceof Error) {
			res.status(500).send(error.toString());
		} else {
			res.status(500).send("Unexpected error");
		}
	}
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
