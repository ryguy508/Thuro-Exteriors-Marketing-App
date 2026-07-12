import { uploadScratchFile } from "./storage";
import { classifyProviderError, type ProviderErrorStatus } from "./providerError";
import { withDirectives, type ContentType } from "./promptDirectives";

export type { ContentType };

export type MediaKind = "image" | "video";
export type GenerateMode = MediaKind;

export type EditKind = "edit-image" | "animate-image" | "edit-video";

export type StartResult =
  | { status: "pending"; taskId: string; mediaKind: MediaKind }
  | { status: "stub"; message: string }
  | { status: "unsupported"; message: string };

export type CheckResult =
  | { status: "pending" }
  | { status: "ok"; outputUrl: string }
  | { status: ProviderErrorStatus; message: string };

const JOBS_BASE = "https://api.kie.ai/api/v1/jobs";
const VEO_BASE = "https://api.kie.ai/api/v1/veo";

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
 * like OpenAI's GPT Image 2) and returns the taskId. This only starts
 * the job — it does not wait for it to finish, since GPT Image 2 and
 * especially Veo3 can take well past any serverless function's execution
 * limit. Callers must poll checkImageTask separately.
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

async function checkImageTask(taskId: string): Promise<CheckResult> {
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
    if (!url) return { status: "provider_error", message: "kie.ai reported success but returned no result URL" };
    return { status: "ok", outputUrl: url };
  }
  if (state === "fail") {
    const err = classifyProviderError("kie.ai", {
      status: res.status !== 200 ? res.status : undefined,
      message: body.data?.failMsg ?? "unknown error",
    });
    return { status: err.status, message: err.message };
  }
  // waiting / queuing / generating (or missing state while the task just started)
  return { status: "pending" };
}

/**
 * Starts a new image generation (or edit, when imageUrls is given) using
 * OpenAI's GPT Image 2 — kie.ai's newest and most accurate image model —
 * and returns the taskId to poll.
 */
async function startImage(
  prompt: string,
  contentType: ContentType,
  imageUrls?: string[]
): Promise<string> {
  const usingReference = Boolean(imageUrls?.length);
  return createJobsTask(usingReference ? "gpt-image-2-image-to-image" : "gpt-image-2-text-to-image", {
    prompt: withDirectives(prompt, contentType),
    ...(usingReference ? { input_urls: imageUrls } : {}),
    aspect_ratio: "1:1",
    resolution: "2K",
  });
}

type VeoCreateResponse = { code: number; msg: string; data?: { taskId: string } };

async function createVeoTask(
  prompt: string,
  contentType: ContentType,
  imageUrls?: string[]
): Promise<string> {
  // kie.ai only allows image-referenced generation (REFERENCE_2_VIDEO) on the
  // Fast/Lite Veo3 tiers — the full "veo3" model rejects it with "Reference
  // to video only supports the Veo Fast model and Veo Lite model." Pure
  // text-to-video has no such restriction, so it stays on the full model at
  // its max 4K resolution.
  const usingReference = Boolean(imageUrls?.length);
  const res = await fetch(`${VEO_BASE}/generate`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      prompt: withDirectives(prompt, contentType),
      model: usingReference ? "veo3_fast" : "veo3",
      generationType: usingReference ? "REFERENCE_2_VIDEO" : "TEXT_2_VIDEO",
      ...(usingReference ? { imageUrls } : {}),
      aspect_ratio: "16:9",
      resolution: usingReference ? "1080p" : "4k",
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

async function checkVideoTask(taskId: string): Promise<CheckResult> {
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
    if (!url) return { status: "provider_error", message: "kie.ai reported success but returned no video URL" };
    return { status: "ok", outputUrl: url };
  }
  if (flag === 2 || flag === 3) {
    const err = classifyProviderError("kie.ai", {
      status: res.status !== 200 ? res.status : undefined,
      message: body.data?.errorMessage ?? "unknown error",
    });
    return { status: err.status, message: err.message };
  }
  // flag === 0 (or undefined) -> still generating
  return { status: "pending" };
}

/**
 * Starts a new video generation from a text prompt, or animation of
 * existing image(s) (when imageUrls is given), using Google's Veo 3 — kie.ai's
 * flagship video model — and returns the taskId to poll.
 */
async function startVideo(
  prompt: string,
  contentType: ContentType,
  imageUrls?: string[]
): Promise<string> {
  return createVeoTask(prompt, contentType, imageUrls);
}

/**
 * Checks the status of a previously-started task. Each call does exactly one
 * network round trip to kie.ai — callers (the client, via a fast status
 * route) are responsible for re-polling every few seconds until the result
 * is no longer "pending". This is deliberately not a server-side sleep loop:
 * Nano Banana Pro and especially Veo3 can take well past any serverless
 * function's execution limit, and a synchronous loop would get killed by the
 * host mid-generation — after kie.ai had already started (and billed) the
 * job — leaving the client with nothing to show for it.
 */
export async function checkTask(taskId: string, mediaKind: MediaKind): Promise<CheckResult> {
  return mediaKind === "image" ? checkImageTask(taskId) : checkVideoTask(taskId);
}

/**
 * Text prompt -> starts a new image or video generation.
 */
export async function startGenerate(
  mode: MediaKind,
  prompt: string,
  contentType: ContentType = "social_ad"
): Promise<StartResult> {
  if (!hasApiKey()) {
    return {
      status: "stub",
      message: `Stub response — no KIE_API_KEY configured yet. Would generate a ${mode} for prompt: "${prompt}"`,
    };
  }

  const taskId =
    mode === "image"
      ? await startImage(prompt, contentType)
      : await startVideo(prompt, contentType);
  return { status: "pending", taskId, mediaKind: mode };
}

/**
 * Upload -> starts an edited still, animated video, or (unsupported) edited
 * video. Accepts multiple reference photos for edit-image and animate-image,
 * since the underlying models (GPT Image 2's input_urls, Veo3's
 * REFERENCE_2_VIDEO imageUrls) both take an array of reference images.
 */
export async function startEdit(
  kind: EditKind,
  instructions: string,
  files: File[],
  contentType: ContentType = "social_ad"
): Promise<StartResult> {
  if (!hasApiKey()) {
    return {
      status: "stub",
      message: `Stub response — no KIE_API_KEY configured yet. Would process ${files.length} photo(s) (${kind}) with instructions: "${instructions}"`,
    };
  }

  if (kind === "edit-image") {
    const imageUrls = await Promise.all(files.map(uploadScratchFile));
    const taskId = await startImage(instructions, contentType, imageUrls);
    return { status: "pending", taskId, mediaKind: "image" };
  }

  if (kind === "animate-image") {
    const imageUrls = await Promise.all(files.map(uploadScratchFile));
    const taskId = await startVideo(instructions, contentType, imageUrls);
    return { status: "pending", taskId, mediaKind: "video" };
  }

  return {
    status: "unsupported",
    message: `"${kind}" isn't available yet — no confirmed kie.ai endpoint exists for editing an existing video.`,
  };
}

export { hasApiKey as hasKieApiKey };
