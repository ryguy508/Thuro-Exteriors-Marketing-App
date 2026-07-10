import MediaPanel from "@/components/MediaPanel";

export default function GeneratePage() {
  return (
    <div className="page-shell">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-50">Generate</h1>
        <p className="mt-2 text-zinc-400">
          Create a new image or video from a text prompt, or switch to
          &ldquo;Upload &amp; edit&rdquo; below to work from an existing file.
        </p>

        <div className="mt-8">
          <MediaPanel />
        </div>
      </main>
    </div>
  );
}
