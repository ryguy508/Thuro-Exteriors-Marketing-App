export function resultLabel(status: string): string {
  switch (status) {
    case "pending":
      return "Generating...";
    case "stub":
      return "Stub result (no API key yet)";
    case "unsupported":
      return "Not available yet";
    case "no_credits":
      return "Action needed — out of credits";
    case "invalid_key":
      return "Action needed — invalid API key";
    case "provider_error":
      return "Something went wrong";
    default:
      return "Result";
  }
}

export function resultVariant(status: string): "normal" | "warning" {
  return status === "no_credits" ||
    status === "invalid_key" ||
    status === "provider_error"
    ? "warning"
    : "normal";
}
