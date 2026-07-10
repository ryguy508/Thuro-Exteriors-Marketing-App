import { uploadScratchFile } from "./storage";
import { editImage as kieEditImage, hasKieApiKey } from "./kie";
import { classifyProviderError } from "./providerError";

export type GenerateMode = "image" | "video";

export type GenerateResult = {
  status: "stub" | "ok";
  message: string;
  outputUrl?: string;
};

export type EditKind = "edit-image" | "animate-image" | "edit-video";

export type EditResult = {
  status: "stub" | "ok" | "unsupported";
  message: string;
  outputUrl?: string;
};

const BASE_URL = "https://platform.higgsfield.ai";
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 60; // ~3 minutes

function hasApiKey(): boolean {
  return Boolean(process.env.HIGGSFIELD_CREDENTIALS);
}

type V2Response = {
  status: "queued" | "in_progress" | "completed" | "failed" | "nsfw";
  request_id: string;
  images?: { url: string }[];
  video?: { url: string };
};

/**
 * Calls a Higgsfield v2 endpoint directly and polls until completion.
 *
 * Bypasses the @higgsfield/client SDK's subscribe() method — as of the
 * installed version, it sends the input fields flat, but the live API
 * requires them wrapped in a "params" object (confirmed against the real
 * API: a flat body returns "body.params: Field required").
 */
async function subscribeRaw(
  endpoint: string,
  params: Record<string, unknown>
): Promise<V2Response> {
  const creds = process.env.HIGGSFIELD_CREDENTIALS!;

  const createRes = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${creds}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ params }),
  });

  const created = await createRes.json();
  if (!createRes.ok || created.detail) {
    throw classifyProviderError("Higgsfield", {
      status: createRes.status,
      message:
        typeof created.detail === "string"
          ? created.detail
          : JSON.stringify(created.detail ?? created),
    });
  }

  let current: V2Response = created;
  for (let i = 0; i < MAX_POLLS; i++) {
    if (
      current.status === "completed" ||
      current.status === "failed" ||
      current.status === "nsfw"
    ) {
      return current;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const statusRes = await fetch(
      `${BASE_URL}/requests/${current.request_id}/status`,
      { headers: { Authorization: `Key ${creds}` } }
    );
    const statusBody = await statusRes.json();
    if (!statusRes.ok || statusBody.detail) {
      throw classifyProviderError("Higgsfield", {
        status: statusRes.status,
        message:
          typeof statusBody.detail === "string"
            ? statusBody.detail
            : JSON.stringify(statusBody.detail ?? statusBody),
      });
    }
    current = statusBody;
  }

  throw new Error("Higgsfield request timed out waiting for a result");
}

async function generateImage(prompt: string): Promise<string> {
  const response = await subscribeRaw("/v1/text2image/soul", {
    prompt,
    width_and_height: "1536x1536",
    quality: "1080p",
    batch_size: 1,
  });

  const url = response.images?.[0]?.url;
  if (response.status !== "completed" || !url) {
    throw new Error(`Higgsfield image generation did not complete (status: ${response.status})`);
  }
  return url;
}

async function animateImageUrl(
  imageUrl: string,
  prompt: string
): Promise<string> {
  const response = await subscribeRaw("/v1/image2video/dop", {
    model: "dop-turbo",
    prompt,
    input_images: [{ type: "image_url", image_url: imageUrl }],
  });

  const url = response.video?.url;
  if (response.status !== "completed" || !url) {
    throw new Error(`Higgsfield video generation did not complete (status: ${response.status})`);
  }
  return url;
}

/**
 * Text prompt -> new image or video.
 */
export async function generateMedia(
  mode: GenerateMode,
  prompt: string
): Promise<GenerateResult> {
  if (!hasApiKey()) {
    return {
      status: "stub",
      message: `Stub response — no HIGGSFIELD_CREDENTIALS configured yet. Would generate a ${mode} for prompt: "${prompt}"`,
    };
  }

  if (mode === "image") {
    const outputUrl = await generateImage(prompt);
    return { status: "ok", message: "Image generated.", outputUrl };
  }

  // No confirmed pure text-to-video endpoint exists yet, so we chain:
  // generate a still image from the prompt, then animate that image.
  const imageUrl = await generateImage(prompt);
  const outputUrl = await animateImageUrl(imageUrl, prompt);
  return {
    status: "ok",
    message: "Video generated (via generated image, then animated).",
    outputUrl,
  };
}

/**
 * Upload -> edited still, animated video, or edited video.
 */
export async function editMedia(
  kind: EditKind,
  instructions: string,
  file: File
): Promise<EditResult> {
  if (kind === "edit-image") {
    if (!hasKieApiKey()) {
      return {
        status: "stub",
        message: `Stub response — no KIE_API_KEY configured yet. Would edit the photo with instructions: "${instructions}"`,
      };
    }
    const imageUrl = await uploadScratchFile(file);
    const outputUrl = await kieEditImage(imageUrl, instructions);
    return { status: "ok", message: "Photo edited.", outputUrl };
  }

  if (kind === "animate-image") {
    if (!hasApiKey()) {
      return {
        status: "stub",
        message: `Stub response — no HIGGSFIELD_CREDENTIALS configured yet. Would animate the photo with instructions: "${instructions}"`,
      };
    }
    const imageUrl = await uploadScratchFile(file);
    const outputUrl = await animateImageUrl(imageUrl, instructions);
    return { status: "ok", message: "Video generated from photo.", outputUrl };
  }

  return {
    status: "unsupported",
    message: `"${kind}" isn't available yet — no confirmed API endpoint exists for editing an existing video.`,
  };
}
