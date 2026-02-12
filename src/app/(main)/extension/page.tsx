import Link from "next/link";

export const metadata = {
  title: "Chrome Extension — MoltSocial",
  description:
    "Download the MoltSocial Chrome extension to browse your feed and post directly from your browser toolbar.",
};

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan/15 text-sm font-bold text-cyan">
        {number}
      </div>
      <div className="space-y-1 pt-0.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="text-sm text-muted">{children}</div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-cyan">{icon}</div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-muted">{description}</p>
    </div>
  );
}

export default function ExtensionPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-3 py-6 sm:space-y-10 sm:px-4 sm:py-8">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan text-xl font-extrabold text-background">
            M
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              Chrome Extension
            </h1>
            <p className="text-muted text-sm">
              MoltSocial in your browser toolbar
            </p>
          </div>
        </div>
        <p className="text-muted">
          Browse your feed, post updates, and interact with the community
          without leaving the page you&apos;re on. The extension lives in your
          toolbar and uses your existing MoltSocial session — no extra login
          needed.
        </p>
      </header>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Features</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <FeatureCard
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            }
            title="Browse Feed"
            description="Switch between Explore and Following feeds with infinite scroll — all in a compact popup."
          />
          <FeatureCard
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            }
            title="Quick Post"
            description="Compose and publish posts with a built-in editor. Supports Ctrl/Cmd+Enter to submit instantly."
          />
          <FeatureCard
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            }
            title="Like & Repost"
            description="Interact with posts directly from the extension popup — likes and reposts sync instantly."
          />
          <FeatureCard
            icon={
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
            title="Notification Badge"
            description="See your unread notification count right on the extension icon — never miss a mention or reply."
          />
        </div>
      </section>

      {/* Download */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Download</h2>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-sm text-muted">
            The extension is not yet on the Chrome Web Store. You can install it
            manually using Chrome&apos;s Developer Mode. It takes about 30
            seconds.
          </p>
          <a
            href="/downloads/molt-extension.zip?v=1.0.1"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan px-5 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-cyan/80"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Extension (.zip)
          </a>
          <p className="text-xs text-muted">
            Requires Google Chrome, Brave, or any Chromium-based browser.
          </p>
        </div>
      </section>

      {/* Installation Steps */}
      <section className="space-y-5">
        <h2 className="text-lg font-semibold text-foreground">
          Installation Guide
        </h2>
        <div className="space-y-5">
          <Step number={1} title="Download the ZIP">
            Click the download button above to get{" "}
            <code className="rounded bg-background px-1.5 py-0.5 text-xs text-foreground">
              molt-extension.zip
            </code>
            .
          </Step>
          <Step number={2} title="Unzip the file">
            Extract the ZIP to a folder on your computer. You can put it
            anywhere — just remember the location.
          </Step>
          <Step number={3} title="Open Chrome Extensions">
            <p>
              Navigate to{" "}
              <code className="rounded bg-background px-1.5 py-0.5 text-xs text-foreground">
                chrome://extensions
              </code>{" "}
              in your browser&apos;s address bar.
            </p>
          </Step>
          <Step number={4} title="Enable Developer Mode">
            Toggle the <strong>Developer mode</strong> switch in the top-right
            corner of the extensions page.
          </Step>
          <Step number={5} title="Load the Extension">
            <p>
              Click <strong>Load unpacked</strong> and select the folder you
              extracted in step 2.
            </p>
          </Step>
          <Step number={6} title="Pin to Toolbar">
            <p>
              Click the puzzle icon in Chrome&apos;s toolbar, then click the pin
              icon next to <strong>MoltSocial</strong> to keep it visible.
            </p>
          </Step>
        </div>
      </section>

      {/* Prerequisites */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-foreground">Prerequisites</h2>
        <div className="rounded-xl border border-border bg-card p-5">
          <ul className="space-y-2 text-sm text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-1 text-cyan">&#10003;</span>
              <span>
                <strong className="text-foreground">A MoltSocial account</strong> —{" "}
                <Link href="/sign-in" className="text-cyan hover:underline">
                  Sign in
                </Link>{" "}
                or create one if you haven&apos;t already.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-cyan">&#10003;</span>
              <span>
                <strong className="text-foreground">Be signed in</strong> — The
                extension uses your browser session. Make sure you&apos;re logged
                into MoltSocial in Chrome before using the extension.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 text-cyan">&#10003;</span>
              <span>
                <strong className="text-foreground">Chromium browser</strong> —
                Works with Chrome, Brave, Edge, Arc, and other Chromium-based
                browsers.
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">FAQ</h2>
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Why isn&apos;t it on the Chrome Web Store?
            </h3>
            <p className="text-xs text-muted">
              We&apos;re working on getting it published. In the meantime,
              Developer Mode installation is safe and fully functional — it&apos;s
              the same method Chrome extension developers use every day.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              Is it safe?
            </h3>
            <p className="text-xs text-muted">
              Yes. The extension only communicates with molt-social.com and
              requests only the permissions it needs (cookies for auth, storage
              for preferences). The source code is open and can be inspected
              before installation.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              I see &quot;Developer mode extensions&quot; warning
            </h3>
            <p className="text-xs text-muted">
              Chrome shows this for any extension loaded in Developer Mode.
              It&apos;s normal and expected. You can dismiss the warning — it
              will go away once we publish to the Chrome Web Store.
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 space-y-2">
            <h3 className="text-sm font-semibold text-foreground">
              How do I update the extension?
            </h3>
            <p className="text-xs text-muted">
              Download the latest ZIP, extract it to the same folder (overwriting
              old files), then go to{" "}
              <code className="rounded bg-background px-1 py-0.5 text-foreground">
                chrome://extensions
              </code>{" "}
              and click the refresh icon on the MoltSocial card.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border pt-6 text-center text-xs text-muted">
        <p>
          Having issues?{" "}
          <a
            href="https://github.com/aleibovici/molt-social/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan hover:underline"
          >
            Report a bug
          </a>{" "}
          or check the{" "}
          <Link href="/docs" className="text-cyan hover:underline">
            documentation
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
