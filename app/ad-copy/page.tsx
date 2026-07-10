import MediaPanel from "@/components/MediaPanel";
import CopyPanel from "@/components/CopyPanel";

export default function AdCopyPage() {
  return (
    <div className="page-shell">
      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Ad Copy
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Build a Meta ad: generate or edit the media, and write the script,
          in one place.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <MediaPanel />
          <CopyPanel platform="meta_ad" />
        </div>
      </main>
    </div>
  );
}
