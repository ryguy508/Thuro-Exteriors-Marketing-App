export type ProviderErrorStatus = "no_credits" | "invalid_key" | "provider_error";

export class ProviderError extends Error {
  status: ProviderErrorStatus;
  provider: string;

  constructor(provider: string, status: ProviderErrorStatus, message: string) {
    super(message);
    this.provider = provider;
    this.status = status;
  }
}

function friendlyMessage(
  provider: string,
  status: ProviderErrorStatus,
  detail: string
): string {
  if (status === "no_credits") {
    return `${provider} account is out of credits. Add funds at their billing page, then try again — no other changes needed.`;
  }
  if (status === "invalid_key") {
    return `${provider} rejected the API key (invalid, revoked, or expired). Generate a new key and update it in the app's environment variables.`;
  }
  return `${provider} request failed: ${detail}`;
}

/**
 * Inspects an error thrown by any provider SDK/fetch call and classifies it
 * into a ProviderError with a message the UI can show directly to the user.
 */
export function classifyProviderError(
  provider: string,
  err: unknown
): ProviderError {
  const anyErr = err as {
    status?: number;
    statusCode?: number;
    message?: string;
    error?: { error?: { type?: string; message?: string } };
  };

  const httpStatus = anyErr?.status ?? anyErr?.statusCode;
  const rawMessage =
    anyErr?.error?.error?.message ?? anyErr?.message ?? String(err);
  const lowerMessage = rawMessage.toLowerCase();

  let status: ProviderErrorStatus = "provider_error";

  if (
    httpStatus === 401 ||
    lowerMessage.includes("invalid api key") ||
    lowerMessage.includes("invalid credentials") ||
    lowerMessage.includes("authentication")
  ) {
    status = "invalid_key";
  } else if (
    httpStatus === 402 ||
    httpStatus === 403 ||
    lowerMessage.includes("credit balance") ||
    lowerMessage.includes("insufficient credit") ||
    lowerMessage.includes("not enough credit") ||
    lowerMessage.includes("out of credit")
  ) {
    status = "no_credits";
  }

  return new ProviderError(provider, status, friendlyMessage(provider, status, rawMessage));
}

/**
 * Converts any thrown error into a JSON-safe result the UI can render.
 * Always returns something displayable — never lets a raw exception surface.
 */
export function errorToResult(
  err: unknown
): { status: ProviderErrorStatus; message: string } {
  if (err instanceof ProviderError) {
    return { status: err.status, message: err.message };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { status: "provider_error", message };
}
