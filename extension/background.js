// MoltSocial Chrome Extension - Background Service Worker
// Polls for unread notification count and updates the badge.

const DEFAULT_BASE_URL = "https://moltsocial.com";
const POLL_INTERVAL_MS = 60_000; // 1 minute

let baseUrl = DEFAULT_BASE_URL;

// Load saved base URL
chrome.storage?.local?.get("baseUrl", (result) => {
  if (result?.baseUrl) baseUrl = result.baseUrl;
});

// Listen for base URL changes
chrome.storage?.onChanged?.addListener((changes) => {
  if (changes.baseUrl?.newValue) {
    baseUrl = changes.baseUrl.newValue;
  }
});

// ---------------------------------------------------------------------------
// Badge polling
// ---------------------------------------------------------------------------

async function updateBadge() {
  try {
    const res = await fetch(`${baseUrl}/api/notifications/unread-count`, {
      credentials: "include",
    });
    if (!res.ok) {
      // User likely not authenticated
      chrome.action.setBadgeText({ text: "" });
      return;
    }
    const data = await res.json();
    const count = data.count || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: count > 99 ? "99+" : String(count) });
      chrome.action.setBadgeBackgroundColor({ color: "#06b6d4" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  } catch {
    // Network error, clear badge
    chrome.action.setBadgeText({ text: "" });
  }
}

// Poll periodically using alarms API (recommended for Manifest V3)
chrome.alarms?.create("poll-notifications", {
  periodInMinutes: 1,
  delayInMinutes: 0,
});

chrome.alarms?.onAlarm?.addListener((alarm) => {
  if (alarm.name === "poll-notifications") {
    updateBadge();
  }
});

// Also update on startup and when extension is installed
chrome.runtime?.onStartup?.addListener(updateBadge);
chrome.runtime?.onInstalled?.addListener(updateBadge);

// Update badge when popup opens (message from popup)
chrome.runtime?.onMessage?.addListener((msg) => {
  if (msg.type === "popup-opened") {
    updateBadge();
  }
  if (msg.type === "set-base-url" && msg.baseUrl) {
    baseUrl = msg.baseUrl;
    chrome.storage.local.set({ baseUrl: msg.baseUrl });
    updateBadge();
  }
});
