# MCL Player Auction: standalone site

Three separate pages, no Claude needed:

| Who | Page | Access |
|---|---|---|
| Audience | `audience.html` | Anyone with the link, watch only |
| Bidders (captains) | `bidder.html` | Link + that team's captain code |
| Auctioneer | `auctioneer.html` | Email + password (only you) |

Each page contains only its own view, with no menu or switch to another view. The site is static files (GitHub Pages) and the live data is stored in a free Firebase Realtime Database.

