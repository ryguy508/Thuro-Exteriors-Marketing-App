import { uploadScratchFile } from "./storage";
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

const JOBS_BASE = "https://api.kie.ai/api/v1/jobs";
const VEO_BASE = "https://api.kie.ai/api/v1/veo";
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 60; // ~3 minutes

function hasApiKey(): boolean {
  return Boolean(process.env.KIE_API_KEY);
}

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${process.env.KIE_API_KEY!}`,
    "Content-Type": "application/json",
  };
}

type CreateTaskResponse = { code: number; msg: string; data?: { taskId: string } };

/**
 * Creates a task on kie.ai's unified Market jobs API (used for image models
 * like Google's Nano Banana Pro) and returns the taskId.
 */
async function createJobsTask(
  model: string,
  input: Record<string, unknown>
): Promise<string> {
  const res = await fetch(`${JOBS_BASE}/createTask`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ model, input }),
  });

  const body = (await res.json()) as CreateTaskResponse;
  if (!res.ok || body.code !== 200 || !body.data?.taskId) {
    throw classifyProviderError("kie.ai", {
      status: res.status !== 200 ? res.status : body.code,
      message: body.msg,
    });
  }
  return body.data.taskId;
}

type JobsRecordInfoResponse = {
  code: number;
  msg: string;
  data?: {
    state: "waiting" | "queuing" | "generating" | "success" | "fail";
    resultJson?: string;
    failMsg?: string;
  };
};

async function pollJobsTask(taskId: string): Promise<string> {
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const res = await fetch(
      `${JOBS_BASE}/recordInfo?taskId=${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${process.env.KIE_API_KEY!}` } }
    );
    const body = (await res.json()) as JobsRecordInfoResponse;
    const state = body.data?.state;

    if (state === "success") {
      const resultUrls = body.data?.resultJson
        ? (JSON.parse(body.data.resultJson).resultUrls as string[] | undefined)
        : undefined;
      const url = resultUrls?.[0];
      if (!url) throw new Error("kie.ai reported success but returned no result URL");
      return url;
    }
    if (state === "fail") {
      throw classifyProviderError("kie.ai", {
        status: res.status !== 200 ? res.status : undefined,
        message: body.data?.failMsg ?? "unknown error",
      });
    }
    // waiting / queuing / generating -> keep polling
  }

  throw new Error("kie.ai image task timed out waiting for a result");
}

/**
 * Generate a new image from a text prompt, or edit an existing image (when
 * imageUrl is provided), using Google's Nano Banana Pro (Gemini 3 Pro Image)
 * — kie.ai's flagship image model.
 */
async function generateImage(prompt: string, imageUrls?: string[]): Promise<string> {
  const taskId = await createJobsTask("nano-banana-pro", {
    prompt,
    ...(imageUrls?.length ? { image_input: imageUrls } : {}),
    aspect_ratio: "1:1",
    resolution: "2K",
    output_format: "png",
  });
  return pollJobsTask(taskId);
}

type VeoCreateResponse = { code: number; msg: string; data?: { taskId: string } };

async function createVeoTask(prompt: string, imageUrls?: string[]): Promise<string> {
  const res = await fetch(`${VEO_BASE}/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      prompt,
      model: "veo3",
      generationType: imageUrls?.length ? "REFERENCE_2_VIDEO" : "TEXT_2_VIDEO",
      ...(imageUrls?.length ? { imageUrls } : {}),
      aspect_ratio: "16:9",
      resolution: "4k",
    }),
  });

  const body = (await res.json()) as VeoCreateResponse;
  if (!res.ok || body.code !== 200 || !body.data?.taskId) {
    throw classifyProviderError("kie.ai", {
      status: res.status !== 200 ? res.status : body.code,
      message: body.msg,
    });
  }
  return body.data.taskId;
}

type VeoRecordInfoResponse = {
  code: number;
  msg: string;
  data?: {
    successFlag: 0 | 1 | 2 | 3;
    errorMessage?: string;
    response?: { resultUrls?: string[]; fullResultUrls?: string[] };
  };
};

async function pollVeoTask(taskId: string): Promise<string> {
  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const res = await fetch(
      `${VEO_BASE}/record-info?taskId=${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${process.env.KIE_API_KEY!}` } }
    );
    const body = (await res.json()) as VeoRecordInfoResponse;
    const flag = body.data?.successFlag;

    if (flag === 1) {
      const url =
        body.data?.response?.fullResultUrls?.[0] ??
        body.data?.response?.resultUrls?.[0];
      if (!url) throw new Error("kie.ai reported success but returned no video URL");
      return url;
    }
    if (flag === 2 || flag === 3) {
      throw classifyProviderError("kie.ai", {
        status: res.status !== 200 ? res.status : undefined,
        message: body.data?.errorMessage ?? "unknown error",
      });
    }
    // flag === 0 (or undefined) -> still generating, keep polling
  }

  throw new Error("kie.ai video task timed out waiting for a result");
}

/**
 * Generate a new video from a text prompt, or animate existing image(s)
 * (when imageUrls is provided), using Google's Veo 3 — kie.ai's flagship
 * video model.
 */
async function generateVideo(prompt: string, imageUrls?: string[]): Promise<string> {
  const taskId = await createVeoTask(prompt, imageUrls);
  return pollVeoTask(taskId);
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
      message: `Stub response — no KIE_API_KEY configured yet. Would generate a ${mode} for prompt: "${prompt}"`,
    };
  }

  if (mode === "image") {
    const outputUrl = await generateImage(prompt);
    return { status: "ok", message: "Image generated.", outputUrl };
  }

  const outputUrl = await generateVideo(prompt);
  return { status: "ok", message: "Video generated.", outputUrl };
}

/**
 * Upload -> edited still, animated video, or edited video. Accepts multiple
 * reference photos for edit-image and animate-image, since kie.ai's
 * underlying models (Nano Banana Pro's image_input, Veo3's REFERENCE_2_VIDEO
 * imageUrls) both take an array of reference images.
 */
export async function editMedia(
  kind: EditKind,
  instructions: string,
  files: File[]
): Promise<EditResult> {
  if (!hasApiKey()) {
    return {
      status: "stub",
      message: `Stub response — no KIE_API_KEY configured yet. Would process ${files.length} photo(s) (${kind}) with instructions: "${instructions}"`,
    };
  }

  if (kind === "edit-image") {
    const imageUrls = await Promise.all(files.map(uploadScratchFile));
    const outputUrl = await generateImage(instructions, imageUrls);
    return { status: "ok", message: "Photo edited.", outputUrl };
  }

  if (kind === "animate-image") {
    const imageUrls = await Promise.all(files.map(uploadScratchFile));
    const outputUrl = await generateVideo(instructions, imageUrls);
    return { status: "ok", message: "Video generated from photo.", outputUrl };
  }

  return {
    status: "unsupported",
    message: `"${kind}" isn't available yet — no confirmed kie.ai endpoint exists for editing an existing video.`,
  };
}

export { hasApiKey as hasKieApiKey };
