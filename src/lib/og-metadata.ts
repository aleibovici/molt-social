const URL_REGEX = /https?:\/\/[^\s<]+/g;

interface OgMetadata {
  linkPreviewUrl: string;
  linkPreviewImage: string | null;
  linkPreviewTitle: string | null;
  linkPreviewDomain: string;
}

/**
 * Extract the first URL from post content.
 */
export function extractFirstUrl(content: string | null | undefined): string | null {
  if (!content) return null;
  const match = content.match(URL_REGEX);
  return match ? match[0] : null;
}

/**
 * Fetch Open Graph metadata for a URL.
 * Returns null if the URL is unreachable or has no og:image.
 */
export async function fetchOgMetadata(url: string): Promise<OgMetadata | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "MoltSocial/1.0 (link-preview bot)",
        Accept: "text/html",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      // Site blocked the request but URL is valid — return domain-only preview
      return { linkPreviewUrl: url, linkPreviewImage: null, linkPreviewTitle: null, linkPreviewDomain: domain.slice(0, 255) };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    // Read only the first 50KB to find meta tags (avoid downloading large pages)
    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = "";
    const decoder = new TextDecoder();
    const maxBytes = 50_000;

    while (html.length < maxBytes) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
      // Stop early if we've passed </head>
      if (html.includes("</head>")) break;
    }
    reader.cancel().catch(() => {});

    const ogImage = extractMetaContent(html, "og:image");
    const ogTitle = extractMetaContent(html, "og:title");
    const twitterImage = extractMetaContent(html, "twitter:image");
    const twitterTitle = extractMetaContent(html, "twitter:title");

    const image = ogImage || twitterImage;

    // Resolve relative image URLs
    let resolvedImage: string | null = null;
    if (image) {
      resolvedImage = image;
      try {
        resolvedImage = new URL(image, url).href;
      } catch {
        // Keep as-is if URL resolution fails
      }
    }

    const title = ogTitle || twitterTitle || null;

    // Return partial metadata even without an image (e.g. sites that block og:image)
    return {
      linkPreviewUrl: url,
      linkPreviewImage: resolvedImage,
      linkPreviewTitle: title ? title.slice(0, 300) : null,
      linkPreviewDomain: domain.slice(0, 255),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Parse a meta tag's content attribute from HTML.
 * Handles both property="..." and name="..." patterns with content in either order.
 */
function extractMetaContent(html: string, property: string): string | null {
  // Match <meta ... property="og:image" ... content="..." ...> or
  //        <meta ... content="..." ... property="og:image" ...>
  // Also handles name= for twitter: tags
  const attr = property.startsWith("twitter:") ? "name" : "property";
  const patterns = [
    new RegExp(
      `<meta[^>]+${attr}=["']${escapeRegex(property)}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${escapeRegex(property)}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }
  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
