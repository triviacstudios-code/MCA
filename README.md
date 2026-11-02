# MCL Player Auction: standalone site

Three separate pages, no Claude needed:

| Who | Page | Access |
|---|---|---|
| Audience | `audience.html` | Anyone with the link, watch only |
| Bidders (captains) | `bidder.html` | Link + that team's captain code |
| Auctioneer | `auctioneer.html` | Email + password (only you) |

Each page contains only its own view, with no menu or switch to another view. The site is static files (GitHub Pages) and the live data is stored in a free Firebase Realtime Database.

## Setup (about 15 minutes, all free)

### 1. Create the database (Firebase)
1. Go to https://console.firebase.google.com and create a project (turn Analytics off).
2. **Build → Realtime Database → Create database** (pick a nearby region, e.g. Singapore; start in *locked mode*).
3. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
4. In **Authentication → Users → Add user**, create your auctioneer login (email + password). Copy the **User UID** shown in the list.
5. **Realtime Database → Rules**: paste the contents of `database.rules.json`, replace every `PASTE_AUCTIONEER_UID` with your UID, then **Publish**. These rules are what keep the auction safe: only you can change the auction, and a bid is only accepted with the right captain code.
6. **Project settings (gear) → Your apps → Web (</>)**: register an app, copy the config values, and paste them into `firebase-config.js`. Make sure `databaseURL` is filled in (it is on the Realtime Database page).

### 2. Publish the site (GitHub Pages)
1. Create a GitHub repository (public) and upload everything in this folder, keeping the `photos` and `logos` folders.
2. **Settings → Pages → Build from branch → main / root → Save.**
3. After a minute your links are:
   - `https://YOURNAME.github.io/REPO/audience.html`
   - `https://YOURNAME.github.io/REPO/bidder.html`
   - `https://YOURNAME.github.io/REPO/auctioneer.html`

(Netlify or Cloudflare Pages also work: drag the folder in.)

## Running the auction
1. Open `auctioneer.html` and sign in.
2. **Setup & import:** enter team names, budget and timer. Paste the players from your Google Form responses Sheet (Name, Expertise Level, optional Photo), then **Start fresh**.
3. **📨 Invite messages** gives ready-to-send WhatsApp messages: the audience link for everyone, and for each captain the bidder link plus their own code.
4. Use **Next random player**, **Bring on**, **Hammer down now**. **📋 Team-wise backup** copies the squads for pasting into a Google Sheet.

## Photos and logos
- **Easiest:** put images in `photos/` named after the player (`karan-singh.jpg`) and in `logos/` named after the team (`m-town-united.png`). Lowercase, spaces become dashes. They appear automatically; if a file is missing the initials are shown.
- Or click 📷 (player) / 🖼 (team) on the auctioneer page and paste an image link or a path like `photos/karan.jpg`.
- Google Form upload links are private, so they won't show. Download the photos and put them in `photos/` instead.

## Things to know
- **Keep the auctioneer tab open.** It runs the countdown and approves bids as captains send them (usually under a second).
- **Security:** anyone can *watch*. Only valid captain codes can bid, and only your Firebase login can run the auction. The Firebase config values in `firebase-config.js` are meant to be public. The rules protect the data. If you change teams (Start fresh), captain codes change and you need to resend them.
- Data from the old Claude-hosted version does not carry over. Start with a fresh setup.
