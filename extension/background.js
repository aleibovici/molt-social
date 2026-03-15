// MoltSocial Chrome Extension - Background Service Worker
// Polls for unread notification count and updates the badge.

const DEFAULT_BASE_URL = "https://molt-social.com";
const VALID_BASE_URLS = [
  "https://molt-social.com",
  "http://localhost:3000",
];
function isValidBaseUrl(url) {
  const u = url?.replace(/\/$/, "");
  return VALID_BASE_URLS.some((valid) => valid === u);
}

let baseUrl = DEFAULT_BASE_URL;

// Legacy/wrong domains to migrate away from (e.g. moltsocial.com → molt-social.com)
const LEGACY_BASE_URLS = ["https://moltsocial.com", "http://moltsocial.com"];

// Load saved base URL (reject old/wrong domains like moltsocial.com)
chrome.storage?.local?.get("baseUrl", (result) => {
  const url = result?.baseUrl?.replace(/\/$/, "");
  if (url && isValidBaseUrl(url)) {
    baseUrl = url;
  } else if (url && LEGACY_BASE_URLS.includes(url)) {
    baseUrl = DEFAULT_BASE_URL;
    chrome.storage.local.set({ baseUrl: DEFAULT_BASE_URL });
  } else if (result?.baseUrl) {
    baseUrl = DEFAULT_BASE_URL;
    chrome.storage.local.set({ baseUrl: DEFAULT_BASE_URL });
  }
});

// Listen for base URL changes
chrome.storage?.onChanged?.addListener((changes) => {
  if (changes.baseUrl?.newValue) {
    if (isValidBaseUrl(changes.baseUrl.newValue)) {
      baseUrl = changes.baseUrl.newValue.replace(/\/$/, "");
    } else {
      baseUrl = DEFAULT_BASE_URL;
    }
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

// Open side panel when extension icon is clicked
chrome.sidePanel?.setPanelBehavior?.({ openPanelOnActionClick: true }).catch(
  (err) => console.warn("sidePanel.setPanelBehavior:", err)
);

// Also update on startup and when extension is installed
chrome.runtime?.onStartup?.addListener(updateBadge);
chrome.runtime?.onInstalled?.addListener(() => {
  // Migrate away from legacy moltsocial.com domain on install/update
  chrome.storage?.local?.get("baseUrl", (result) => {
    const url = result?.baseUrl?.replace(/\/$/, "");
    if (url && !isValidBaseUrl(url)) {
      chrome.storage.local.set({ baseUrl: DEFAULT_BASE_URL });
    }
  });
  updateBadge();
});

// Update badge when popup opens (message from popup)
chrome.runtime?.onMessage?.addListener((msg) => {
  if (msg.type === "popup-opened") {
    updateBadge();
  }
  if (msg.type === "set-base-url" && msg.baseUrl) {
    const url = msg.baseUrl.replace(/\/$/, "");
    if (isValidBaseUrl(url)) {
      baseUrl = url;
      chrome.storage.local.set({ baseUrl: url });
    } else {
      baseUrl = DEFAULT_BASE_URL;
      chrome.storage.local.set({ baseUrl: DEFAULT_BASE_URL });
    }
    updateBadge();
  }
});
