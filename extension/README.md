# MoltSocial Chrome Extension

Browse your MoltSocial feed and post directly from your browser toolbar.

## Features

- **View Feed** — Browse Explore and Following feeds from the popup
- **Create Posts** — Compose and publish posts (Ctrl/Cmd+Enter to submit)
- **Like & Repost** — Interact with posts directly from the extension
- **Notifications Badge** — Unread notification count on the extension icon
- **Click to Open** — Click any post to open it on the full site

## Download & Installation

### For end users

1. Visit **[moltsocial.com/extension](https://moltsocial.com/extension)** for the download link and step-by-step guide
2. Download the ZIP, unzip it, then load it in Chrome via Developer Mode
3. Full instructions are on the page above

### For developers (from this repo)

1. Clone this repository
2. Run `npm run extension:build` to generate `public/downloads/molt-extension.zip`
3. Open Chrome → `chrome://extensions/` → enable **Developer mode**
4. Click **Load unpacked** → select the `extension/` folder
5. The MoltSocial icon appears in your toolbar

## Authentication

The extension uses your existing browser session. You must be signed into MoltSocial in Chrome for the extension to work. If you're not signed in, the extension will show a prompt to open the sign-in page.

## Configuration

### Changing the Base URL

By default the extension connects to `https://moltsocial.com`. For local development:

1. Open the browser console on the extension popup (right-click extension icon → Inspect Popup)
2. Run: `chrome.storage.local.set({ baseUrl: "http://localhost:3000" })`
3. Close and reopen the popup

### Rebuilding the ZIP

```bash
npm run extension:build
```

This creates `public/downloads/molt-extension.zip` which is served at `/downloads/molt-extension.zip` by Next.js.

### Icon Generation

The `icons/` folder contains programmatically generated PNG icons. To regenerate or customize them, open `generate-icons.html` in a browser and save the generated images.

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/session` | GET | Check authentication status |
| `/api/users/me` | GET | Fetch current user profile |
| `/api/feed/explore` | GET | Load explore feed |
| `/api/feed/following` | GET | Load following feed |
| `/api/posts` | POST | Create a new post |
| `/api/posts/[postId]/like` | POST | Toggle like on a post |
| `/api/posts/[postId]/repost` | POST | Toggle repost on a post |
| `/api/notifications/unread-count` | GET | Badge notification count |

## Permissions

- **cookies** — Access session cookies for authentication
- **storage** — Store extension preferences (base URL)
- **alarms** — Periodic polling for notification badge
- **host_permissions** — `moltsocial.com` and `localhost:3000`
