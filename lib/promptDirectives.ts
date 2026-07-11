export type ContentType = "before_after" | "social_ad";

export const SHARED_BASE_DIRECTIVE =
  "Photorealistic, professional real-estate and marketing photography/videography style. " +
  "Natural, accurate lighting consistent with time of day. Realistic material textures " +
  "(siding, grass, concrete, brick, stone) with authentic imperfections — avoid an overly " +
  "smooth, synthetic, or 'plastic' AI look. Accurate physics and proportions on all " +
  "structures, plants, and objects. No warped edges, no distorted architecture, no floating " +
  "or disconnected elements, no extra or malformed limbs if people are present. Consistent, " +
  "natural color grading — avoid oversaturation or artificial-looking skies/grass. Output " +
  "must look like it could pass as an actual photo or video shot on location, not an " +
  "obviously AI-generated image. Avoid any visible text, logos, or watermarks unless " +
  "explicitly requested. This content is for a real home exterior services company's " +
  "customer-facing marketing — prioritize trustworthiness and realism over stylization or " +
  "artistic flair.";

export const BEFORE_AFTER_DIRECTIVE =
  "This is a before/after transformation. The 'after' state must preserve the exact same " +
  "architecture, camera angle, framing, and structural elements as the 'before' — only the " +
  "specific improved element (cleanliness, lighting, landscaping, paint, etc.) should " +
  "visibly change. Do not alter the house's shape, add or remove windows/doors, change the " +
  "roofline, or shift the camera position between before and after. If video, the " +
  "transformation motion (wipe, dissolve, reveal) should read as smooth and physically " +
  "plausible, not like a jump-cut or glitch. The improvement shown must be realistic and " +
  "achievable by an actual service call — do not exaggerate results beyond what the real " +
  "service could produce.";

export const SOCIAL_AD_DIRECTIVE =
  "This content is for a scroll-stopping Meta/Instagram/TikTok ad or social post. Camera " +
  "motion should be smooth, subtle, and intentional — slow push-ins, gentle pans, or steady " +
  "dolly moves — never shaky, warped, or physically impossible camera paths. Compose the " +
  "shot with a clear focal point within the first frame so it reads instantly on a small " +
  "mobile screen. Favor natural daylight or golden-hour lighting for warmth and " +
  "approachability unless the content specifically calls for a night/evening scene (e.g., " +
  "lighting installs). Avoid busy or cluttered backgrounds that distract from the main " +
  "subject (the house, the work, or the result).";

function specializedDirective(contentType: ContentType): string {
  return contentType === "before_after" ? BEFORE_AFTER_DIRECTIVE : SOCIAL_AD_DIRECTIVE;
}

/**
 * Prepends the shared base directive plus the content-type-specific directive
 * to a per-request prompt, so every kie.ai image/video call carries the same
 * baseline realism and style guardrails.
 */
export function withDirectives(prompt: string, contentType: ContentType): string {
  return `${SHARED_BASE_DIRECTIVE}\n\n${specializedDirective(contentType)}\n\n${prompt}`;
}
