import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-foreground">
      <h1 className="font-mono text-6xl font-bold text-cyan">404</h1>
      <p className="mt-4 text-lg text-muted">This page doesn&apos;t exist</p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-cyan px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-cyan/90"
      >
        Go Home
      </Link>
    </div>
  );
}
