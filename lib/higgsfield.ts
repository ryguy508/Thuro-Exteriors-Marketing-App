export type GenerateMode = "image" | "video";

export type GenerateResult = {
  status: "stub" | "ok";
  message: string;
  outputUrl?: string;
};

export type EditKind = "edit-image" | "animate-image" | "edit-video";

export type EditResult = {
  status: "stub" | "ok";
  message: string;
  outputUrl?: string;
};

function hasApiKey(): boolean {
  return Boolean(process.env.HIGGSFIELD_API_KEY);
}

/**
 * Text prompt -> new image or video.
 * Real Higgsfield call goes here once HIGGSFIELD_API_KEY is set.
 */
export async function generateMedia(
  mode: GenerateMode,
  prompt: string
): Promise<GenerateResult> {
  if (!hasApiKey()) {
    return {
      status: "stub",
      message: `Stub response — no HIGGSFIELD_API_KEY configured yet. Would generate a ${mode} for prompt: "${prompt}"`,
    };
  }

  throw new Error("Higgsfield API integration not yet implemented");
}

/**
 * Upload -> edited still, animated video, or edited video.
 * Real Higgsfield call goes here once HIGGSFIELD_API_KEY is set.
 */
export async function editMedia(
  kind: EditKind,
  instructions: string,
  _file: File
): Promise<EditResult> {
  if (!hasApiKey()) {
    return {
      status: "stub",
      message: `Stub response — no HIGGSFIELD_API_KEY configured yet. Would run "${kind}" with instructions: "${instructions}"`,
    };
  }

  throw new Error("Higgsfield API integration not yet implemented");
}
