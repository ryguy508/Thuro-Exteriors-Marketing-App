const BASE_URL = "https://api.kie.ai/api/v1/flux/kontext";
const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 40; // ~2 minutes

function hasApiKey(): boolean {
  return Boolean(process.env.KIE_API_KEY);
}

type CreateTaskResponse = {
  code: number;
  msg: string;
  data?: { taskId: string };
};

type RecordInfoResponse = {
  code: number;
  msg: string;
  data?: {
    taskId: string;
    successFlag: 0 | 1 | 2 | 3;
    errorMessage?: string;
    response?: {
      resultImageUrl?: string;
    };
  };
};

/**
 * Edit an existing image using kie.ai's Flux Kontext model.
 */
export async function editImage(
  imageUrl: string,
  instructions: string
): Promise<string> {
  const apiKey = process.env.KIE_API_KEY!;

  const createRes = await fetch(`${BASE_URL}/generate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt: instructions,
      inputImage: imageUrl,
      model: "flux-kontext-pro",
    }),
  });

  const created = (await createRes.json()) as CreateTaskResponse;
  if (!createRes.ok || created.code !== 200 || !created.data?.taskId) {
    throw new Error(`kie.ai task creation failed: ${created.msg}`);
  }

  const taskId = created.data.taskId;

  for (let i = 0; i < MAX_POLLS; i++) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));

    const statusRes = await fetch(
      `${BASE_URL}/record-info?taskId=${encodeURIComponent(taskId)}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const status = (await statusRes.json()) as RecordInfoResponse;
    const flag = status.data?.successFlag;

    if (flag === 1) {
      const url = status.data?.response?.resultImageUrl;
      if (!url) throw new Error("kie.ai reported success but returned no image URL");
      return url;
    }
    if (flag === 2 || flag === 3) {
      throw new Error(
        `kie.ai image edit failed: ${status.data?.errorMessage ?? "unknown error"}`
      );
    }
    // flag === 0 (or undefined) -> still generating, keep polling
  }

  throw new Error("kie.ai image edit timed out waiting for a result");
}

export { hasApiKey as hasKieApiKey };
