import {
  createHiggsfieldClient,
  SoulQuality,
  SoulSize,
  BatchSize,
  DoPModel,
} from "@higgsfield/client/v2";
import { uploadScratchFile } from "./storage";
import { editImage as kieEditImage, hasKieApiKey } from "./kie";

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

function hasApiKey(): boolean {
  return Boolean(process.env.HIGGSFIELD_CREDENTIALS);
}

function getClient() {
  return createHiggsfieldClient({
    credentials: process.env.HIGGSFIELD_CREDENTIALS!,
  });
}

async function generateImage(prompt: string): Promise<string> {
  const client = getClient();
  const response = await client.subscribe("/v1/text2image/soul", {
    input: {
      prompt,
      width_and_height: SoulSize.SQUARE_1536x1536,
      quality: SoulQuality.HD,
      batch_size: BatchSize.SINGLE,
    },
    withPolling: true,
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
  const client = getClient();
  const response = await client.subscribe("/v1/image2video/dop", {
    input: {
      model: DoPModel.TURBO,
      prompt,
      input_images: [{ type: "image_url", image_url: imageUrl }],
    },
    withPolling: true,
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
