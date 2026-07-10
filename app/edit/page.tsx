import MediaPanel from "@/components/MediaPanel";

export default function EditPage() {
  return (
    <div className="page-shell">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-zinc-50">Edit</h1>
        <p className="mt-2 text-zinc-400">
          Upload a photo or video and tell the AI what to do with it, or
          switch to &ldquo;Generate new&rdquo; below to start from a prompt
          instead.
        </p>

        <div className="mt-8">
          <MediaPanel />
        </div>
      </main>
    </div>
  );
}
