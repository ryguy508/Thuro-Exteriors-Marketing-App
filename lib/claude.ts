import Anthropic from "@anthropic-ai/sdk";

export type AdCopyRequest = {
  serviceType: string;
  platform: "meta_ad" | "social_post";
  details: string;
};

export type AdCopyResult = {
  status: "stub" | "ok";
  message: string;
  copy?: string;
};

function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

function buildPrompt(req: AdCopyRequest): string {
  const serviceLabel = req.serviceType.replace(/_/g, " ");

  if (req.platform === "meta_ad") {
    return `Write a Meta (Facebook/Instagram) lead ad for a home services business called Thuro Exteriors, based in Conway, SC.

Service: ${serviceLabel}
Job details: ${req.details}

Write a short, high-converting ad: an attention-grabbing hook, 2-3 sentences of body copy, and a clear call to action. Keep it under 150 words. Return only the ad copy, no preamble.`;
  }

  return `Write a casual social media caption (Instagram/Facebook post, not an ad) for a home services business called Thuro Exteriors, based in Conway, SC.

Service: ${serviceLabel}
Post details: ${req.details}

Keep it short, friendly, and authentic — a few sentences plus a couple of relevant hashtags. Return only the caption, no preamble.`;
}

/**
 * Service + job details -> ad copy / social caption.
 */
export async function generateAdCopy(
  req: AdCopyRequest
): Promise<AdCopyResult> {
  if (!hasApiKey()) {
    return {
      status: "stub",
      message: `Stub response — no ANTHROPIC_API_KEY configured yet. Would generate ${req.platform.replace(
        "_",
        " "
      )} copy for ${req.serviceType} using details: "${req.details}"`,
    };
  }

  const client = new Anthropic();

  const response = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    output_config: { effort: "low" },
    messages: [{ role: "user", content: buildPrompt(req) }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  const copy = textBlock && textBlock.type === "text" ? textBlock.text : "";

  return {
    status: "ok",
    message: copy,
    copy,
  };
}
