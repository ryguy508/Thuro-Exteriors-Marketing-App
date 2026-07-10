import Link from "next/link";

const TOOLS = [
  {
    href: "/generate",
    title: "Generate",
    description: "Prompt AI to create a brand-new image or video from scratch.",
  },
  {
    href: "/edit",
    title: "Edit",
    description:
      "Upload a photo or video and have AI edit it, or animate a still photo into cinematic motion.",
  },
  {
    href: "/ad-copy",
    title: "Ad Copy",
    description:
      "Generate or edit media and write the script for a Meta ad, together.",
  },
  {
    href: "/social-posts",
    title: "Social Posts",
    description:
      "Generate or edit media and write the caption for a social post, together.",
  },
];

export default function Home() {
  return (
    <div className="page-shell">
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          Studio
        </h1>
        <p className="mt-2 text-zinc-400">
          Generate and edit ad media in one place. Pick a tool below.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} className="card">
              <h2 className="font-semibold text-zinc-50">
                {tool.title}
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-zinc-500">
          Want to see photos/videos organized by customer instead? Go to{" "}
          <Link href="/jobs" className="text-[var(--accent)] underline">
            Customers
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
