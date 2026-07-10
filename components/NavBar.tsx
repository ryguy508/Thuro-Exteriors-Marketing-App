import Link from "next/link";

const LINKS = [
  { href: "/", label: "Studio" },
  { href: "/generate", label: "Generate" },
  { href: "/edit", label: "Edit" },
  { href: "/ad-copy", label: "Ad Copy" },
  { href: "/social-posts", label: "Social Posts" },
  { href: "/jobs", label: "Customers" },
];

export default function NavBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-zinc-800 bg-black/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center gap-8 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent)] text-sm font-bold text-black">
            T
          </span>
          <span className="text-sm font-semibold text-zinc-50">
            Thuro Exteriors
          </span>
        </Link>
        <div className="flex gap-5 text-sm">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-zinc-400 transition-colors hover:text-[var(--accent)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
