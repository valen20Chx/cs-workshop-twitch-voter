# CS (Counter-Strike) Workshop Twitch Voter

Preview and vote on trending workshop items with your twitch chat.
![Screenshot 2024-07-01 033314](https://github.com/valen20Chx/cs-workshop-twitch-voter/assets/33943799/d9dea2f9-2592-4e28-906f-5f7917f11ada)
![Screenshot 2024-07-01 033606](https://github.com/valen20Chx/cs-workshop-twitch-voter/assets/33943799/ca5b0185-9895-4280-ac77-e49b278f2a98)


# Stack
## Front
- SolidJS
- Tailwind

## Back (Unused)
- Node (at least v18.19.0, honestly this app is so simple it will surely work on older versions.)
- express
- puppeteer

# Building and running it

You just need to run the SolidJS app in `client/`.

So basically
```bash
cd client
npm ci
npm run start
```

# Info

I removed the use of the server.
I was able to scrape the steam workshop from the front-end (By using a cors proxy).
But this workaround is not 'stable', so I keep the back-end code for now.

# Todo:

- Load items on the loading screen.
- Allow the streamer to pause on a skin.
- Show summary at the end. (Maybe create a case display ?)
- Store 'already seen skins' in local storage to skip them.
- Fix image scaling (When the workshop item's image is low res, there's a weird black border).
- Rework UI when in 'landscape' mode (fullscreen).
- Improve transition between items. (Preload images of next skin ?)

# Contributing

Just msg me, I'll give you PR acces or whatever.
You can also fork it and I'll see after.
IDK how this FOSS works.
