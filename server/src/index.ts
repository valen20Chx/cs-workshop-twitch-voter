import express from "express";
import Memcached from "memcached";
import cors from "cors";

import { scrapeWorkshop, WorkshopPageUrl } from "./scraper";

const memcachedClient = new Memcached("127.0.0.1:4001");

const corsOptions = {
	origin: "http://localhost:3000",
	optionsSuccessStatus: 200,
};

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors(corsOptions));

app.get("/scrape", async (_req, res) => {
	try {
		memcachedClient.get("workshop:items", (err, data) => {
			if (err) {
				console.error("Error: Trying to retreive from cache.");
				console.error(err);
			}

			if (data) {
				console.log("Sending from cache");
				res.json(JSON.parse(data));
				return;
			}

			scrapeWorkshop(new WorkshopPageUrl({ appid: "730", page: 1 })).then(
				(items) => {
					memcachedClient.set(
						"workshop:items",
						JSON.stringify(items),
						60 * 30,
						(err, result) => {
							if (err) {
								console.error("Error: Could not cache res");
								console.error(err);
							}
						},
					);
					console.log("Sending data");
					res.json(items);
					return;
				},
			);
		});
	} catch (error) {
		console.error(error);

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
