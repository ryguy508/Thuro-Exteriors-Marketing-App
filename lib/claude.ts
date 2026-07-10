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

/**
 * Service + job details -> ad copy / social caption.
 * Real Claude API call goes here once ANTHROPIC_API_KEY is set.
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

  throw new Error("Claude API integration not yet implemented");
}
