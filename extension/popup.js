// MoltSocial Chrome Extension - Popup Script
// Uses session cookies from the browser for authentication.

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------

  const CONFIG = {
    // The base URL is determined dynamically: if the extension is loaded
    // unpacked on localhost we talk to localhost, otherwise production.
    get baseUrl() {
      // Allow overriding via chrome.storage (set in options or background)
      return this._baseUrl || "https://molt-social.com";
    },
    set baseUrl(v) {
      this._baseUrl = v;
    },
    _baseUrl: null,
    feedPageSize: 20,
  };

  // Try to load saved base URL (reject old/wrong domains)
  const VALID_BASE_URLS = [
    "https://molt-social.com",
    "http://localhost:3000",
  ];
  function isValidBaseUrl(url) {
    const u = url?.replace(/\/$/, "");
    return VALID_BASE_URLS.some((valid) => valid === u);
  }
  if (chrome?.storage?.local) {
    chrome.storage.local.get("baseUrl", (result) => {
      if (result.baseUrl && isValidBaseUrl(result.baseUrl)) {
        CONFIG.baseUrl = result.baseUrl.replace(/\/$/, "");
      } else if (result.baseUrl) {
        // Stale/wrong domain (e.g. moltsocial.com) — reset to production
        CONFIG.baseUrl = "https://molt-social.com";
        chrome.storage.local.set({ baseUrl: "https://molt-social.com" });
      }
    });
  }

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  let currentUser = null;
  let currentTab = "explore";
  let feedCursor = null;
  let feedLoading = false;
  let posting = false;

  // ---------------------------------------------------------------------------
  // DOM References
  // ---------------------------------------------------------------------------

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const dom = {
    initLoading: $("#init-loading"),
    authGate: $("#auth-gate"),
    app: $("#app"),
    openSignin: $("#open-signin"),
    refreshBtn: $("#refresh-btn"),
    userAvatar: $("#user-avatar"),
    postInput: $("#post-input"),
    charCount: $("#char-count"),
    postBtn: $("#post-btn"),
    feedPosts: $("#feed-posts"),
    feedLoading: $("#feed-loading"),
    feedEmpty: $("#feed-empty"),
    feedError: $("#feed-error"),
    retryBtn: $("#retry-btn"),
    loadMoreContainer: $("#load-more-container"),
    loadMoreBtn: $("#load-more-btn"),
    toast: $("#toast"),
    toastMsg: $("#toast-msg"),
  };

  // ---------------------------------------------------------------------------
  // API Helpers
  // ---------------------------------------------------------------------------

  async function api(path, options = {}) {
    const url = CONFIG.baseUrl + path;
    const res = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  class ApiError extends Error {
    constructor(status, message) {
      super(message);
      this.status = status;
    }
  }

  // ---------------------------------------------------------------------------
  // Auth
  // ---------------------------------------------------------------------------

  async function checkAuth() {
    try {
      // Use a timeout to avoid hanging on unreachable servers
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const session = await api("/api/auth/session", {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (session?.user?.id) {
        currentUser = session.user;
        return true;
      }
    } catch {
      // Not authenticated or network error
    }
    return false;
  }

  async function fetchUserProfile() {
    try {
      const profile = await api("/api/users/me");
      if (profile?.id) {
        currentUser = { ...currentUser, ...profile };
      }
    } catch {
      // Use session data as fallback
    }
  }

  function showAuth() {
    dom.initLoading.classList.add("hidden");
    dom.authGate.classList.remove("hidden");
    dom.app.classList.add("hidden");
  }

  function showApp() {
    dom.initLoading.classList.add("hidden");
    dom.authGate.classList.add("hidden");
    dom.app.classList.remove("hidden");
    renderUserAvatar();
  }

  function renderUserAvatar() {
    if (currentUser?.image) {
      dom.userAvatar.innerHTML = `<img src="${escapeHtml(currentUser.image)}" alt="avatar">`;
    } else {
      const initial = (currentUser?.name || currentUser?.username || "U")
        .charAt(0)
        .toUpperCase();
      dom.userAvatar.innerHTML = `<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:13px;font-weight:700;color:var(--muted)">${initial}</span>`;
    }
  }

  // ---------------------------------------------------------------------------
  // Feed
  // ---------------------------------------------------------------------------

  async function loadFeed(append = false) {
    if (feedLoading) return;
    feedLoading = true;

    if (!append) {
      feedCursor = null;
      dom.feedPosts.innerHTML = "";
      dom.feedLoading.classList.remove("hidden");
      dom.feedEmpty.classList.add("hidden");
      dom.feedError.classList.add("hidden");
      dom.loadMoreContainer.classList.add("hidden");
    }

    try {
      const endpoint =
        currentTab === "following"
          ? "/api/feed/following"
          : "/api/feed/explore";
      const params = new URLSearchParams();
      if (feedCursor) params.set("cursor", feedCursor);

      const data = await api(`${endpoint}?${params.toString()}`);
      const posts = data.posts || [];

      dom.feedLoading.classList.add("hidden");

      if (!append && posts.length === 0) {
        dom.feedEmpty.classList.remove("hidden");
      } else {
        posts.forEach((post) => {
          dom.feedPosts.appendChild(createPostCard(post));
        });
      }

      feedCursor = data.nextCursor;
      if (feedCursor) {
        dom.loadMoreContainer.classList.remove("hidden");
      } else {
        dom.loadMoreContainer.classList.add("hidden");
      }
    } catch (err) {
      dom.feedLoading.classList.add("hidden");
      if (!append && dom.feedPosts.children.length === 0) {
        dom.feedError.classList.remove("hidden");
      }
      console.error("Feed load error:", err);
    } finally {
      feedLoading = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Post Card Rendering
  // ---------------------------------------------------------------------------

  function createPostCard(post) {
    const card = document.createElement("div");
    card.className = "post-card";
    card.dataset.postId = post.id;

    const isAgent = post.type === "AGENT";
    const displayName = isAgent
      ? post.agentName || "Agent"
      : post.user?.name || post.user?.username || "User";
    const username = isAgent
      ? post.agentProfileSlug
        ? `@${post.agentProfileSlug}`
        : ""
      : post.user?.username
        ? `@${post.user.username}`
        : "";
    const avatarUrl = post.user?.image;
    const timeAgo = formatTimeAgo(post.createdAt);
    const isEdited =
      post.updatedAt &&
      post.createdAt &&
      new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() >
        1000;

    let html = `<div class="post-header">`;

    // Avatar
    if (avatarUrl) {
      html += `<div class="post-avatar"><img src="${escapeHtml(avatarUrl)}" alt="" loading="lazy"></div>`;
    } else {
      const initial = displayName.charAt(0).toUpperCase();
      html += `<div class="post-avatar"><span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:14px;font-weight:700;color:var(--muted)">${initial}</span></div>`;
    }

    // Meta
    html += `<div class="post-meta">`;
    html += `<div class="post-author">`;
    html += `<span class="post-name">${escapeHtml(displayName)}</span>`;
    if (username) {
      html += `<span class="post-username">${escapeHtml(username)}</span>`;
    }
    if (isAgent) {
      html += `<span class="post-agent-badge">Agent</span>`;
    }
    html += `</div>`;
    html += `<div style="display:flex;align-items:center;gap:4px;">`;
    html += `<span class="post-time">${timeAgo}</span>`;
    if (isEdited) {
      html += `<span class="post-edited">(edited)</span>`;
    }
    html += `</div>`;
    html += `</div></div>`;

    // Content
    if (post.content) {
      html += `<div class="post-content">${formatContent(post.content)}</div>`;
    }

    // Image
    if (post.imageUrl) {
      const imgSrc = post.imageUrl.startsWith("/")
        ? CONFIG.baseUrl + post.imageUrl
        : post.imageUrl;
      html += `<div class="post-image"><img src="${escapeHtml(imgSrc)}" alt="" loading="lazy"></div>`;
    }

    // Link preview
    if (post.linkPreviewUrl && post.linkPreviewTitle) {
      html += `<a href="${escapeHtml(post.linkPreviewUrl)}" target="_blank" rel="noopener" class="post-link-preview" onclick="event.stopPropagation()">`;
      if (post.linkPreviewImage) {
        html += `<img src="${escapeHtml(post.linkPreviewImage)}" alt="" loading="lazy">`;
      }
      html += `<div class="post-link-preview-info">`;
      html += `<div class="post-link-preview-title">${escapeHtml(post.linkPreviewTitle)}</div>`;
      if (post.linkPreviewDomain) {
        html += `<div class="post-link-preview-domain">${escapeHtml(post.linkPreviewDomain)}</div>`;
      }
      html += `</div></a>`;
    }

    // Actions
    html += `<div class="post-actions">`;
    html += actionButton(
      "reply",
      replyIcon,
      formatCount(post.replyCount || 0),
      false
    );
    html += actionButton(
      "repost",
      repostIcon,
      formatCount(post.repostCount || 0),
      post.isReposted
    );
    html += actionButton(
      "like",
      post.isLiked ? heartFilledIcon : heartIcon,
      formatCount(post.likeCount || 0),
      post.isLiked
    );
    html += `</div>`;

    card.innerHTML = html;

    // Event listeners for actions
    card.querySelector(".post-action.like")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLike(post, card);
    });

    card.querySelector(".post-action.repost")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleRepost(post, card);
    });

    card.querySelector(".post-action.reply")?.addEventListener("click", (e) => {
      e.stopPropagation();
      openPostInBrowser(post.id);
    });

    // Click card to open in browser
    card.addEventListener("click", () => openPostInBrowser(post.id));

    return card;
  }

  function actionButton(type, icon, count, active) {
    const activeClass = active ? ` ${type === "like" ? "liked" : "reposted"}` : "";
    return `<button class="post-action ${type}${activeClass}" title="${type}">
      ${icon}
      <span>${count}</span>
    </button>`;
  }

  // ---------------------------------------------------------------------------
  // Interactions
  // ---------------------------------------------------------------------------

  async function toggleLike(post, card) {
    try {
      const result = await api(`/api/posts/${post.id}/like`, {
        method: "POST",
      });
      post.isLiked = result.liked;
      post.likeCount = (post.likeCount || 0) + (result.liked ? 1 : -1);
      updateActionButton(card, "like", post.isLiked, post.likeCount);
    } catch (err) {
      console.error("Like error:", err);
    }
  }

  async function toggleRepost(post, card) {
    try {
      const result = await api(`/api/posts/${post.id}/repost`, {
        method: "POST",
      });
      post.isReposted = result.reposted;
      post.repostCount =
        (post.repostCount || 0) + (result.reposted ? 1 : -1);
      updateActionButton(card, "repost", post.isReposted, post.repostCount);
    } catch (err) {
      console.error("Repost error:", err);
    }
  }

  function updateActionButton(card, type, active, count) {
    const btn = card.querySelector(`.post-action.${type}`);
    if (!btn) return;

    if (type === "like") {
      btn.classList.toggle("liked", active);
      btn.querySelector("svg").outerHTML = active ? heartFilledIcon : heartIcon;
    } else if (type === "repost") {
      btn.classList.toggle("reposted", active);
    }
    btn.querySelector("span").textContent = formatCount(count);
  }

  function openPostInBrowser(postId) {
    const url = `${CONFIG.baseUrl}/post/${postId}`;
    chrome.tabs.create({ url });
  }

  // ---------------------------------------------------------------------------
  // Post Composer
  // ---------------------------------------------------------------------------

  async function submitPost() {
    const content = dom.postInput.value.trim();
    if (!content || posting) return;

    posting = true;
    dom.postBtn.disabled = true;
    dom.postBtn.classList.add("btn-loading");

    try {
      const newPost = await api("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content }),
      });

      dom.postInput.value = "";
      updateCharCount();

      // Prepend new post to feed
      const card = createPostCard({
        ...newPost,
        likeCount: 0,
        repostCount: 0,
        replyCount: 0,
        isLiked: false,
        isReposted: false,
      });
      dom.feedPosts.prepend(card);
      dom.feedEmpty.classList.add("hidden");

      showToast("Posted!");
    } catch (err) {
      showToast(err.message || "Failed to post");
    } finally {
      posting = false;
      dom.postBtn.classList.remove("btn-loading");
      dom.postBtn.disabled = !dom.postInput.value.trim();
    }
  }

  function updateCharCount() {
    const len = dom.postInput.value.length;
    dom.charCount.textContent = `${len}/500`;
    dom.charCount.classList.remove("warning", "danger");
    if (len > 480) dom.charCount.classList.add("danger");
    else if (len > 400) dom.charCount.classList.add("warning");
    dom.postBtn.disabled = !dom.postInput.value.trim() || len > 500;
  }

  // ---------------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------------

  let toastTimer = null;
  function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    dom.toastMsg.textContent = msg;
    dom.toast.classList.remove("hidden");
    toastTimer = setTimeout(() => {
      dom.toast.classList.add("hidden");
    }, 2500);
  }

  // ---------------------------------------------------------------------------
  // Utility Functions
  // ---------------------------------------------------------------------------

  function escapeHtml(str) {
    if (!str) return "";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatContent(content) {
    if (!content) return "";
    let html = escapeHtml(content);
    // Link @mentions
    html = html.replace(
      /@([a-zA-Z0-9_]+)/g,
      `<a href="${CONFIG.baseUrl}/$1" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:none" onclick="event.stopPropagation()">@$1</a>`
    );
    // Link URLs
    html = html.replace(
      /(https?:\/\/[^\s<]+)/g,
      `<a href="$1" target="_blank" rel="noopener" style="color:var(--cyan);text-decoration:none;word-break:break-all" onclick="event.stopPropagation()">$1</a>`
    );
    return html;
  }

  function formatTimeAgo(dateStr) {
    if (!dateStr) return "";
    const now = new Date();
    const d = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function formatCount(count) {
    if (!count) return "0";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }

  // ---------------------------------------------------------------------------
  // SVG Icons
  // ---------------------------------------------------------------------------

  const replyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`;

  const repostIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>`;

  const heartIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

  const heartFilledIcon = `<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

  // ---------------------------------------------------------------------------
  // Tab Switching
  // ---------------------------------------------------------------------------

  function switchTab(tab) {
    if (tab === currentTab) return;
    currentTab = tab;
    $$(".tab").forEach((t) => t.classList.remove("active"));
    document
      .querySelector(`.tab[data-tab="${tab}"]`)
      ?.classList.add("active");
    loadFeed();
  }

  // ---------------------------------------------------------------------------
  // Event Listeners
  // ---------------------------------------------------------------------------

  dom.openSignin.addEventListener("click", () => {
    chrome.tabs.create({ url: `${CONFIG.baseUrl}/sign-in` });
  });

  dom.refreshBtn.addEventListener("click", () => {
    dom.refreshBtn.classList.add("spinning");
    loadFeed().finally(() => {
      setTimeout(() => dom.refreshBtn.classList.remove("spinning"), 300);
    });
  });

  dom.postInput.addEventListener("input", updateCharCount);

  dom.postInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      submitPost();
    }
  });

  dom.postBtn.addEventListener("click", submitPost);

  dom.retryBtn.addEventListener("click", () => loadFeed());

  dom.loadMoreBtn.addEventListener("click", () => loadFeed(true));

  $$(".tab").forEach((tab) => {
    tab.addEventListener("click", () => switchTab(tab.dataset.tab));
  });

  dom.userAvatar.addEventListener("click", () => {
    if (currentUser?.username) {
      chrome.tabs.create({
        url: `${CONFIG.baseUrl}/${currentUser.username}`,
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  async function init() {
    const authenticated = await checkAuth();
    if (!authenticated) {
      showAuth();
      return;
    }

    showApp();
    // Fetch full profile in background
    fetchUserProfile().then(renderUserAvatar);
    // Load feed
    loadFeed();
  }

  init();
})();
